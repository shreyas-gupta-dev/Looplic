import { expect, test } from "@playwright/test";

import {
  BOOKING_STATUSES,
  BOOKING_STATUS_FLOW,
  BOOKING_STATUS_META,
  canTransition,
  expectedNextStatus,
  isBookingStatus,
  nextStatusOptions,
  normalizeBookingStatus,
  timelineIndex,
  type BookingStatus,
} from "@looplic/db/booking-status";

/**
 * The status model is what the customer-facing timeline and all three dashboards
 * agree on, so its rules are worth pinning down precisely.
 */

test.describe("normalizeBookingStatus", () => {
  test("passes the four legacy values through unchanged", () => {
    // These are the only values present in the live bookings table, so they must
    // map to themselves or existing rows would be misreported.
    for (const legacy of ["pending", "confirmed", "in_progress", "completed"]) {
      expect(normalizeBookingStatus(legacy)).toBe(legacy);
    }
  });

  test("maps known aliases onto the canonical set", () => {
    expect(normalizeBookingStatus("assigned")).toBe("pickup_requested");
    expect(normalizeBookingStatus("fixed")).toBe("ready");
    expect(normalizeBookingStatus("dispatched")).toBe("out_for_delivery");
    expect(normalizeBookingStatus("canceled")).toBe("cancelled");
    expect(normalizeBookingStatus("done")).toBe("completed");
  });

  test("is tolerant of casing and spacing", () => {
    expect(normalizeBookingStatus("  In Progress ")).toBe("in_progress");
    expect(normalizeBookingStatus("PICKED UP")).toBe("picked_up");
  });

  test("falls back to pending rather than throwing on junk", () => {
    // A booking whose status nobody remembers writing must still be displayable.
    expect(normalizeBookingStatus("something-nobody-wrote")).toBe("pending");
    expect(normalizeBookingStatus(null)).toBe("pending");
    expect(normalizeBookingStatus(undefined)).toBe("pending");
    expect(normalizeBookingStatus(42)).toBe("pending");
  });

  test("always returns a value that is in the canonical set", () => {
    for (const input of ["pending", "weird", "hold", "", "  ", "REJECTED"]) {
      expect(isBookingStatus(normalizeBookingStatus(input))).toBe(true);
    }
  });
});

test.describe("canTransition", () => {
  test("allows the normal forward journey", () => {
    for (let i = 0; i < BOOKING_STATUS_FLOW.length - 1; i += 1) {
      const from = BOOKING_STATUS_FLOW[i];
      const to = BOOKING_STATUS_FLOW[i + 1];
      expect(canTransition(from, to).allowed, `${from} -> ${to}`).toBe(true);
    }
  });

  test("refuses to move backwards", () => {
    // A customer watching the timeline should never see it regress.
    expect(canTransition("in_progress", "pending").allowed).toBe(false);
    expect(canTransition("delivered", "in_progress").allowed).toBe(false);
    expect(canTransition("picked_up", "confirmed").allowed).toBe(false);
  });

  test("treats terminal statuses as final", () => {
    for (const terminal of ["completed", "cancelled"] as BookingStatus[]) {
      for (const target of BOOKING_STATUSES) {
        if (target === terminal) continue;
        const result = canTransition(terminal, target);
        expect(result.allowed, `${terminal} -> ${target} must be refused`).toBe(false);
        expect(result.reason, `${terminal} -> ${target} reason`).toMatch(/final status/i);
      }
    }
  });

  test("re-applying the same status is a no-op, not an error", () => {
    // Dashboards re-save unchanged forms; that must not fail.
    for (const status of BOOKING_STATUSES) {
      expect(canTransition(status, status).allowed, status).toBe(true);
    }
  });

  test("on_hold can be entered from any live status and left again", () => {
    for (const status of BOOKING_STATUS_FLOW) {
      if (status === "delivered") continue; // delivered only goes to completed
      expect(canTransition(status, "on_hold").allowed, `${status} -> on_hold`).toBe(true);
    }
    expect(canTransition("on_hold", "in_progress").allowed).toBe(true);
    expect(canTransition("on_hold", "cancelled").allowed).toBe(true);
  });

  test("cancellation is available while work is live", () => {
    for (const status of ["pending", "confirmed", "pickup_requested", "picked_up", "in_progress", "ready"] as BookingStatus[]) {
      expect(canTransition(status, "cancelled").allowed, status).toBe(true);
    }
  });

  test("gives a usable reason when it refuses", () => {
    const result = canTransition("delivered", "pending");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeTruthy();
    expect((result.reason ?? "").length).toBeGreaterThan(10);
    // Reasons are shown to operators, so use labels not raw keys.
    expect(result.reason).toContain("Delivered");
  });
});

test.describe("nextStatusOptions", () => {
  test("offers only legal targets", () => {
    for (const status of BOOKING_STATUSES) {
      for (const option of nextStatusOptions(status)) {
        expect(canTransition(status, option).allowed, `${status} -> ${option}`).toBe(true);
      }
    }
  });

  test("offers nothing from a terminal status", () => {
    expect(nextStatusOptions("completed")).toEqual([]);
    expect(nextStatusOptions("cancelled")).toEqual([]);
  });
});

test.describe("customer-facing metadata", () => {
  test("every status has a label and a description", () => {
    for (const status of BOOKING_STATUSES) {
      const meta = BOOKING_STATUS_META[status];
      expect(meta, status).toBeTruthy();
      expect(meta.label.trim().length, `${status} label`).toBeGreaterThan(0);
      expect(meta.customerDescription.trim().length, `${status} description`).toBeGreaterThan(0);
    }
  });

  test('the document\'s "Pickup Requested" wording is present', () => {
    expect(BOOKING_STATUS_META.pickup_requested.label).toBe("Pickup Requested");
  });

  test("only completed and cancelled are terminal", () => {
    const terminal = BOOKING_STATUSES.filter((s) => BOOKING_STATUS_META[s].terminal);
    expect([...terminal].sort()).toEqual(["cancelled", "completed"]);
  });
});

test.describe("timeline helpers", () => {
  test("the flow is strictly ordered", () => {
    for (let i = 0; i < BOOKING_STATUS_FLOW.length; i += 1) {
      expect(timelineIndex(BOOKING_STATUS_FLOW[i])).toBe(i);
    }
    expect(timelineIndex("completed")).toBe(BOOKING_STATUS_FLOW.length);
  });

  test("off-timeline statuses report -1", () => {
    expect(timelineIndex("on_hold")).toBe(-1);
    expect(timelineIndex("cancelled")).toBe(-1);
  });

  test("expectedNextStatus walks the flow and stops at completed", () => {
    expect(expectedNextStatus("pending")).toBe("confirmed");
    expect(expectedNextStatus("in_progress")).toBe("ready");
    expect(expectedNextStatus("delivered")).toBe("completed");
    expect(expectedNextStatus("completed")).toBeNull();
    expect(expectedNextStatus("cancelled")).toBeNull();
    expect(expectedNextStatus("on_hold")).toBeNull();
  });
});
