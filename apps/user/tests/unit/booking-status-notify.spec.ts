import { expect, test } from "@playwright/test";

import { BOOKING_STATUSES, BOOKING_STATUS_FLOW, BOOKING_STATUS_META, type BookingStatus } from "@looplic/db/booking-status";
import { composeStatusNotification, trackUrlFor } from "@looplic/db/booking-status-notify";

/**
 * Wording of the status-change message.
 *
 * These are pure-composition tests: no database, no network. What they protect is
 * that the message a customer receives says the same thing as the timeline they
 * land on — the description comes from BOOKING_STATUS_META, so a second copy of
 * the copy cannot drift from it.
 */

function contextFor(status: BookingStatus, overrides: Record<string, unknown> = {}) {
  return {
    bookingId: "00000000-0000-4000-8000-000000000001",
    status,
    previousStatus: null,
    note: null,
    customerName: "Ravi Kumar",
    customerPhone: "+919000000042",
    customerEmail: null,
    bookingCode: "MOB-123456-ABCD",
    deviceLabel: "Apple iPhone 14",
    repairLabel: "Screen Replacement",
    ...overrides,
  } as Parameters<typeof composeStatusNotification>[0];
}

test("every status a customer can reach produces a sendable message", () => {
  for (const status of BOOKING_STATUSES) {
    const composed = composeStatusNotification(contextFor(status));

    expect(composed.subject, `${status} subject`).toBeTruthy();
    expect(composed.text, `${status} text`).toBeTruthy();
    expect(composed.whatsapp, `${status} whatsapp`).toBeTruthy();
    expect(composed.html, `${status} html`).toContain("<");

    // The label and the customer-facing description both have to appear, because
    // the label alone ("Ready") does not tell anyone what to do next.
    expect(composed.text).toContain(BOOKING_STATUS_META[status].label);
    expect(composed.text).toContain(BOOKING_STATUS_META[status].customerDescription);
  }
});

test("the message names the order, the device and the repair", () => {
  const composed = composeStatusNotification(contextFor("in_progress"));

  expect(composed.text).toContain("MOB-123456-ABCD");
  expect(composed.text).toContain("Apple iPhone 14");
  expect(composed.text).toContain("Screen Replacement");
  expect(composed.subject).toContain("MOB-123456-ABCD");
  expect(composed.subject).toContain("Repair In Progress");
});

test("the customer is greeted by first name only", () => {
  const composed = composeStatusNotification(contextFor("confirmed"));
  expect(composed.text).toContain("Hi Ravi,");
  // Not the full name: these messages go over WhatsApp, where less PII is better.
  expect(composed.text).not.toContain("Ravi Kumar,");
});

test("a nameless booking still gets a usable greeting", () => {
  const composed = composeStatusNotification(contextFor("confirmed", { customerName: null }));
  expect(composed.text).toContain("Hi there,");
});

test("an operator note is passed through to the customer", () => {
  const composed = composeStatusNotification(
    contextFor("on_hold", { note: "Waiting on a display panel, expected Tuesday" }),
  );

  expect(composed.text).toContain("Waiting on a display panel, expected Tuesday");
  expect(composed.whatsapp).toContain("Waiting on a display panel");
  expect(composed.html).toContain("Waiting on a display panel");
});

test("a note containing markup cannot inject into the email", () => {
  const composed = composeStatusNotification(
    contextFor("ready", { note: '<img src=x onerror="alert(1)">' }),
  );

  expect(composed.html).not.toContain("<img");
  expect(composed.html).toContain("&lt;img");
});

test("every message links to the tracking page for that order", () => {
  for (const status of BOOKING_STATUS_FLOW) {
    const composed = composeStatusNotification(contextFor(status));
    expect(composed.text, `${status} track link`).toContain("/track?code=MOB-123456-ABCD");
    expect(composed.whatsapp).toContain("/track?code=MOB-123456-ABCD");
  }
});

test("a booking with no code links to the bare tracking page", () => {
  expect(trackUrlFor(null)).toMatch(/\/track$/);
  expect(trackUrlFor("MOB-1-A")).toContain("/track?code=MOB-1-A");

  const composed = composeStatusNotification(contextFor("picked_up", { bookingCode: null }));
  expect(composed.text).toContain("/track");
  expect(composed.subject).toBe("Device Picked Up — your Looplic order");
});

test("a booking code with URL-unsafe characters is encoded", () => {
  expect(trackUrlFor("MOB 1&2")).toContain("code=MOB%201%262");
});

test("a booking with no device or repair omits those lines rather than showing blanks", () => {
  const composed = composeStatusNotification(
    contextFor("confirmed", { deviceLabel: null, repairLabel: null }),
  );

  expect(composed.text).not.toContain("Device:");
  expect(composed.whatsapp).not.toContain("Device:");
  expect(composed.html).not.toContain("Device:");
});
