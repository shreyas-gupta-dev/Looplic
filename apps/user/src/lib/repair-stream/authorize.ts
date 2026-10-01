import { eq } from "drizzle-orm";

// Server-side only.
if (typeof window !== "undefined") {
  throw new Error("authorize.ts is server-only and must not be imported by client code");
}

import { db } from "@/src/lib/db";
import { bookings } from "@/src/lib/db/schema";
import { getServerSupabase } from "@/src/lib/supabase/server";

/**
 * Who may watch a repair.
 *
 * Deny by default: this returns an authorized result only when the caller has
 * positively proved a relationship to the specific booking. There are exactly two
 * ways to do that, mirroring how the rest of the customer surface works:
 *
 *   1. Signed in as the customer who owns the booking (bookings.user_id).
 *   2. Presenting the booking's phone number, the same proof /track requires.
 *      Many bookings are made without an account, so without this the feature
 *      would be unavailable to most customers.
 *
 * Staff are deliberately NOT authorized here. Staff have their own dashboards; the
 * customer-facing endpoint has no reason to serve them, and every extra role that
 * can reach a camera feed is extra risk.
 */

export type ViewerAuthorization = {
  authorized: boolean;
  /** How the caller proved access; for logging, never returned to the client. */
  via?: "session" | "phone";
  bookingId?: string;
};

function lastTenDigits(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}

/**
 * Checks whether the caller may view the given booking.
 *
 * `phone` is optional; when absent only the signed-in path can succeed.
 */
export async function authorizeBookingViewer(bookingIdOrCode: string, phone?: string | null): Promise<ViewerAuthorization> {
  if (!bookingIdOrCode) return { authorized: false };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingIdOrCode);
  const isBookingCode = /^[A-Z0-9_-]{4,64}$/i.test(bookingIdOrCode);
  if (!isUuid && !isBookingCode) {
    return { authorized: false };
  }

  let row: { id: string; userId: string | null; customerPhone: string } | undefined;
  try {
    const rows = await db
      .select({ id: bookings.id, userId: bookings.userId, customerPhone: bookings.customerPhone })
      .from(bookings)
      .where(isUuid ? eq(bookings.id, bookingIdOrCode) : eq(bookings.bookingCode, bookingIdOrCode))
      .limit(1);
    row = rows[0] as typeof row;
  } catch {
    // A lookup failure must fail closed.
    return { authorized: false };
  }

  if (!row) return { authorized: false };

  // 1. Signed-in owner.
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && row.userId && row.userId === user.id) {
      return { authorized: true, via: "session", bookingId: row.id };
    }
  } catch {
    // No session, or Supabase unreachable: fall through to the phone check.
  }

  // 2. Phone number on the booking.
  if (phone) {
    const supplied = lastTenDigits(phone);
    if (supplied.length === 10 && lastTenDigits(row.customerPhone) === supplied) {
      return { authorized: true, via: "phone", bookingId: row.id };
    }
  }

  return { authorized: false };
}
