import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { changeBookingStatus } from "@looplic/db/booking-status-events";
import { setStatusNotifier, type StatusNotificationContext } from "@looplic/db/booking-status-notify";
import { bookings } from "@looplic/db/schema";

/**
 * Dispatch behaviour of status-change notifications, against the real database.
 *
 * The notifier is replaced with a sink, so these tests observe exactly what would
 * have been sent without sending anything. What matters here is not the wording
 * (covered by the unit spec) but the three rules that make the feature safe:
 *
 *   1. a real status change notifies, exactly once;
 *   2. a no-op change notifies nobody, matching the timeline's own de-duplication;
 *   3. a failing send leaves the status change committed.
 *
 * Rule 3 is the one worth having a test for. The alternative — awaiting delivery
 * inside the transaction — would mean an operator's dashboard click failing, and
 * the booking silently not moving, because Meta had a bad minute.
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

let pool: Pool;
let db: ReturnType<typeof drizzle>;
const createdBookingIds: string[] = [];

const TEST_PHONE = "+919000000088";

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

async function makeBooking(code: string): Promise<string> {
  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "Notify Test Customer",
      customerPhone: TEST_PHONE,
      serviceType: "mobile_repair",
      status: "pending",
      bookingCode: code,
      scheduledDate: "2026-09-12",
      timeSlot: "10:00 AM - 12:00 PM",
      notes: "Created by status-notification integration test",
    })
    .returning({ id: bookings.id });

  createdBookingIds.push(inserted[0].id);
  return inserted[0].id;
}

/** Dispatch is fire-and-forget, so give the microtask queue a chance to drain. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
}

test("advancing a booking notifies the customer once, with the new status", async () => {
  const seen: StatusNotificationContext[] = [];
  const restore = setStatusNotifier(async (context) => {
    seen.push(context);
  });

  try {
    const code = `MOB-999999-NTF${Math.floor(Math.random() * 900 + 100)}`;
    const bookingId = await makeBooking(code);

    const result = await changeBookingStatus(db as never, {
      bookingId,
      status: "confirmed",
      actorRole: "operation",
    });
    expect(result.ok).toBe(true);
    await settle();

    expect(seen).toHaveLength(1);
    expect(seen[0].status).toBe("confirmed");
    expect(seen[0].previousStatus).toBe("pending");
    expect(seen[0].bookingCode).toBe(code);
    // The contact detail has to be resolved, or there is nothing to send to.
    expect(seen[0].customerPhone).toBe(TEST_PHONE);
    expect(seen[0].customerName).toBe("Notify Test Customer");
  } finally {
    restore();
  }
});

test("every step of the journey notifies, in order", async () => {
  const seen: StatusNotificationContext[] = [];
  const restore = setStatusNotifier(async (context) => {
    seen.push(context);
  });

  try {
    const bookingId = await makeBooking(`MOB-999999-JRN${Math.floor(Math.random() * 900 + 100)}`);

    const journey = ["confirmed", "pickup_requested", "picked_up", "in_progress", "ready", "out_for_delivery", "delivered"];
    for (const status of journey) {
      const result = await changeBookingStatus(db as never, {
        bookingId,
        status,
        actorRole: "operation",
      });
      expect(result.ok, `advance to ${status}`).toBe(true);
      // Serialised so the recorded order is the dispatch order, not a race.
      await settle();
    }

    expect(seen.map((context) => context.status)).toEqual(journey);
  } finally {
    restore();
  }
});

test("an operator note travels with the notification", async () => {
  const seen: StatusNotificationContext[] = [];
  const restore = setStatusNotifier(async (context) => {
    seen.push(context);
  });

  try {
    const bookingId = await makeBooking(`MOB-999999-NOT${Math.floor(Math.random() * 900 + 100)}`);

    await changeBookingStatus(db as never, {
      bookingId,
      status: "confirmed",
      actorRole: "operation",
      note: "Pickup slot moved to 4pm at your request",
    });
    await settle();

    expect(seen).toHaveLength(1);
    expect(seen[0].note).toBe("Pickup slot moved to 4pm at your request");
  } finally {
    restore();
  }
});

test("re-saving the same status notifies nobody", async () => {
  const seen: StatusNotificationContext[] = [];
  const restore = setStatusNotifier(async (context) => {
    seen.push(context);
  });

  try {
    const bookingId = await makeBooking(`MOB-999999-DUP${Math.floor(Math.random() * 900 + 100)}`);

    await changeBookingStatus(db as never, { bookingId, status: "confirmed", actorRole: "operation" });
    await settle();
    expect(seen).toHaveLength(1);

    // The same status again, plus an unrelated field edit — the kind of thing an
    // operator does when correcting a phone number on a form.
    const again = await changeBookingStatus(db as never, {
      bookingId,
      status: "confirmed",
      actorRole: "operation",
      otherFields: { timeSlot: "2:00 PM - 4:00 PM" },
    });
    await settle();

    expect(again.ok).toBe(true);
    expect(again.recorded).toBe(false);
    expect(seen, "no second message for an unchanged status").toHaveLength(1);
  } finally {
    restore();
  }
});

test("an illegal transition notifies nobody", async () => {
  const seen: StatusNotificationContext[] = [];
  const restore = setStatusNotifier(async (context) => {
    seen.push(context);
  });

  try {
    const bookingId = await makeBooking(`MOB-999999-ILL${Math.floor(Math.random() * 900 + 100)}`);

    // pending → delivered skips the whole journey and is refused.
    const result = await changeBookingStatus(db as never, {
      bookingId,
      status: "delivered",
      actorRole: "operation",
    });
    await settle();

    expect(result.ok).toBe(false);
    expect(seen, "a refused change must not tell the customer anything").toHaveLength(0);
  } finally {
    restore();
  }
});

test("a failing notification leaves the status change committed", async () => {
  const restore = setStatusNotifier(async () => {
    throw new Error("WhatsApp is down");
  });

  try {
    const code = `MOB-999999-ERR${Math.floor(Math.random() * 900 + 100)}`;
    const bookingId = await makeBooking(code);

    const result = await changeBookingStatus(db as never, {
      bookingId,
      status: "confirmed",
      actorRole: "operation",
    });
    await settle();

    // The operator's action succeeded despite the send blowing up.
    expect(result.ok).toBe(true);
    expect(result.to).toBe("confirmed");

    const rows = await db
      .select({ status: bookings.status })
      .from(bookings)
      .where(eq(bookings.id, bookingId));
    expect(rows[0].status).toBe("confirmed");

    // And the customer can still see it, so the timeline is not missing a step.
    const { trackBooking } = await import("@/src/lib/data/booking-tracking");
    const tracked = await trackBooking(code, TEST_PHONE);
    expect(tracked!.status).toBe("confirmed");
  } finally {
    restore();
  }
});
