import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { closeSession, openSession, recordConsent } from "@looplic/db/repair-stream";
import { bookings } from "@looplic/db/schema";

/**
 * Live HLS, end to end, against a real media server.
 *
 * Everything else about the `hls` provider was already covered — grants, consent,
 * traversal, no URL disclosure — but always with a *fake* playlist URL, so nothing
 * proved that real video can actually reach a customer. This drives the whole path:
 *
 *   ffmpeg → RTSP → MediaMTX → HLS → the app's authorizing proxy → the client
 *
 * Requires the media server to be running:
 *
 *   docker compose -f infra/mediamtx/docker-compose.yml up -d
 *   node scripts/repair-stream-centres.cjs --set-local
 *
 * The spec skips rather than fails when it is not, because a missing local
 * container is an environment gap, not a defect in the app.
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
const MEDIA_SERVER_PLAYLIST = "http://127.0.0.1:8888/bench-test/index.m3u8";
const OWNER_PHONE = "+919000000601";

let pool: Pool;
let db: ReturnType<typeof drizzle>;
let mediaServerUp = false;
const createdBookingIds: string[] = [];

test.beforeAll(async () => {
  test.skip(!databaseUrl, "DATABASE_URL not found in apps/user/.env.local");

  // Is the media server actually publishing? A container that is up but whose
  // ffmpeg source died would otherwise look like an application failure.
  try {
    const response = await fetch(MEDIA_SERVER_PLAYLIST);
    const body = response.ok ? await response.text() : "";
    mediaServerUp = response.ok && body.includes("#EXTM3U");
  } catch {
    mediaServerUp = false;
  }
  test.skip(
    !mediaServerUp,
    "MediaMTX is not publishing bench-test. Start it: docker compose -f infra/mediamtx/docker-compose.yml up -d",
  );

  pool = new Pool({ connectionString: databaseUrl!, ssl: { rejectUnauthorized: false }, max: 4 });
  db = drizzle(pool);
});

test.afterAll(async () => {
  if (!pool) return;
  for (const id of createdBookingIds) {
    await db.delete(bookings).where(eq(bookings.id, id)).catch(() => undefined);
  }
  await pool.end();
});

/**
 * A booking with an open, consented `hls` session pointed at the local centre —
 * the state a customer is in when they are allowed to watch.
 */
async function watchableBooking() {
  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "HLS Live Customer",
      customerPhone: OWNER_PHONE,
      serviceType: "mobile_repair",
      status: "in_progress",
      notes: "Created by repair-stream-hls-live e2e test",
    })
    .returning({ id: bookings.id });

  const bookingId = inserted[0].id;
  createdBookingIds.push(bookingId);

  const opened = await openSession(db as never, {
    bookingId,
    provider: "hls",
    // Matches the centre key written by scripts/repair-stream-centres.cjs --set-local
    providerRef: "local-bench",
  });
  expect(opened.session, "session opened").toBeTruthy();

  await recordConsent(db as never, opened.session!.id);
  return { bookingId, sessionId: opened.session!.id };
}

async function grantFor(request: any, bookingId: string): Promise<string> {
  const response = await request.get(
    `/api/repair-stream/${bookingId}?phone=${encodeURIComponent(OWNER_PHONE)}`,
    { failOnStatusCode: false },
  );
  expect(response.status(), "grant issued").toBe(200);
  const body = await response.json();
  expect(body.grant, "grant present").toBeTruthy();
  return body.grant;
}

test("the customer receives a real playlist through the proxy, not the camera URL", async ({ request }) => {
  const { bookingId } = await watchableBooking();
  const grant = await grantFor(request, bookingId);

  const response = await request.get(
    `/api/repair-stream/${bookingId}/hls?phone=${encodeURIComponent(OWNER_PHONE)}&grant=${encodeURIComponent(grant)}`,
    { failOnStatusCode: false },
  );

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("mpegurl");
  // Never cached: a cached playlist would keep working after a session is revoked.
  expect(response.headers()["cache-control"]).toContain("no-store");

  const playlist = await response.text();
  expect(playlist).toContain("#EXTM3U");

  // The media server's address must not appear anywhere in what the client gets.
  expect(playlist).not.toContain("127.0.0.1:8888");
  expect(playlist).not.toContain("bench-test");
  // Every reference points back through this app, carrying the grant.
  expect(playlist).toContain(`/api/repair-stream/${bookingId}/hls?`);
  expect(playlist).toContain("grant=");
});

test("following the playlist reaches real media bytes", async ({ request }) => {
  const { bookingId } = await watchableBooking();
  const grant = await grantFor(request, bookingId);
  const auth = `phone=${encodeURIComponent(OWNER_PHONE)}&grant=${encodeURIComponent(grant)}`;

  // MediaMTX serves a MASTER playlist when the source has more than one track, so
  // the first hop is a variant playlist rather than media. Walk down until bytes
  // appear, which is what a player does.
  let target = `/api/repair-stream/${bookingId}/hls?${auth}`;
  let bytes: Buffer | null = null;

  for (let depth = 0; depth < 3; depth += 1) {
    const response = await request.get(target, { failOnStatusCode: false });
    expect(response.status(), `hop ${depth} status`).toBe(200);

    const contentType = response.headers()["content-type"] ?? "";
    if (!contentType.includes("mpegurl")) {
      bytes = await response.body();
      break;
    }

    const next = (await response.text())
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.startsWith(`/api/repair-stream/${bookingId}/hls?`));

    expect(next, `hop ${depth} offers something to fetch`).toBeTruthy();
    target = next!;
  }

  expect(bytes, "reached media bytes").toBeTruthy();
  // A real segment, not an empty body or an error page.
  expect(bytes!.length).toBeGreaterThan(1000);
});

test("closing the session stops playback on the very next request", async ({ request }) => {
  const { bookingId, sessionId } = await watchableBooking();
  const grant = await grantFor(request, bookingId);
  const auth = `phone=${encodeURIComponent(OWNER_PHONE)}&grant=${encodeURIComponent(grant)}`;
  const playlistPath = `/api/repair-stream/${bookingId}/hls?${auth}`;

  // Playing.
  expect((await request.get(playlistPath, { failOnStatusCode: false })).status()).toBe(200);

  await closeSession(db as never, sessionId);

  // The grant is still cryptographically valid and unexpired — it is the session
  // state, re-read on every request, that stops playback. This is the difference
  // between a revocable session and a token that has to be waited out.
  const after = await request.get(playlistPath, { failOnStatusCode: false });
  expect(after.status()).toBe(404);
});
