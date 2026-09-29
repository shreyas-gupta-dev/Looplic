import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  addStageMedia,
  closeSession,
  getActiveSession,
  getSessionById,
  getStageMedia,
  openSession,
  recordConsent,
} from "@looplic/db/repair-stream";
import { bookings, repairStreamSessions } from "@looplic/db/schema";

/**
 * Authorization matrix for the repair live view, against the real database.
 *
 * This is the security boundary for showing a customer video of their device being
 * worked on, so the tests concentrate on what must NOT be viewable: another
 * customer's booking, a closed session, an expired session, and a session that was
 * never opened.
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
if (databaseUrl) process.env.DATABASE_URL ??= databaseUrl;
process.env.REPAIR_STREAM_GRANT_SECRET ??= "integration-test-grant-secret";

let pool: Pool;
let db: ReturnType<typeof drizzle>;
const createdBookingIds: string[] = [];

const OWNER_PHONE = "+919000000101";
const OTHER_PHONE = "+919000000202";

test.beforeAll(() => {
  test.skip(!databaseUrl, "DATABASE_URL not found in apps/user/.env.local");
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

async function createBooking(phone = OWNER_PHONE): Promise<string> {
  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "Live View Test",
      customerPhone: phone,
      serviceType: "mobile_repair",
      status: "in_progress",
      notes: "Created by repair-stream integration test",
    })
    .returning({ id: bookings.id });

  createdBookingIds.push(inserted[0].id);
  return inserted[0].id;
}

test("no session means nothing is viewable", async () => {
  const bookingId = await createBooking();
  // A booking with work in progress but no session opened must not be viewable.
  expect(await getActiveSession(db as never, bookingId)).toBeNull();
});

test("opening a session makes it active, and is idempotent", async () => {
  const bookingId = await createBooking();

  const first = await openSession(db as never, { bookingId, provider: "stage-media" });
  expect(first.ok).toBe(true);
  expect(first.reused).toBe(false);
  expect(first.session?.state).toBe("open");

  // Tapping "start live view" twice must not create a second session — closing one
  // would leave the other viewable.
  const second = await openSession(db as never, { bookingId, provider: "stage-media" });
  expect(second.ok).toBe(true);
  expect(second.reused).toBe(true);
  expect(second.session?.id).toBe(first.session?.id);

  const active = await getActiveSession(db as never, bookingId);
  expect(active?.id).toBe(first.session?.id);
});

test("closing a session makes it immediately unviewable", async () => {
  const bookingId = await createBooking();
  const opened = await openSession(db as never, { bookingId });
  expect(opened.ok).toBe(true);

  expect(await getActiveSession(db as never, bookingId)).not.toBeNull();

  expect(await closeSession(db as never, opened.session!.id)).toBe(true);

  // The row still exists, but is no longer viewable.
  expect(await getActiveSession(db as never, bookingId)).toBeNull();
  const stored = await getSessionById(db as never, opened.session!.id);
  expect(stored?.state).toBe("closed");
  expect(stored?.closedAt).not.toBeNull();

  // Closing again is a no-op rather than an error.
  expect(await closeSession(db as never, opened.session!.id)).toBe(false);
});

test("an expired session is unviewable even though nothing closed it", async () => {
  const bookingId = await createBooking();
  const opened = await openSession(db as never, { bookingId });

  // Backdate the expiry: this is the "technician forgot to close it" case.
  await db
    .update(repairStreamSessions)
    .set({ expiresAt: new Date(Date.now() - 60 * 1000) })
    .where(eq(repairStreamSessions.id, opened.session!.id));

  const stored = await getSessionById(db as never, opened.session!.id);
  expect(stored?.state).toBe("open"); // still open...
  expect(await getActiveSession(db as never, bookingId)).toBeNull(); // ...but not viewable
});

test("session length is capped", async () => {
  const bookingId = await createBooking();

  // Ask for a year; must be clamped to the maximum.
  const opened = await openSession(db as never, { bookingId, minutes: 60 * 24 * 365 });
  expect(opened.ok).toBe(true);

  const lifetimeMinutes =
    (opened.session!.expiresAt.getTime() - opened.session!.openedAt.getTime()) / 60000;
  expect(lifetimeMinutes).toBeLessThanOrEqual(24 * 60 + 1);
});

test("a session cannot be opened for a booking that does not exist", async () => {
  const result = await openSession(db as never, { bookingId: "00000000-0000-0000-0000-000000000000" });
  expect(result.ok).toBe(false);
  expect(result.status).toBe(404);
});

test("sessions are scoped to their own booking", async () => {
  const mine = await createBooking(OWNER_PHONE);
  const theirs = await createBooking(OTHER_PHONE);

  const opened = await openSession(db as never, { bookingId: mine });
  expect(opened.ok).toBe(true);

  // Opening a session on one booking must not make another viewable.
  expect(await getActiveSession(db as never, mine)).not.toBeNull();
  expect(await getActiveSession(db as never, theirs)).toBeNull();
});

test("stage media attaches to an open session and reads back in order", async () => {
  const bookingId = await createBooking();
  const opened = await openSession(db as never, { bookingId });
  const sessionId = opened.session!.id;

  for (const [stage, caption] of [
    ["received", "Device received at the counter"],
    ["diagnosed", "Display connector damaged"],
    ["part_replaced", "New display fitted"],
  ] as const) {
    const result = await addStageMedia(db as never, {
      sessionId,
      stage,
      objectKey: `repairs/${bookingId}/${stage}.jpg`,
      caption,
      capturedByName: "Test Technician",
    });
    expect(result.ok, `add ${stage}`).toBe(true);
  }

  const media = await getStageMedia(db as never, sessionId);
  expect(media.map((item) => item.stage)).toEqual(["received", "diagnosed", "part_replaced"]);
  expect(media[0].stageLabel).toBe("Device received");
  expect(media[1].caption).toBe("Display connector damaged");
  expect(media[0].capturedByName).toBe("Test Technician");
  // Object keys, never public URLs — media is served through the grant-checked route.
  expect(media[0].objectKey).not.toMatch(/^https?:/);
});

test("stage media is refused once the session is closed", async () => {
  const bookingId = await createBooking();
  const opened = await openSession(db as never, { bookingId });
  await closeSession(db as never, opened.session!.id);

  const result = await addStageMedia(db as never, {
    sessionId: opened.session!.id,
    stage: "tested",
    objectKey: "repairs/should-not-be-stored.jpg",
  });

  expect(result.ok).toBe(false);
  expect(result.status).toBe(409);

  // And nothing was written.
  expect(await getStageMedia(db as never, opened.session!.id)).toEqual([]);
});

test("stage media is refused for an expired session", async () => {
  const bookingId = await createBooking();
  const opened = await openSession(db as never, { bookingId });

  await db
    .update(repairStreamSessions)
    .set({ expiresAt: new Date(Date.now() - 1000) })
    .where(eq(repairStreamSessions.id, opened.session!.id));

  const result = await addStageMedia(db as never, {
    sessionId: opened.session!.id,
    stage: "tested",
    objectKey: "repairs/expired.jpg",
  });

  expect(result.ok).toBe(false);
  expect(result.status).toBe(409);
});

test("an unknown repair stage is refused", async () => {
  const bookingId = await createBooking();
  const opened = await openSession(db as never, { bookingId });

  const result = await addStageMedia(db as never, {
    sessionId: opened.session!.id,
    stage: "not-a-stage",
    objectKey: "repairs/whatever.jpg",
  });

  expect(result.ok).toBe(false);
  expect(result.status).toBe(400);
});

test("consent is recorded against the session", async () => {
  const bookingId = await createBooking();
  const opened = await openSession(db as never, { bookingId, provider: "hls" });

  expect(opened.session!.consentAt).toBeNull();
  expect(await recordConsent(db as never, opened.session!.id)).toBe(true);

  const stored = await getSessionById(db as never, opened.session!.id);
  expect(stored?.consentAt).not.toBeNull();
});

test("deleting a booking removes its sessions and media", async () => {
  const bookingId = await createBooking();
  const opened = await openSession(db as never, { bookingId });
  await addStageMedia(db as never, {
    sessionId: opened.session!.id,
    stage: "received",
    objectKey: "repairs/cascade.jpg",
  });

  await db.delete(bookings).where(eq(bookings.id, bookingId));

  // Cascade: no orphaned footage of a booking that no longer exists.
  expect(await getSessionById(db as never, opened.session!.id)).toBeNull();
  expect(await getStageMedia(db as never, opened.session!.id)).toEqual([]);
});
