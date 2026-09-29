import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { bookings } from "@looplic/db/schema";

/**
 * The last hop of the "What needs fixing?" journey: what the tile selected has to
 * end up on the booking row, and come back out through the customer-facing
 * tracking lookup.
 *
 * The e2e spec proves every tile carries its category into the booking flow and
 * preselects it. It stops there, because submitting the flow needs an
 * authenticated user and an OTP round-trip. This closes the remaining gap against
 * the real database: a booking carrying a real repair category and subcategory
 * reads back with the repair named correctly, rather than as a bare id or null.
 *
 * Why it matters: `repair_category_id` and `repair_subcategory_id` are written by
 * `buildBookingInsert` and then only ever read back through a three-table join. A
 * category id that is valid but belongs to the other service would insert
 * perfectly happily and produce a booking whose repair label is empty — which the
 * customer sees as a tracking page that cannot say what is being fixed.
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

const TEST_PHONE = "+919000000077";

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

/**
 * A real mobile-repair category with at least one subcategory and a model to book
 * against — the same shape a tile click produces. Read from the database rather
 * than hardcoded so this follows the seeded catalog.
 */
async function pickRealRepairSelection() {
  const rows = await db.execute(sql`
    SELECT rc.id   AS category_id,
           rc.name AS category_name,
           rs.id   AS subcategory_id,
           rs.name AS subcategory_name,
           m.id    AS model_id
      FROM repair_categories rc
      JOIN repair_subcategories rs ON rs.category_id = rc.id
      CROSS JOIN LATERAL (SELECT id FROM models LIMIT 1) m
     LIMIT 1
  `);

  const row = (rows as unknown as { rows: Record<string, string>[] }).rows?.[0];
  return row ?? null;
}

test("a booking carrying a tile's repair category reads back with the repair named", async () => {
  const { trackBooking } = await import("@/src/lib/data/booking-tracking");

  const selection = await pickRealRepairSelection();
  test.skip(!selection, "no repair categories seeded in this database");

  const code = `MOB-999999-SEL${Math.floor(Math.random() * 900 + 100)}`;

  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "Tile Selection Customer",
      customerPhone: TEST_PHONE,
      serviceType: "mobile_repair",
      status: "pending",
      bookingCode: code,
      modelId: selection!.model_id,
      repairCategoryId: selection!.category_id,
      repairSubcategoryId: selection!.subcategory_id,
      scheduledDate: "2026-09-11",
      timeSlot: "10:00 AM - 12:00 PM",
      location: "Nagarathpete, Bengaluru",
      notes: "Created by repair-selection integration test",
    })
    .returning({ id: bookings.id });

  createdBookingIds.push(inserted[0].id);

  const tracked = await trackBooking(code, TEST_PHONE);
  expect(tracked).not.toBeNull();

  // The repair the customer chose on the tile is what the tracking page names.
  // booking-tracking prefers the subcategory ("Screen Replacement") over the
  // category ("Screen"), because that is the specific thing being repaired.
  expect(tracked!.repairLabel).toBe(selection!.subcategory_name);
  expect(tracked!.repairLabel).toBeTruthy();

  // And the device is resolved through the model join, so the page can say what
  // is being fixed as well as how.
  expect(tracked!.deviceLabel).toBeTruthy();
  expect(tracked!.serviceType).toBe("mobile_repair");
});

test("a booking with no repair selection reports no repair rather than a stale one", async () => {
  const { trackBooking } = await import("@/src/lib/data/booking-tracking");

  const code = `MOB-999999-NUL${Math.floor(Math.random() * 900 + 100)}`;

  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "No Selection Customer",
      customerPhone: TEST_PHONE,
      serviceType: "mobile_repair",
      status: "pending",
      bookingCode: code,
      scheduledDate: "2026-09-11",
      timeSlot: "10:00 AM - 12:00 PM",
      notes: "Created by repair-selection integration test",
    })
    .returning({ id: bookings.id });

  createdBookingIds.push(inserted[0].id);

  const tracked = await trackBooking(code, TEST_PHONE);
  expect(tracked).not.toBeNull();
  // Null, not an empty string and not another booking's label.
  expect(tracked!.repairLabel).toBeNull();
});
