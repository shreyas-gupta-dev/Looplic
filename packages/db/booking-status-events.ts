import { and, desc, eq, inArray } from "drizzle-orm";

import {
  canTransition,
  isStatusActorRole,
  normalizeBookingStatus,
  type BookingStatus,
  type StatusActorRole,
} from "./booking-status";
import { dispatchStatusNotification } from "./booking-status-notify";
import { bookingStatusEvents, bookings, userRoles } from "./schema";

/**
 * Writes booking status changes, and records history while doing it.
 *
 * Every dashboard status change in every app funnels through the /api/db-proxy
 * `update` operation on the `bookings` table, so this helper is called from there
 * rather than from the dashboard components. That matters for two reasons:
 *
 *  1. AccountPageClient, BookingsTab and TechnicianDashboardClient exist as
 *     near-identical copies in all four apps. Putting the logic in the proxy means
 *     one implementation instead of four, and no risk of the copies drifting.
 *  2. It cannot be bypassed. A client that issues a raw status update still goes
 *     through the proxy, so an event is always recorded and an illegal transition
 *     is always rejected — history cannot be silently skipped.
 */

/** Minimal shape we need from a Drizzle database handle. */
type Db = {
  select: (...args: any[]) => any;
  update: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  transaction?: <T>(fn: (tx: any) => Promise<T>) => Promise<T>;
};

export type StatusChangeRequest = {
  bookingId: string;
  /** Requested status; normalized before use, so legacy spellings are accepted. */
  status: string;
  note?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  /** Other booking columns being updated in the same operation. */
  otherFields?: Record<string, unknown>;
};

/**
 * Outcome of a status change.
 *
 * Flat with optional fields for the same reason as TransitionCheck: the app
 * tsconfigs disable strictNullChecks, so a discriminated union on `ok` would not
 * narrow and callers could not reach `message`.
 */
export type StatusChangeResult = {
  ok: boolean;
  /** HTTP status to answer with when `ok` is false. */
  status?: number;
  /** Operator-facing explanation when `ok` is false. */
  message?: string;
  /** The updated booking row when `ok` is true. */
  booking?: Record<string, unknown>;
  from?: BookingStatus;
  to?: BookingStatus;
  /** False when the status was unchanged, so no history event was written. */
  recorded?: boolean;
};

/**
 * Resolves the role to attribute a change to.
 *
 * Precedence matters when someone holds more than one role: attribute the change
 * to the most privileged one so the audit trail does not understate who acted.
 * A signed-in user with no role row is a customer; no user at all is the system.
 */
export async function resolveActorRole(db: Db, userId: string | null | undefined): Promise<StatusActorRole> {
  if (!userId) return "system";

  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), inArray(userRoles.role, ["admin", "operation", "technician"])));

  const held = new Set((rows as { role: string }[]).map((row) => row.role));
  if (held.has("admin")) return "admin";
  if (held.has("operation")) return "operation";
  if (held.has("technician")) return "technician";
  return "customer";
}

/**
 * Applies a status change to a booking and appends a history event.
 *
 * Returns a structured refusal rather than throwing so the caller can map it onto
 * an HTTP status without string matching.
 */
export async function changeBookingStatus(db: Db, request: StatusChangeRequest): Promise<StatusChangeResult> {
  const { bookingId, otherFields = {} } = request;

  if (!bookingId) {
    return { ok: false, status: 400, message: "A booking id is required to change status." };
  }

  const existingRows = await db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  const existing = (existingRows as { id: string; status: string }[])[0];
  if (!existing) {
    return { ok: false, status: 404, message: "Booking not found." };
  }

  const from = normalizeBookingStatus(existing.status);
  const to = normalizeBookingStatus(request.status);

  const check = canTransition(from, to);
  if (!check.allowed) {
    return { ok: false, status: 409, message: check.reason ?? "That status change is not allowed." };
  }

  const actorRole: StatusActorRole = isStatusActorRole(request.actorRole)
    ? request.actorRole
    : await resolveActorRole(db, request.actorId);

  const note = typeof request.note === "string" && request.note.trim() ? request.note.trim() : null;

  // Re-applying the same status is a no-op: update any other fields but do not
  // add a history event, so re-saving an unchanged form does not spam the
  // customer's timeline with identical entries.
  const isNoOp = from === to;

  const apply = async (handle: Db) => {
    const updatedRows = await handle
      .update(bookings)
      .set({ ...otherFields, status: to })
      .where(eq(bookings.id, bookingId))
      .returning();

    if (!isNoOp) {
      await handle.insert(bookingStatusEvents).values({
        bookingId,
        status: to,
        previousStatus: from,
        note,
        actorId: request.actorId ?? null,
        actorRole,
      });
    }

    return (updatedRows as Record<string, unknown>[])[0] ?? {};
  };

  // The update and its history event must land together — a status change with no
  // event would be invisible to the customer, and an event with no change would
  // be a lie. Fall back to sequential writes only if the handle has no
  // transaction support.
  const booking = db.transaction ? await db.transaction((tx: Db) => apply(tx)) : await apply(db);

  // Tell the customer. After the commit, never inside the transaction: a slow or
  // failing WhatsApp send must not hold a database transaction open, and must not
  // be able to roll back a status change that has already happened. Not awaited,
  // and it swallows its own failures — see dispatchStatusNotification.
  //
  // Only on a real change: `isNoOp` means the status did not move, so re-saving an
  // unchanged form neither writes an event nor sends a message.
  if (!isNoOp) {
    dispatchStatusNotification(db as never, { bookingId, status: to, previousStatus: from, note });
  }

  return { ok: true, booking, from, to, recorded: !isNoOp };
}

export type BookingStatusEvent = {
  id: string;
  status: BookingStatus;
  previousStatus: BookingStatus | null;
  note: string | null;
  actorRole: StatusActorRole;
  createdAt: Date;
};

/**
 * Reads a booking's history oldest-first, which is the order a timeline is drawn
 * in. Statuses are normalized on the way out so a legacy value written directly to
 * the table cannot break rendering.
 */
export async function getBookingStatusHistory(db: Db, bookingId: string): Promise<BookingStatusEvent[]> {
  const rows = await db
    .select({
      id: bookingStatusEvents.id,
      status: bookingStatusEvents.status,
      previousStatus: bookingStatusEvents.previousStatus,
      note: bookingStatusEvents.note,
      actorRole: bookingStatusEvents.actorRole,
      createdAt: bookingStatusEvents.createdAt,
    })
    .from(bookingStatusEvents)
    .where(eq(bookingStatusEvents.bookingId, bookingId))
    .orderBy(desc(bookingStatusEvents.createdAt));

  return (rows as any[])
    .map((row) => ({
      id: String(row.id),
      status: normalizeBookingStatus(row.status),
      previousStatus: row.previousStatus ? normalizeBookingStatus(row.previousStatus) : null,
      note: row.note ?? null,
      actorRole: (isStatusActorRole(row.actorRole) ? row.actorRole : "system") as StatusActorRole,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    }))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/**
 * Records an event without changing the booking row.
 *
 * For notes that belong on the timeline but are not a status change (for example
 * "technician called, no answer"). Uses the booking's current status.
 */
export async function recordBookingNote(
  db: Db,
  options: { bookingId: string; note: string; actorId?: string | null; actorRole?: string | null },
): Promise<boolean> {
  const note = options.note?.trim();
  if (!options.bookingId || !note) return false;

  const rows = await db
    .select({ status: bookings.status })
    .from(bookings)
    .where(eq(bookings.id, options.bookingId))
    .limit(1);

  const current = (rows as { status: string }[])[0];
  if (!current) return false;

  const actorRole: StatusActorRole = isStatusActorRole(options.actorRole)
    ? options.actorRole
    : await resolveActorRole(db, options.actorId);

  await db.insert(bookingStatusEvents).values({
    bookingId: options.bookingId,
    status: normalizeBookingStatus(current.status),
    previousStatus: null,
    note,
    actorId: options.actorId ?? null,
    actorRole,
  });

  return true;
}
