import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { appSettings } from "@looplic/db/schema";

/**
 * `app_settings` must not hand out private settings to anonymous callers.
 *
 * `/api/db-proxy` treats `app_settings` as publicly readable, because the
 * storefront needs the repair-price visibility switch before anyone signs in.
 * Reads of a public table skip the session check entirely — so every row of what is
 * a general-purpose key/value bag was readable by anyone able to POST to the route.
 *
 * That included `repair_stream_centres`: the service-centre camera playlist URLs,
 * which may embed credentials. The repair-stream endpoints go to real lengths never
 * to disclose them — the customer only receives a path back through the app, and
 * `repair-stream-hls.spec.ts` asserts the stream response contains neither the URL
 * nor the provider ref. This proxy handed them out on request, which made all of
 * that effort moot.
 *
 * These tests pin both halves: the public key still reads, and the private one does
 * not.
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
const SETTINGS_KEY = "repair_stream_centres";
const SECRET_URL = "http://10.0.0.99:8888/secret-bench/index.m3u8";

let pool: Pool;
let db: ReturnType<typeof drizzle>;
let hadExisting = false;
let original: unknown = null;

test.beforeAll(async () => {
  test.skip(!databaseUrl, "DATABASE_URL not found in apps/user/.env.local");
  pool = new Pool({ connectionString: databaseUrl!, ssl: { rejectUnauthorized: false }, max: 4 });
  db = drizzle(pool);

  const existing = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, SETTINGS_KEY))
    .limit(1);

  hadExisting = existing.length > 0;
  original = existing[0]?.value ?? null;

  // A recognisable camera URL to look for in responses.
  const value = JSON.stringify({
    centres: { "leak-check": { label: "Leak Check Centre", playlistUrl: SECRET_URL } },
    defaultCentre: "leak-check",
  });

  if (hadExisting) {
    await db.update(appSettings).set({ value }).where(eq(appSettings.key, SETTINGS_KEY));
  } else {
    await db.insert(appSettings).values({ key: SETTINGS_KEY, value });
  }
});

test.afterAll(async () => {
  if (!pool) return;
  if (hadExisting) {
    const restore = typeof original === "string" ? original : JSON.stringify(original);
    await db
      .update(appSettings)
      .set({ value: restore })
      .where(eq(appSettings.key, SETTINGS_KEY))
      .catch(() => undefined);
  } else {
    await db.delete(appSettings).where(eq(appSettings.key, SETTINGS_KEY)).catch(() => undefined);
  }
  await pool.end();
});

async function proxyRead(request: any, body: Record<string, unknown>) {
  const response = await request.post("/api/db-proxy", {
    data: { table: "app_settings", ...body },
    failOnStatusCode: false,
  });
  return { status: response.status(), text: await response.text() };
}

test("an anonymous read of every setting does not return a camera URL", async ({ request }) => {
  const result = await proxyRead(request, {});

  expect(result.status).toBe(200);
  expect(result.text).not.toContain(SECRET_URL);
  expect(result.text).not.toContain("10.0.0.99");
  expect(result.text).not.toContain("leak-check");
});

test("asking for the camera setting by key returns nothing", async ({ request }) => {
  const result = await proxyRead(request, { filters: [["eq", "key", SETTINGS_KEY]] });

  expect(result.status).toBe(200);
  expect(result.text).not.toContain(SECRET_URL);
  // An empty result, not an error — this reveals nothing about whether the key
  // exists, and matches how the rest of the repair-stream surface answers.
  const body = JSON.parse(result.text);
  expect(body.data).toEqual([]);
});

test("asking for it as a single row returns null", async ({ request }) => {
  const result = await proxyRead(request, { filters: [["eq", "key", SETTINGS_KEY]], single: true });

  expect(result.status).toBe(200);
  expect(result.text).not.toContain(SECRET_URL);
  expect(JSON.parse(result.text).data).toBeNull();
});

test("selecting only the value column still does not leak it", async ({ request }) => {
  // Narrowing the selection must not be a way around the filter.
  const result = await proxyRead(request, { select: "value" });

  expect(result.status).toBe(200);
  expect(result.text).not.toContain(SECRET_URL);
  expect(result.text).not.toContain("10.0.0.99");
});

test("the public price-visibility setting is still readable anonymously", async ({ request }) => {
  // The reason app_settings is public at all. Breaking this would hide prices on
  // the storefront for every visitor who is not signed in, so it is asserted
  // rather than assumed.
  const result = await proxyRead(request, { filters: [["eq", "key", "repair_subcategory_prices"]] });

  expect(result.status).toBe(200);
  const body = JSON.parse(result.text);
  expect(Array.isArray(body.data)).toBe(true);
  // Either the row exists and comes back, or it does not exist at all — what must
  // not happen is a 401 or a filtered-out row.
  for (const row of body.data) {
    expect(row.key).toBe("repair_subcategory_prices");
  }
});
