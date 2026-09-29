import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { changeBookingStatus } from "@looplic/db/booking-status-events";
import { bookings } from "@looplic/db/schema";

/**
 * End-to-end path for customer order tracking, against the real database.
 *
 * Creates its own booking, walks it through the workflow the way a dashboard
 * would, and checks that the customer-facing lookup reflects each step — which is
 * the whole point of the feature and cannot be verified from the negative cases in
 * the e2e spec alone.
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

// The tracking helpers read process.env.DATABASE_URL through the shared pool, so
// make it available before importing them.
if (databaseUrl) process.env.DATABASE_URL ??= databaseUrl;

let pool: Pool;
let db: ReturnType<typeof drizzle>;
const createdBookingIds: string[] = [];

const TEST_PHONE = "+919000000042";
const TEST_CODE = `MOB-999999-TRK${Math.floor(Math.random() * 900 + 100)}`;

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

test("a customer sees each step as the order advances", async () => {
  const { trackBooking } = await import("@/src/lib/data/booking-tracking");

  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "Tracking Test Customer",
      customerPhone: TEST_PHONE,
      serviceType: "mobile_repair",
      status: "pending",
      bookingCode: TEST_CODE,
      scheduledDate: "2026-09-10",
      timeSlot: "10:00 AM - 12:00 PM",
      location: "Nagarathpete, Bengaluru",
      notes: "Created by order-tracking integration test",
    })
    .returning({ id: bookings.id });

  createdBookingIds.push(inserted[0].id);

  // Freshly created: pending, with a timeline that already has an entry.
  const initial = await trackBooking(TEST_CODE, TEST_PHONE);
  expect(initial).not.toBeNull();
  expect(initial!.status).toBe("pending");
  expect(initial!.statusLabel).toBe("Order Placed");
  expect(initial!.nextStatusLabel).toBe("Confirmed");
  expect(initial!.history.length).toBeGreaterThanOrEqual(1);
  expect(initial!.deviceLabel).toBeNull(); // no model on this booking
  expect(initial!.scheduledDate).toBe("2026-09-10");

  // PII is masked, so a code+phone holder does not get the full record back.
  expect(initial!.phoneMasked).toContain("0042");
  expect(initial!.phoneMasked).not.toContain("919000000042");
  // First name plus the initial of the last name: enough to confirm the right
  // order, not enough to be a leak.
  expect(initial!.customerNameMasked).toBe("Tracking C.");

  // Walk the order forward the way a dashboard would.
  for (const status of ["confirmed", "pickup_requested", "picked_up", "in_progress"]) {
    const result = await changeBookingStatus(db as never, {
      bookingId: inserted[0].id,
      status,
      actorRole: "operation",
      note: status === "pickup_requested" ? "Technician Ravi assigned" : null,
    });
    expect(result.ok, `advance to ${status}`).toBe(true);
  }

  const advanced = await trackBooking(TEST_CODE, TEST_PHONE);
  expect(advanced!.status).toBe("in_progress");
  expect(advanced!.statusLabel).toBe("Repair In Progress");
  expect(advanced!.nextStatusLabel).toBe("Ready");

  // The timeline shows every step in order, with the operator note attached to
  // the step it belongs to.
  const statuses = advanced!.history.map((event) => event.status);
  expect(statuses).toContain("confirmed");
  expect(statuses).toContain("pickup_requested");
  expect(statuses).toContain("picked_up");
  expect(statuses).toContain("in_progress");
  expect(statuses.indexOf("confirmed")).toBeLessThan(statuses.indexOf("in_progress"));

  const pickupEvent = advanced!.history.find((event) => event.status === "pickup_requested");
  expect(pickupEvent?.note).toBe("Technician Ravi assigned");
  expect(pickupEvent?.label).toBe("Pickup Requested");
});

test("the wrong phone number returns nothing for a real booking", async () => {
  const { trackBooking } = await import("@/src/lib/data/booking-tracking");

  const code = `MOB-999998-SEC${Math.floor(Math.random() * 900 + 100)}`;
  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "Tracking Security Test",
      customerPhone: "+919000000043",
      serviceType: "mobile_repair",
      status: "in_progress",
      bookingCode: code,
      notes: "Created by order-tracking integration test",
    })
    .returning({ id: bookings.id });
  createdBookingIds.push(inserted[0].id);

  // Right code, wrong phone — must be indistinguishable from "no such booking".
  expect(await trackBooking(code, "+919999999999")).toBeNull();
  expect(await trackBooking(code, "1234")).toBeNull();
  expect(await trackBooking(code, "")).toBeNull();

  // Right code and phone still works, so the null results above are not a false
  // negative from some other cause.
  expect(await trackBooking(code, "+919000000043")).not.toBeNull();
  // Phone is matched on the last 10 digits, so local format works too.
  expect(await trackBooking(code, "9000000043")).not.toBeNull();
});
