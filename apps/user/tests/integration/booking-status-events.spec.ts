import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  changeBookingStatus,
  getBookingStatusHistory,
  recordBookingNote,
  resolveActorRole,
} from "@looplic/db/booking-status-events";
import { bookingStatusEvents, bookings } from "@looplic/db/schema";

/**
 * Integration tests for the status-change helper, against the real database.
 *
 * Each test creates its own throwaway booking and deletes it afterwards
 * (booking_status_events cascades on delete), so nothing is left behind and no
 * existing booking is touched.
 */

function loadDatabaseUrl(): string | null {
  try {
    const envFile = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const index = line.indexOf("=");
      if (line.slice(0, index).trim() === "DATABASE_URL") return line.slice(index + 1).trim();
    }
  } catch {
    return null;
  }
  return null;
}

const databaseUrl = loadDatabaseUrl();

let pool: Pool;
let db: ReturnType<typeof drizzle>;
const createdBookingIds: string[] = [];

test.beforeAll(() => {
  // Skip rather than fail when there is no database configured, so the suite is
  // still usable on a machine without credentials.
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

async function createTestBooking(status = "pending"): Promise<string> {
  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "Status Helper Test",
      customerPhone: "+910000000000",
      serviceType: "mobile_repair",
      status,
      notes: "Created by booking-status-events integration test",
    })
    .returning({ id: bookings.id });

  const id = inserted[0].id;
  createdBookingIds.push(id);
  return id;
}

test("a status change updates the booking and records exactly one event", async () => {
  const bookingId = await createTestBooking("pending");

  const result = await changeBookingStatus(db as never, {
    bookingId,
    status: "confirmed",
    note: "Confirmed by test",
    actorId: null,
    actorRole: "operation",
  });

  expect(result.ok).toBe(true);
  expect(result.from).toBe("pending");
  expect(result.to).toBe("confirmed");
  expect(result.recorded).toBe(true);
  expect(result.booking?.status).toBe("confirmed");

  const events = await db
    .select()
    .from(bookingStatusEvents)
    .where(eq(bookingStatusEvents.bookingId, bookingId));

  expect(events.length).toBe(1);
  expect(events[0].status).toBe("confirmed");
  expect(events[0].previousStatus).toBe("pending");
  expect(events[0].note).toBe("Confirmed by test");
  expect(events[0].actorRole).toBe("operation");
});

test("an illegal transition is refused and writes nothing", async () => {
  const bookingId = await createTestBooking("completed");

  const result = await changeBookingStatus(db as never, {
    bookingId,
    status: "in_progress",
    actorRole: "admin",
  });

  expect(result.ok).toBe(false);
  expect(result.status).toBe(409);
  expect(result.message).toMatch(/final status/i);

  // The booking must be untouched and no history invented.
  const [row] = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, bookingId));
  expect(row.status).toBe("completed");

  const events = await db.select().from(bookingStatusEvents).where(eq(bookingStatusEvents.bookingId, bookingId));
  expect(events.length).toBe(0);
});

test("re-applying the same status updates other fields without adding an event", async () => {
  const bookingId = await createTestBooking("confirmed");

  const result = await changeBookingStatus(db as never, {
    bookingId,
    status: "confirmed",
    actorRole: "admin",
    otherFields: { assignmentNotes: "unchanged status, changed note" },
  });

  expect(result.ok).toBe(true);
  expect(result.recorded).toBe(false);
  expect(result.booking?.assignmentNotes).toBe("unchanged status, changed note");

  const events = await db.select().from(bookingStatusEvents).where(eq(bookingStatusEvents.bookingId, bookingId));
  expect(events.length).toBe(0);
});

test("legacy status spellings are normalized on the way in", async () => {
  const bookingId = await createTestBooking("pending");

  const result = await changeBookingStatus(db as never, {
    bookingId,
    status: "ASSIGNED", // alias for pickup_requested
    actorRole: "operation",
  });

  expect(result.ok).toBe(true);
  expect(result.to).toBe("pickup_requested");

  const [row] = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, bookingId));
  expect(row.status).toBe("pickup_requested");
});

test("history comes back oldest-first across a multi-step journey", async () => {
  const bookingId = await createTestBooking("pending");

  for (const status of ["confirmed", "pickup_requested", "picked_up", "in_progress"]) {
    const result = await changeBookingStatus(db as never, { bookingId, status, actorRole: "technician" });
    expect(result.ok, `transition to ${status}`).toBe(true);
  }

  const history = await getBookingStatusHistory(db as never, bookingId);
  expect(history.map((event) => event.status)).toEqual([
    "confirmed",
    "pickup_requested",
    "picked_up",
    "in_progress",
  ]);

  // Timestamps must be non-decreasing, otherwise a timeline renders out of order.
  for (let i = 1; i < history.length; i += 1) {
    expect(history[i].createdAt.getTime()).toBeGreaterThanOrEqual(history[i - 1].createdAt.getTime());
  }
});

test("a note can be recorded without changing status", async () => {
  const bookingId = await createTestBooking("in_progress");

  const recorded = await recordBookingNote(db as never, {
    bookingId,
    note: "Waiting on a part",
    actorRole: "technician",
  });
  expect(recorded).toBe(true);

  const history = await getBookingStatusHistory(db as never, bookingId);
  expect(history.length).toBe(1);
  expect(history[0].note).toBe("Waiting on a part");
  expect(history[0].status).toBe("in_progress");
  // A note is not a transition.
  expect(history[0].previousStatus).toBeNull();

  const [row] = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, bookingId));
  expect(row.status).toBe("in_progress");
});

test("a missing booking is reported, not created", async () => {
  const result = await changeBookingStatus(db as never, {
    bookingId: "00000000-0000-0000-0000-000000000000",
    status: "confirmed",
  });

  expect(result.ok).toBe(false);
  expect(result.status).toBe(404);
});

test("actor role resolves from user_roles, defaulting to customer then system", async () => {
  // No user id at all is the system acting.
  expect(await resolveActorRole(db as never, null)).toBe("system");

  const unknownUser = await resolveActorRole(db as never, "not-a-real-user-id");
  expect(unknownUser).toBe("customer");
});
