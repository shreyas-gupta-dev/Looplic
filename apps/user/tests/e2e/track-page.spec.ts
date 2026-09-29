import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { BOOKING_STATUS_FLOW, BOOKING_STATUS_META } from "@looplic/db/booking-status";
import { changeBookingStatus } from "@looplic/db/booking-status-events";
import { setStatusNotifier } from "@looplic/db/booking-status-notify";
import { closeSession, openSession } from "@looplic/db/repair-stream";
import { bookings } from "@looplic/db/schema";

/**
 * What the customer actually sees on /track once a real order exists.
 *
 * The other tracking spec covers the negative cases — unknown code, wrong phone,
 * no oracle for which codes exist. Those are the security properties. This one
 * covers the feature itself, which none of them touch: that the page renders the
 * journey, marks the step the order is on, timestamps the steps it has passed,
 * and refuses to show a progress bar for an order that is not progressing.
 *
 * Rows are created and torn down here rather than relying on seed data, because a
 * test that depends on a particular booking existing in a shared database fails
 * for reasons that have nothing to do with the code.
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

const PHONE = "+919000000501";
const suffix = () => Math.floor(Math.random() * 9000 + 1000);

let pool: Pool;
let db: ReturnType<typeof drizzle>;
const createdBookingIds: string[] = [];
let restoreNotifier: () => void;

test.beforeAll(() => {
  test.skip(!databaseUrl, "DATABASE_URL not found in apps/user/.env.local");
  pool = new Pool({ connectionString: databaseUrl!, ssl: { rejectUnauthorized: false }, max: 4 });
  db = drizzle(pool);
  // These tests drive real status changes, which now notify the customer. Swap the
  // notifier for a sink so a test run cannot send WhatsApp messages to a number
  // that might belong to someone.
  restoreNotifier = setStatusNotifier(async () => undefined);
});

test.afterAll(async () => {
  restoreNotifier?.();
  if (!pool) return;
  for (const id of createdBookingIds) {
    await db.delete(bookings).where(eq(bookings.id, id)).catch(() => undefined);
  }
  await pool.end();
});

async function createBooking(code: string, status = "pending"): Promise<string> {
  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "Track Page Customer",
      customerPhone: PHONE,
      serviceType: "mobile_repair",
      status,
      bookingCode: code,
      scheduledDate: "2026-09-14",
      timeSlot: "10:00 AM - 12:00 PM",
      location: "Nagarathpete, Bengaluru",
      notes: "Created by track-page e2e test",
    })
    .returning({ id: bookings.id });

  createdBookingIds.push(inserted[0].id);
  return inserted[0].id;
}

async function advance(bookingId: string, statuses: string[], note?: string) {
  for (const status of statuses) {
    const result = await changeBookingStatus(db as never, {
      bookingId,
      status,
      actorRole: "operation",
      note: note && status === statuses[statuses.length - 1] ? note : null,
    });
    expect(result.ok, `advance to ${status}`).toBe(true);
  }
}

function trackUrl(code: string): string {
  return `/track?code=${encodeURIComponent(code)}&phone=${encodeURIComponent(PHONE)}`;
}

/**
 * The status timeline specifically. The page has other ordered lists (breadcrumbs
 * on the shared navbar), so a bare `ol` selector would never be able to assert the
 * timeline's absence.
 */
function timelineOf(page: import("@playwright/test").Page) {
  return page.locator("ol.space-y-0");
}

test("a real order shows its details, current step and full journey", async ({ page }) => {
  const code = `MOB-999999-TP${suffix()}`;
  const bookingId = await createBooking(code);
  await advance(bookingId, ["confirmed", "pickup_requested"], "Technician Ravi assigned");

  await page.goto(trackUrl(code));

  // The order is identified, so the customer knows they are looking at the right one.
  await expect(page.getByText(code)).toBeVisible();
  await expect(page.getByRole("heading", { name: /order status/i })).toBeVisible();

  // Masked contact detail, not the full number.
  await expect(page.getByText(/0501/)).toBeVisible();
  await expect(page.getByText("+919000000501")).toHaveCount(0);

  // Where it is now, and what happens next.
  await expect(page.getByText(BOOKING_STATUS_META.pickup_requested.label).first()).toBeVisible();
  // The description appears twice — in the current-status banner and again against
  // the current step of the timeline — so match the first.
  await expect(page.getByText(BOOKING_STATUS_META.pickup_requested.customerDescription).first()).toBeVisible();
  await expect(page.getByText(/next:\s*device picked up/i)).toBeVisible();

  // Every step of the journey is listed, including ones not yet reached — "what
  // happens next" is most of what a customer wants from this page.
  for (const status of BOOKING_STATUS_FLOW) {
    await expect(
      page.getByText(BOOKING_STATUS_META[status].label, { exact: true }).first(),
      `${status} step is listed`,
    ).toBeVisible();
  }

  // The operator's note is attached to the step it belongs to.
  await expect(page.getByText("Technician Ravi assigned")).toBeVisible();
});

test("steps the order has passed carry a timestamp, and later ones do not", async ({ page }) => {
  const code = `MOB-999999-TS${suffix()}`;
  const bookingId = await createBooking(code);
  await advance(bookingId, ["confirmed", "pickup_requested", "picked_up"]);

  await page.goto(trackUrl(code));

  const timeline = timelineOf(page);
  await expect(timeline).toBeVisible();

  // Reached steps are timestamped from the recorded history: a timeline with no
  // times cannot answer "when was my device picked up?", which is the question the
  // history table exists to answer.
  const timestamps = await timeline.locator("li span.text-\\[11px\\]").allInnerTexts();
  const nonEmpty = timestamps.filter((value) => value.trim().length > 0);
  expect(nonEmpty.length, "reached steps are timestamped").toBeGreaterThanOrEqual(3);

  // Not every step: the ones still to come have no time, because they have not
  // happened. A timeline that timestamps the future is lying.
  expect(nonEmpty.length).toBeLessThan(BOOKING_STATUS_FLOW.length + 1);
});

test("the whole journey renders, from Order Placed to Completed", async ({ page }) => {
  const code = `MOB-999999-FJ${suffix()}`;
  const bookingId = await createBooking(code);
  await advance(bookingId, [...BOOKING_STATUS_FLOW.slice(1), "completed"]);

  await page.goto(trackUrl(code));

  await expect(page.getByText(BOOKING_STATUS_META.completed.label).first()).toBeVisible();
  await expect(page.getByText(BOOKING_STATUS_META.completed.customerDescription).first()).toBeVisible();
  // Nothing comes after Completed, so no "Next:" line.
  await expect(page.getByText(/^next:/i)).toHaveCount(0);
});

test("an order on hold says so instead of showing a progress bar", async ({ page }) => {
  const code = `MOB-999999-OH${suffix()}`;
  const bookingId = await createBooking(code);
  await advance(bookingId, ["confirmed", "on_hold"], "Waiting on a display panel");

  await page.goto(trackUrl(code));

  await expect(page.getByText(BOOKING_STATUS_META.on_hold.label).first()).toBeVisible();
  await expect(page.getByText(BOOKING_STATUS_META.on_hold.customerDescription).first()).toBeVisible();

  // The step list is replaced, not merely annotated: showing progress for an
  // order that is not progressing would be misleading. `ol.space-y-0` is the
  // timeline specifically — the page has other ordered lists (breadcrumbs).
  await expect(timelineOf(page)).toHaveCount(0);
  await expect(page.getByText(BOOKING_STATUS_META.out_for_delivery.label)).toHaveCount(0);
});

test("a cancelled order says so instead of showing a progress bar", async ({ page }) => {
  const code = `MOB-999999-CX${suffix()}`;
  const bookingId = await createBooking(code);
  await advance(bookingId, ["cancelled"]);

  await page.goto(trackUrl(code));

  await expect(page.getByText(BOOKING_STATUS_META.cancelled.label).first()).toBeVisible();
  await expect(timelineOf(page)).toHaveCount(0);
  await expect(page.getByText(BOOKING_STATUS_META.out_for_delivery.label)).toHaveCount(0);
});

test.describe("live view panel", () => {
  test("is absent for an order with no open session", async ({ page }) => {
    const code = `MOB-999999-LV${suffix()}`;
    const bookingId = await createBooking(code);
    await advance(bookingId, ["confirmed", "pickup_requested", "picked_up", "in_progress"]);

    await page.goto(trackUrl(code));

    // In progress, but nobody is filming: no empty placeholder, no dead control.
    await expect(page.getByRole("heading", { name: /watch your repair/i })).toHaveCount(0);
  });

  test("appears once a session is open and goes away when it closes", async ({ page }) => {
    const code = `MOB-999999-LO${suffix()}`;
    const bookingId = await createBooking(code);
    await advance(bookingId, ["confirmed", "pickup_requested", "picked_up", "in_progress"]);

    const opened = await openSession(db as never, { bookingId, provider: "stage-media" });
    expect(opened.session).toBeTruthy();

    await page.goto(trackUrl(code));
    // The panel is client-rendered after a grant fetch, so give it a moment.
    await expect(page.getByRole("heading", { name: /watch your repair/i })).toBeVisible({ timeout: 30_000 });

    // Closing the session removes it on the next load, which is the property that
    // makes a session a revocation control rather than a label.
    await closeSession(db as never, opened.session!.id);
    await page.goto(trackUrl(code));
    await expect(page.getByRole("heading", { name: /watch your repair/i })).toHaveCount(0);
  });
});
