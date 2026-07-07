import { and, desc, eq } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { buybackBookings } from "@/src/lib/db/schema";

export type BuybackBookingSummary = {
  bookingCode: string;
  serviceType: string;
  brandName: string;
  modelName: string;
  variantLabel: string | null;
  quotedAmount: number | null;
  pickupDate: string | null;
  timeSlot: string | null;
  status: string;
  createdAt: string;
  /** Masked, e.g. "91XXXXXX22" — safe to show on a shareable page. */
  phoneMasked: string;
};

export const BUYBACK_STATUS_STEPS = ["pending", "confirmed", "picked_up", "paid"] as const;

export const BUYBACK_STATUS_LABELS: Record<string, string> = {
  pending: "Booking received",
  quote_requested: "Quote requested",
  confirmed: "Pickup confirmed",
  picked_up: "Device picked up",
  paid: "Payment done",
  cancelled: "Cancelled",
};

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX";
  return `${digits.slice(0, 2)}${"X".repeat(Math.max(0, digits.length - 4))}${digits.slice(-2)}`;
}

function toSummary(row: typeof buybackBookings.$inferSelect): BuybackBookingSummary {
  return {
    bookingCode: row.bookingCode,
    serviceType: row.serviceType,
    brandName: row.brandName,
    modelName: row.modelName,
    variantLabel: row.variantLabel,
    quotedAmount: row.quotedAmount === null ? null : Number(row.quotedAmount),
    pickupDate: row.pickupDate,
    timeSlot: row.timeSlot,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    phoneMasked: maskPhone(row.phone),
  };
}

// 42P01 (table missing pre-migration) degrades to null / empty rather than
// crashing pages; other DB failures throw as usual.
function isMissingTable(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === "42P01";
}

export async function getBuybackBookingByCode(code: string): Promise<BuybackBookingSummary | null> {
  try {
    const rows = await db.select().from(buybackBookings).where(eq(buybackBookings.bookingCode, code)).limit(1);
    return rows[0] ? toSummary(rows[0]) : null;
  } catch (err) {
    if (isMissingTable(err)) return null;
    throw err;
  }
}

/** Code + phone must both match — used by the public track page. */
export async function trackBuybackBooking(code: string, phone: string): Promise<BuybackBookingSummary | null> {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (!digits || digits.length < 10) return null;
  try {
    const rows = await db
      .select()
      .from(buybackBookings)
      .where(eq(buybackBookings.bookingCode, code.trim().toUpperCase()))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (row.phone.replace(/\D/g, "").slice(-10) !== digits) return null;
    return toSummary(row);
  } catch (err) {
    if (isMissingTable(err)) return null;
    throw err;
  }
}

export async function getBuybackBookingsForUser(userId: string): Promise<BuybackBookingSummary[]> {
  try {
    const rows = await db
      .select()
      .from(buybackBookings)
      .where(and(eq(buybackBookings.userId, userId)))
      .orderBy(desc(buybackBookings.createdAt))
      .limit(50);
    return rows.map(toSummary);
  } catch (err) {
    if (isMissingTable(err)) return [];
    throw err;
  }
}
