import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { openSession, recordConsent } from "@looplic/db/repair-stream";
import { bookings } from "@looplic/db/schema";

/**
 * Does the live feed actually decode in a browser?
 *
 * Separate from repair-stream-hls-live.spec.ts because it needs a different
 * browser, and Playwright only allows `test.use({ channel })` at file scope.
 *
 * Why a real browser is worth the trouble: a wrong content type, an unrewritten
 * nested playlist, or an `EXT-X-MAP` / `EXT-X-MEDIA` URI still pointing at the
 * media server all produce responses that look perfectly valid to an HTTP-level
 * test and never decode a single frame. Only a player catches those. One of them
 * was a real bug — the master playlist's audio rendition URI was not being
 * rewritten, and the failure surfaced as `manifestIncompatibleCodecsError`.
 *
 * Why the `chrome` channel: Playwright's bundled Chromium is built without
 * proprietary codecs, so `MediaSource.isTypeSupported('video/mp4; codecs="avc1…"')`
 * is false and no H.264 stream can play in it — and H.264 is what every real
 * camera produces. The test skips, with the reason, if no such browser exists.
 */
test.use({ channel: "chrome" });

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
const OWNER_PHONE = "+919000000602";

let pool: Pool;
let db: ReturnType<typeof drizzle>;
const createdBookingIds: string[] = [];

test.beforeAll(async () => {
  test.skip(!databaseUrl, "DATABASE_URL not found in apps/user/.env.local");

  let up = false;
  try {
    const response = await fetch(MEDIA_SERVER_PLAYLIST);
    up = response.ok && (await response.text()).includes("#EXTM3U");
  } catch {
    up = false;
  }
  test.skip(
    !up,
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

test("a customer's browser decodes the live feed through the proxy", async ({ page, request }) => {
  await page.goto("/track");

  const canPlayH264 = await page.evaluate(
    () =>
      typeof MediaSource !== "undefined" &&
      MediaSource.isTypeSupported('video/mp4; codecs="avc1.42c016"'),
  );
  test.skip(!canPlayH264, "this browser has no H.264 support, so it cannot play any real camera feed");

  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "HLS Playback Customer",
      customerPhone: OWNER_PHONE,
      serviceType: "mobile_repair",
      status: "in_progress",
      notes: "Created by repair-stream-hls-playback e2e test",
    })
    .returning({ id: bookings.id });

  const bookingId = inserted[0].id;
  createdBookingIds.push(bookingId);

  const opened = await openSession(db as never, { bookingId, provider: "hls", providerRef: "local-bench" });
  expect(opened.session, "session opened").toBeTruthy();
  await recordConsent(db as never, opened.session!.id);

  const grantResponse = await request.get(
    `/api/repair-stream/${bookingId}?phone=${encodeURIComponent(OWNER_PHONE)}`,
    { failOnStatusCode: false },
  );
  expect(grantResponse.status()).toBe(200);
  const grant = (await grantResponse.json()).grant as string;
  expect(grant).toBeTruthy();

  const playlistUrl = `/api/repair-stream/${bookingId}/hls?phone=${encodeURIComponent(
    OWNER_PHONE,
  )}&grant=${encodeURIComponent(grant)}`;

  // The app's own hls.js, injected from node_modules rather than fetched from a
  // CDN: the test then exercises the exact version the app ships, needs no network
  // beyond the app itself, and does not fail when a CDN has a bad day.
  // createRequire because this spec is ESM, where `require` does not exist.
  const resolve = createRequire(import.meta.url);
  await page.addScriptTag({ path: resolve.resolve("hls.js/dist/hls.min.js") });

  const result = await page.evaluate(async (url) => {
    const Hls = (window as unknown as { Hls?: any }).Hls;
    if (!Hls || !Hls.isSupported()) return { supported: false, playing: false, error: null, currentTime: 0 };

    const video = document.createElement("video");
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    document.body.appendChild(video);

    return await new Promise<{
      supported: boolean;
      playing: boolean;
      error: string | null;
      currentTime: number;
    }>((resolve) => {
      const hls = new Hls({ enableWorker: false, lowLatencyMode: false });
      const finish = (playing: boolean, error: string | null) => {
        const currentTime = video.currentTime;
        try {
          hls.destroy();
        } catch {
          /* already gone */
        }
        resolve({ supported: true, playing, error, currentTime });
      };

      const timeout = setTimeout(() => finish(false, "timed out waiting for a frame"), 30_000);

      hls.on(Hls.Events.ERROR, (_event: unknown, data: { fatal?: boolean; details?: string }) => {
        if (data?.fatal) {
          clearTimeout(timeout);
          finish(false, data.details ?? "fatal hls error");
        }
      });

      video.addEventListener("timeupdate", () => {
        // currentTime advancing is the assertion: frames are being decoded, not
        // merely that a manifest parsed.
        if (video.currentTime > 0.2) {
          clearTimeout(timeout);
          finish(true, null);
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);
      video.play().catch(() => undefined);
    });
  }, playlistUrl);

  test.skip(result.supported === false, "hls.js is not supported in this browser build");
  expect(result.error, "no fatal playback error").toBeNull();
  expect(result.playing, "video decoded at least one frame").toBe(true);
  expect(result.currentTime).toBeGreaterThan(0.2);
});
