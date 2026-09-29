/**
 * Canonical booking status model.
 *
 * `bookings.status` is a free-text column that, before this file existed, held
 * four ad-hoc values ("pending", "confirmed", "in_progress", "completed") typed
 * as string literals in three separate copies of the dashboard code. There was no
 * agreed vocabulary and no record of when a status changed, so a customer could
 * not be shown anything more useful than the current word.
 *
 * This module is the single source of truth for:
 *   - which statuses exist,
 *   - what each one means to a customer,
 *   - which transitions are legal,
 *   - how the four legacy values map onto the new set.
 *
 * The column stays text rather than becoming a Postgres enum on purpose: an enum
 * would require a migration (and a lock) every time the journey gains a step, and
 * would reject legacy rows outright. Validation lives here instead.
 */

/** Statuses in the order a repair normally moves through them. */
export const BOOKING_STATUS_FLOW = [
  "pending",
  "confirmed",
  "pickup_requested",
  "picked_up",
  "in_progress",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

/** Statuses that end a booking. */
export const BOOKING_STATUS_TERMINAL = ["completed", "cancelled"] as const;

/** Statuses outside the normal flow. */
export const BOOKING_STATUS_OTHER = ["on_hold"] as const;

export const BOOKING_STATUSES = [
  ...BOOKING_STATUS_FLOW,
  ...BOOKING_STATUS_OTHER,
  ...BOOKING_STATUS_TERMINAL,
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type BookingStatusMeta = {
  /** Short label for dashboards and the customer timeline. */
  label: string;
  /** Customer-facing sentence explaining what is happening. */
  customerDescription: string;
  /** Whether the booking is finished (no further progress expected). */
  terminal: boolean;
  /** Whether this status represents forward progress on the timeline. */
  onTimeline: boolean;
};

export const BOOKING_STATUS_META: Record<BookingStatus, BookingStatusMeta> = {
  pending: {
    label: "Order Placed",
    customerDescription: "We have your request and are confirming the details.",
    terminal: false,
    onTimeline: true,
  },
  confirmed: {
    label: "Confirmed",
    customerDescription: "Your booking is confirmed and scheduled.",
    terminal: false,
    onTimeline: true,
  },
  pickup_requested: {
    label: "Pickup Requested",
    customerDescription: "A technician has been assigned to collect your device.",
    terminal: false,
    onTimeline: true,
  },
  picked_up: {
    label: "Device Picked Up",
    customerDescription: "Your device is with us and on its way to the service centre.",
    terminal: false,
    onTimeline: true,
  },
  in_progress: {
    label: "Repair In Progress",
    customerDescription: "Our technician is working on your device.",
    terminal: false,
    onTimeline: true,
  },
  ready: {
    label: "Ready",
    customerDescription: "The repair is finished and your device has passed testing.",
    terminal: false,
    onTimeline: true,
  },
  out_for_delivery: {
    label: "Out For Delivery",
    customerDescription: "Your device is on its way back to you.",
    terminal: false,
    onTimeline: true,
  },
  delivered: {
    label: "Delivered",
    customerDescription: "Your device has been returned to you.",
    terminal: false,
    onTimeline: true,
  },
  completed: {
    label: "Completed",
    customerDescription: "This order is complete. Thank you for choosing Looplic.",
    terminal: true,
    onTimeline: true,
  },
  on_hold: {
    label: "On Hold",
    customerDescription: "We have paused work and will be in touch shortly.",
    terminal: false,
    onTimeline: false,
  },
  cancelled: {
    label: "Cancelled",
    customerDescription: "This order was cancelled.",
    terminal: true,
    onTimeline: false,
  },
};

/**
 * Legacy and alias values seen in the wild, mapped onto the canonical set.
 *
 * Existing rows only ever contain the first four, which map to themselves, so no
 * data has to be rewritten. The rest are defensive: dashboards and the WhatsApp
 * bot have used these spellings at various points.
 */
const STATUS_ALIASES: Record<string, BookingStatus> = {
  pending: "pending",
  new: "pending",
  placed: "pending",
  confirmed: "confirmed",
  scheduled: "confirmed",
  assigned: "pickup_requested",
  pickup_requested: "pickup_requested",
  pickup: "pickup_requested",
  picked_up: "picked_up",
  pickedup: "picked_up",
  collected: "picked_up",
  in_progress: "in_progress",
  inprogress: "in_progress",
  "in-progress": "in_progress",
  repairing: "in_progress",
  ready: "ready",
  repaired: "ready",
  fixed: "ready",
  out_for_delivery: "out_for_delivery",
  dispatched: "out_for_delivery",
  delivered: "delivered",
  returned: "delivered",
  completed: "completed",
  complete: "completed",
  done: "completed",
  closed: "completed",
  on_hold: "on_hold",
  hold: "on_hold",
  paused: "on_hold",
  cancelled: "cancelled",
  canceled: "cancelled",
  rejected: "cancelled",
};

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && (BOOKING_STATUSES as readonly string[]).includes(value);
}

/**
 * Maps any stored status string onto the canonical set.
 *
 * Unrecognised values fall back to "pending" rather than throwing: a booking with
 * a status nobody remembers writing must still be displayable.
 */
export function normalizeBookingStatus(value: unknown): BookingStatus {
  if (typeof value !== "string") return "pending";

  const key = value.trim().toLowerCase().replace(/\s+/g, "_");
  return STATUS_ALIASES[key] ?? "pending";
}

/**
 * Legal transitions.
 *
 * Deliberately permissive forwards (an operator can skip pickup for a walk-in, or
 * jump straight to completed) but never silently backwards, because a customer
 * watching the timeline should not see it regress. `on_hold` can be entered from
 * any live status and exited back to where work resumes.
 */
const ALLOWED_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ["confirmed", "pickup_requested", "in_progress", "on_hold", "cancelled", "completed"],
  confirmed: ["pickup_requested", "picked_up", "in_progress", "on_hold", "cancelled", "completed"],
  pickup_requested: ["picked_up", "in_progress", "on_hold", "cancelled"],
  picked_up: ["in_progress", "on_hold", "cancelled"],
  in_progress: ["ready", "out_for_delivery", "on_hold", "cancelled", "completed"],
  ready: ["out_for_delivery", "delivered", "completed", "on_hold", "cancelled"],
  out_for_delivery: ["delivered", "completed", "on_hold"],
  delivered: ["completed"],
  on_hold: ["confirmed", "pickup_requested", "picked_up", "in_progress", "ready", "cancelled"],
  completed: [],
  cancelled: [],
};

/**
 * Result of a transition check.
 *
 * Deliberately a flat type with an optional `reason` rather than a discriminated
 * union: the app tsconfigs run with `strictNullChecks: false`, under which
 * TypeScript will not narrow a union on a boolean discriminant, so a union here
 * would make `result.reason` unreachable for every caller.
 */
export type TransitionCheck = {
  allowed: boolean;
  /** Operator-facing explanation. Present only when `allowed` is false. */
  reason?: string;
};

/**
 * Whether a booking may move from `from` to `to`.
 *
 * Re-applying the current status is allowed and treated as a no-op by callers, so
 * a dashboard that re-saves an unchanged form does not error.
 */
export function canTransition(from: BookingStatus, to: BookingStatus): TransitionCheck {
  if (from === to) return { allowed: true };

  if (BOOKING_STATUS_META[from].terminal) {
    return { allowed: false, reason: `${BOOKING_STATUS_META[from].label} is a final status and cannot be changed.` };
  }
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    return {
      allowed: false,
      reason: `Cannot move from ${BOOKING_STATUS_META[from].label} to ${BOOKING_STATUS_META[to].label}.`,
    };
  }

  return { allowed: true };
}

/** The statuses a dashboard should offer as the next step from `from`. */
export function nextStatusOptions(from: BookingStatus): BookingStatus[] {
  return [...ALLOWED_TRANSITIONS[from]];
}

/**
 * The step a customer should be told to expect next, or null when the booking is
 * finished or paused.
 */
export function expectedNextStatus(current: BookingStatus): BookingStatus | null {
  const index = (BOOKING_STATUS_FLOW as readonly string[]).indexOf(current);
  if (index === -1) return null; // on_hold, cancelled, completed
  return (BOOKING_STATUS_FLOW[index + 1] as BookingStatus) ?? "completed";
}

/**
 * Position of a status on the customer timeline, for progress rendering.
 * Off-timeline statuses (on_hold, cancelled) return -1.
 */
export function timelineIndex(status: BookingStatus): number {
  if (status === "completed") return BOOKING_STATUS_FLOW.length;
  return (BOOKING_STATUS_FLOW as readonly string[]).indexOf(status);
}

export const BOOKING_TIMELINE_LENGTH = BOOKING_STATUS_FLOW.length + 1; // + completed

/** Who changed a status. Stored on each event for accountability. */
export const STATUS_ACTOR_ROLES = ["admin", "operation", "technician", "customer", "system"] as const;
export type StatusActorRole = (typeof STATUS_ACTOR_ROLES)[number];

export function isStatusActorRole(value: unknown): value is StatusActorRole {
  return typeof value === "string" && (STATUS_ACTOR_ROLES as readonly string[]).includes(value);
}
