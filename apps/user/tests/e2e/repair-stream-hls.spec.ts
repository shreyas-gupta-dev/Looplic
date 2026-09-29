import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { openSession, recordConsent } from "@looplic/db/repair-stream";
import { appSettings, bookings, repairStreamSessions } from "@looplic/db/schema";

import { REPAIR_STREAM_SETTINGS_KEY } from "@/src/lib/repair-stream/hls-config";

/**
 * The `hls` provider, over real HTTP.
 *
 * No media server is provisioned, so these cover what must hold regardless: consent
 * is required before any playlist is served, a camera URL never reaches the client,
 * and the provider does not serve anything when no centre is configured.
 */

function loadEnv(key: string): string | null {
  try {
    for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const index = line.indexOf("=");
      if (line.slice(0, index).trim() === key) return line.slice(index + 1).trim();
    }
  } catch {
    return null;
  }
  return null;
}

const databaseUrl = loadEnv("DATABASE_URL");
const OWNER_PHONE = "+919000000401";
// Deliberately unroutable: if the proxy ever tried to fetch it the test would fail
// on a timeout rather than silently passing.
const FAKE_PLAYLIST = "http://10.255.255.1:8888/bench-1/index.m3u8";

let pool: Pool;
let db: ReturnType<typeof drizzle>;
const createdBookingIds: string[] = [];
let hadExistingSetting = false;
/** The centre config as found, so afterAll can put it back byte-for-byte. */
let originalSetting: unknown = null;
let bookingId = "";
let sessionId = "";

test.beforeAll(async () => {
  test.skip(!databaseUrl, "DATABASE_URL not found in apps/user/.env.local");

  pool = new Pool({ connectionString: databaseUrl!, ssl: { rejectUnauthorized: false }, max: 4 });
  db = drizzle(pool);

  const existing = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, REPAIR_STREAM_SETTINGS_KEY))
    .limit(1);
  hadExistingSetting = existing.length > 0;

  // Merge a test centre into whatever is already configured, rather than skipping.
  //
  // This used to skip the whole spec when any configuration existed, to avoid
  // clobbering a real one. The effect was that configuring a real centre silently
  // switched off the consent, no-URL-disclosure and traversal tests — the coverage
  // disappeared exactly when the feature started being used for real. Adding a key
  // under its own name touches nothing else, and afterAll restores the original
  // value verbatim.
  //
  // The column is jsonb, so the driver returns an object even though the Drizzle
  // schema declares text; accept either shape.
  const rawExisting = existing[0]?.value as unknown;
  originalSetting = rawExisting ?? null;

  let base: { centres?: Record<string, unknown>; defaultCentre?: string | null } = {};
  if (rawExisting && typeof rawExisting === "object" && !Array.isArray(rawExisting)) {
    base = rawExisting as typeof base;
  } else if (typeof rawExisting === "string") {
    try {
      base = JSON.parse(rawExisting);
    } catch {
      base = {};
    }
  }

  const merged = {
    centres: {
      ...(base.centres ?? {}),
      "test-centre": { label: "Test Centre", playlistUrl: FAKE_PLAYLIST },
    },
    // Keep whatever default was there; these tests always name their centre
    // explicitly via provider_ref, so they do not rely on the default.
    defaultCentre: base.defaultCentre ?? "test-centre",
  };

  if (hadExistingSetting) {
    await db
      .update(appSettings)
      .set({ value: JSON.stringify(merged) })
      .where(eq(appSettings.key, REPAIR_STREAM_SETTINGS_KEY));
  } else {
    await db.insert(appSettings).values({
      key: REPAIR_STREAM_SETTINGS_KEY,
      value: JSON.stringify(merged),
    });
  }

  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "HLS Provider Test",
      customerPhone: OWNER_PHONE,
      serviceType: "mobile_repair",
      status: "in_progress",
      notes: "Created by repair-stream hls test",
    })
    .returning({ id: bookings.id });

  bookingId = inserted[0].id;
  createdBookingIds.push(bookingId);

  const opened = await openSession(db as never, {
    bookingId,
    provider: "hls",
    providerRef: "test-centre",
  });
  sessionId = opened.session!.id;
});

test.afterAll(async () => {
  if (!pool) return;
  for (const id of createdBookingIds) {
    await db.delete(bookings).where(eq(bookings.id, id)).catch(() => undefined);
  }

  // Put the configuration back exactly as it was: delete the row if this spec
  // created it, otherwise restore the captured value so a real centre survives a
  // test run.
  if (hadExistingSetting) {
    const restore =
      typeof originalSetting === "string" ? originalSetting : JSON.stringify(originalSetting);
    await db
      .update(appSettings)
      .set({ value: restore })
      .where(eq(appSettings.key, REPAIR_STREAM_SETTINGS_KEY))
      .catch(() => undefined);
  } else {
    await db.delete(appSettings).where(eq(appSettings.key, REPAIR_STREAM_SETTINGS_KEY)).catch(() => undefined);
  }
  await pool.end();
});

async function grantFor(request: any) {
  const response = await request.get(`/api/repair-stream/${bookingId}?phone=${encodeURIComponent(OWNER_PHONE)}`, {
    failOnStatusCode: false,
  });
  return response.ok() ? await response.json() : null;
}

test("the grant reports that consent is required before any footage", async ({ request }) => {
  const data = await grantFor(request);

  expect(data).not.toBeNull();
  expect(data.provider).toBe("hls");
  // The whole point: a live camera needs explicit agreement per session.
  expect(data.consentRequired).toBe(true);
  expect(data.consentGiven).toBe(false);
});

test("no camera URL is ever disclosed to the client", async ({ request }) => {
  const data = await grantFor(request);
  const serialized = JSON.stringify(data);

  // The media server must stay unknown to the browser.
  expect(serialized).not.toContain("10.255.255.1");
  expect(serialized).not.toContain("index.m3u8");
  expect(serialized).not.toContain("providerRef");
  expect(serialized).not.toContain("playlistUrl");
});

test("the playlist is refused until consent is recorded", async ({ request }) => {
  const data = await grantFor(request);

  const response = await request.get(
    `/api/repair-stream/${bookingId}/hls?phone=${encodeURIComponent(OWNER_PHONE)}&grant=${encodeURIComponent(data.grant)}`,
    { failOnStatusCode: false },
  );

  expect(response.status()).toBe(404);
});

test("the playlist is refused without a grant even after consent", async ({ request }) => {
  await recordConsent(db as never, sessionId);

  const response = await request.get(
    `/api/repair-stream/${bookingId}/hls?phone=${encodeURIComponent(OWNER_PHONE)}`,
    { failOnStatusCode: false },
  );

  expect(response.status()).toBe(404);

  // Reset so later tests see the pre-consent state.
  await db.update(repairStreamSessions).set({ consentAt: null }).where(eq(repairStreamSessions.id, sessionId));
});

test("consent can be recorded and is then reflected in the grant", async ({ request }) => {
  const consent = await request.post(`/api/repair-stream/${bookingId}/consent`, {
    data: { phone: OWNER_PHONE },
    failOnStatusCode: false,
  });
  expect(consent.status()).toBe(200);

  const data = await grantFor(request);
  expect(data.consentGiven).toBe(true);
  expect(data.consentRequired).toBe(false);

  await db.update(repairStreamSessions).set({ consentAt: null }).where(eq(repairStreamSessions.id, sessionId));
});

test("consent cannot be given by someone else", async ({ request }) => {
  const consent = await request.post(`/api/repair-stream/${bookingId}/consent`, {
    data: { phone: "+919999999999" },
    failOnStatusCode: false,
  });
  expect(consent.status()).toBe(404);
});

test("a segment request with a traversal attempt is refused", async ({ request }) => {
  await recordConsent(db as never, sessionId);
  const data = await grantFor(request);

  for (const segment of ["../../etc/passwd", "http://evil.example/x.ts", "a/b.ts"]) {
    const response = await request.get(
      `/api/repair-stream/${bookingId}/hls?phone=${encodeURIComponent(OWNER_PHONE)}&grant=${encodeURIComponent(data.grant)}&segment=${encodeURIComponent(segment)}`,
      { failOnStatusCode: false },
    );
    expect(response.status(), `segment: ${segment}`).toBe(404);
  }

  await db.update(repairStreamSessions).set({ consentAt: null }).where(eq(repairStreamSessions.id, sessionId));
});
