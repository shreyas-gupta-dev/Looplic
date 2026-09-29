import { and, eq } from "drizzle-orm";

import {
  BOOKING_STATUS_META,
  expectedNextStatus,
  normalizeBookingStatus,
  timelineIndex,
  type BookingStatus,
} from "@looplic/db/booking-status";
import { getBookingStatusHistory } from "@looplic/db/booking-status-events";

import { db } from "@/src/lib/db";
import { bookings, brands, models, repairCategories, repairSubcategories, series } from "@/src/lib/db/schema";

/**
 * Repair order tracking.
 *
 * Repairs had no customer-facing status view at all — only buyback did, via
 * /sell/track. This mirrors that lookup deliberately: booking code AND phone must
 * both match. The code alone is not treated as a bearer token, because codes
 * follow a predictable shape (MOB-123456-ABCD) and a code-only URL would be
 * guessable in bulk.
 */

export type TrackedStatusEvent = {
  status: BookingStatus;
  label: string;
  description: string;
  note: string | null;
  at: string;
};

export type TrackedBooking = {
  bookingCode: string;
  /** Internal id — needed to open the repair live view; never shown. */
  bookingId: string;
  status: BookingStatus;
  statusLabel: string;
  statusDescription: string;
  /** Position on the customer timeline; -1 for on_hold and cancelled. */
  timelineIndex: number;
  nextStatus: BookingStatus | null;
  nextStatusLabel: string | null;
  serviceType: string;
  deviceLabel: string | null;
  repairLabel: string | null;
  scheduledDate: string | null;
  timeSlot: string | null;
  location: string | null;
  createdAt: string;
  customerNameMasked: string;
  phoneMasked: string;
  history: TrackedStatusEvent[];
};

function maskPhone(phone: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "•••••";
  return `••••• ${digits.slice(-4)}`;
}

/** First name plus an initial: enough to confirm the right order, not a leak. */
function maskName(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function lastTenDigits(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

const SERVICE_LABELS: Record<string, string> = {
  mobile_repair: "Mobile Repair",
  laptop_repair: "Laptop Repair",
  cctv: "CCTV Installation",
  desktop_assembly: "Desktop Assembly",
  it_support: "IT Support",
  managed_it: "Managed IT Services",
  screen_guard: "Screen Guard",
};

export function serviceLabelFor(serviceType: string): string {
  return SERVICE_LABELS[serviceType] ?? serviceType.replace(/_/g, " ");
}

/** 42P01 = table missing (pre-migration). Degrade rather than crash the page. */
function isMissingTable(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === "42P01";
}

type BookingRow = {
  id: string;
  bookingCode: string | null;
  customerName: string;
  customerPhone: string;
  status: string;
  serviceType: string;
  scheduledDate: string | null;
  timeSlot: string | null;
  location: string | null;
  createdAt: Date;
  brandName: string | null;
  seriesName: string | null;
  modelName: string | null;
  categoryName: string | null;
  subcategoryName: string | null;
};

async function selectBooking(where: ReturnType<typeof eq>): Promise<BookingRow | null> {
  const rows = await db
    .select({
      id: bookings.id,
      bookingCode: bookings.bookingCode,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      status: bookings.status,
      serviceType: bookings.serviceType,
      scheduledDate: bookings.scheduledDate,
      timeSlot: bookings.timeSlot,
      location: bookings.location,
      createdAt: bookings.createdAt,
      brandName: brands.name,
      seriesName: series.name,
      modelName: models.name,
      categoryName: repairCategories.name,
      subcategoryName: repairSubcategories.name,
    })
    .from(bookings)
    .leftJoin(models, eq(bookings.modelId, models.id))
    .leftJoin(series, eq(models.seriesId, series.id))
    .leftJoin(brands, eq(series.brandId, brands.id))
    .leftJoin(repairCategories, eq(bookings.repairCategoryId, repairCategories.id))
    .leftJoin(repairSubcategories, eq(bookings.repairSubcategoryId, repairSubcategories.id))
    .where(where)
    .limit(1);

  return (rows[0] as BookingRow) ?? null;
}

async function toTrackedBooking(row: BookingRow): Promise<TrackedBooking> {
  const status = normalizeBookingStatus(row.status);
  const meta = BOOKING_STATUS_META[status];
  const next = expectedNextStatus(status);

  let history: TrackedStatusEvent[] = [];
  try {
    const events = await getBookingStatusHistory(db as never, row.id);
    history = events.map((event) => ({
      status: event.status,
      label: BOOKING_STATUS_META[event.status].label,
      description: BOOKING_STATUS_META[event.status].customerDescription,
      note: event.note,
      at: event.createdAt.toISOString(),
    }));
  } catch (error) {
    if (!isMissingTable(error)) throw error;
  }

  // A booking created before the history table existed, and never touched since,
  // still deserves a timeline. Synthesise the opening entry from created_at
  // rather than showing an empty list.
  if (history.length === 0) {
    history = [
      {
        status: "pending",
        label: BOOKING_STATUS_META.pending.label,
        description: BOOKING_STATUS_META.pending.customerDescription,
        note: null,
        at: row.createdAt.toISOString(),
      },
    ];
  }

  const deviceLabel = [row.brandName, row.modelName].filter(Boolean).join(" ") || null;
  const repairLabel = row.subcategoryName || row.categoryName || null;

  return {
    bookingCode: row.bookingCode ?? "",
    bookingId: row.id,
    status,
    statusLabel: meta.label,
    statusDescription: meta.customerDescription,
    timelineIndex: timelineIndex(status),
    nextStatus: next,
    nextStatusLabel: next ? BOOKING_STATUS_META[next].label : null,
    serviceType: row.serviceType,
    deviceLabel,
    repairLabel,
    scheduledDate: row.scheduledDate,
    timeSlot: row.timeSlot,
    location: row.location,
    createdAt: row.createdAt.toISOString(),
    customerNameMasked: maskName(row.customerName),
    phoneMasked: maskPhone(row.customerPhone),
    history,
  };
}

/**
 * Public lookup: both the booking code and the phone number must match.
 *
 * Returns null for every failure mode — unknown code, wrong phone, malformed
 * input — so a caller cannot tell "no such booking" from "wrong phone" and use the
 * difference to confirm which codes exist.
 */
export async function trackBooking(code: string, phone: string): Promise<TrackedBooking | null> {
  const normalizedCode = code.trim().toUpperCase();
  const digits = lastTenDigits(phone);

  if (!normalizedCode || digits.length < 10) return null;

  try {
    const row = await selectBooking(eq(bookings.bookingCode, normalizedCode));
    if (!row) return null;
    if (lastTenDigits(row.customerPhone) !== digits) return null;

    return await toTrackedBooking(row);
  } catch (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
}

/**
 * Signed-in lookup by booking id, scoped to the owner.
 *
 * Lets the account page link straight into tracking without asking a customer to
 * re-type the phone number they are already authenticated with.
 */
export async function getTrackedBookingForUser(bookingId: string, userId: string): Promise<TrackedBooking | null> {
  if (!bookingId || !userId) return null;

  try {
    const rows = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
      .limit(1);

    if (!rows[0]) return null;

    const row = await selectBooking(eq(bookings.id, bookingId));
    return row ? await toTrackedBooking(row) : null;
  } catch (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
}
