import { eq, sql } from "drizzle-orm";

import { BOOKING_STATUS_META, type BookingStatus } from "./booking-status";
import { bookings, brands, models, repairCategories, repairSubcategories, series } from "./schema";

/**
 * Tells the customer when their repair moves to a new status.
 *
 * Before this, a status change was recorded and rendered on /track but nothing
 * was sent: the customer only found out by revisiting the tracking page and
 * guessing when to look. The status vocabulary and its customer-facing wording
 * already exist in booking-status.ts, so the message is composed from
 * BOOKING_STATUS_META rather than from a second copy of the copy that could
 * drift from what the timeline shows.
 *
 * ── Where this runs, and why here ──────────────────────────────────────────────
 *
 * Dispatch hangs off `changeBookingStatus`, which every dashboard in all four
 * apps funnels through. Putting it there rather than in the four `db-proxy`
 * routes means one implementation and no way for a status change to happen
 * silently. It fires only when an event was actually recorded, so re-saving a
 * form with an unchanged status sends nothing — the same rule that keeps
 * duplicate rows off the timeline.
 *
 * ── Delivery, and its limits ───────────────────────────────────────────────────
 *
 * WhatsApp is the channel that always works: `bookings.customer_phone` is
 * mandatory, and most bookings are made without an account.
 *
 * Email is best-effort. There is no email column on `bookings` or on
 * `customer_profiles` — the only address Looplic holds is the Supabase auth
 * identity, and only for a booking placed while signed in. So a phone-only
 * booking gets WhatsApp and nothing else. That is a data-model limit, not an
 * oversight; adding a `customer_email` column would be the fix if email needs to
 * reach everyone.
 *
 * Both channels are no-ops when unconfigured, so a developer machine with no
 * WhatsApp token neither sends nor fails.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Statuses not worth interrupting someone for. */
const SILENT_STATUSES: ReadonlySet<BookingStatus> = new Set<BookingStatus>([
  // The customer has just this second placed the order and is looking at the
  // confirmation screen; the booking-received message already covers it.
  "pending",
]);

export type StatusNotificationContext = {
  bookingId: string;
  status: BookingStatus;
  previousStatus: BookingStatus | null;
  note: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  bookingCode: string | null;
  deviceLabel: string | null;
  repairLabel: string | null;
};

export type ComposedStatusNotification = {
  subject: string;
  text: string;
  html: string;
  whatsapp: string;
};

export type StatusNotificationOutcome = {
  sent: boolean;
  channels: { whatsapp: "sent" | "skipped" | "failed"; email: "sent" | "skipped" | "failed" };
  reason?: string;
};

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.looplic.com"
  ).replace(/\/$/, "");
}

/**
 * Where to send the customer to see the detail. Deep-linked by booking code
 * because /track needs the code and the phone, and the code is the half we can
 * safely put in a message — the phone is supplied by whoever is holding the
 * device.
 */
export function trackUrlFor(bookingCode: string | null): string {
  const base = `${siteUrl()}/track`;
  return bookingCode ? `${base}?code=${encodeURIComponent(bookingCode)}` : base;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(name: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

/**
 * Builds the message for one status change.
 *
 * Pure, so the wording can be unit-tested without a database or a network.
 */
export function composeStatusNotification(context: StatusNotificationContext): ComposedStatusNotification {
  const meta = BOOKING_STATUS_META[context.status];
  const label = meta?.label ?? context.status;
  const description = meta?.customerDescription ?? "";
  const track = trackUrlFor(context.bookingCode);
  const what = [context.deviceLabel, context.repairLabel].filter(Boolean).join(" — ");

  const subject = context.bookingCode
    ? `${label} — Looplic order ${context.bookingCode}`
    : `${label} — your Looplic order`;

  const lines = [
    `Hi ${firstName(context.customerName)},`,
    "",
    // The status name, then what it means. The name alone ("Ready") does not tell
    // anyone what to do, and the explanation alone leaves them unsure which step
    // they are on — the timeline shows both, so the message does too.
    label,
    description,
    what ? `Device: ${what}` : "",
    context.bookingCode ? `Order: ${context.bookingCode}` : "",
    context.note ? `Note from our team: ${context.note}` : "",
    "",
    `Track your order: ${track}`,
  ].filter((line) => line !== "");

  const text = lines.join("\n");

  const whatsapp = [
    `*Looplic* — ${label}`,
    "",
    description,
    what ? `Device: ${what}` : "",
    context.bookingCode ? `Order: ${context.bookingCode}` : "",
    context.note ? `Note: ${context.note}` : "",
    "",
    `Track: ${track}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const html = [
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1F2A33">`,
    `<p>Hi ${escapeHtml(firstName(context.customerName))},</p>`,
    `<p style="font-size:17px;font-weight:bold;margin:16px 0 4px">${escapeHtml(label)}</p>`,
    `<p style="margin:0 0 16px">${escapeHtml(description)}</p>`,
    what ? `<p style="margin:0 0 4px"><strong>Device:</strong> ${escapeHtml(what)}</p>` : "",
    context.bookingCode
      ? `<p style="margin:0 0 4px"><strong>Order:</strong> ${escapeHtml(context.bookingCode)}</p>`
      : "",
    context.note
      ? `<p style="margin:12px 0;padding:10px 12px;background:#F4F6F5;border-radius:8px">${escapeHtml(context.note)}</p>`
      : "",
    `<p style="margin:20px 0"><a href="${escapeHtml(track)}" style="background:#29A37B;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold">Track your order</a></p>`,
    `</div>`,
  ]
    .filter(Boolean)
    .join("");

  return { subject, text, html, whatsapp };
}

/** Indian mobile → E.164 without the '+', which is what the Cloud API wants. */
function toWaId(raw: string | null): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

async function sendWhatsapp(to: string, body: string): Promise<"sent" | "skipped" | "failed"> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
  if (!phoneNumberId || !accessToken) return "skipped";

  const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";
  const template = process.env.WHATSAPP_STATUS_TEMPLATE || "";

  // Outside the 24-hour customer-service window a free-text send is accepted by
  // the API and then silently not delivered. A status update is exactly the case
  // that falls outside it — the customer has not messaged us today — so an
  // approved template is used when one is configured, and free text is the
  // fallback for a conversation that is already open.
  const payload = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: "en" },
          components: [{ type: "body", parameters: [{ type: "text", text: body }] }],
        },
      }
    : { messaging_product: "whatsapp", to, type: "text", text: { body } };

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

async function sendEmail(
  to: string,
  composed: ComposedStatusNotification,
): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) return "skipped";

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Looplic <touheed@looplic.com>",
        to: [to],
        reply_to: process.env.RESEND_REPLY_TO || undefined,
        subject: composed.subject,
        text: composed.text,
        html: composed.html,
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

/**
 * Default delivery. Never throws: a status change must not fail because a
 * message could not be sent.
 */
export async function deliverStatusNotification(
  context: StatusNotificationContext,
): Promise<StatusNotificationOutcome> {
  const channels: StatusNotificationOutcome["channels"] = { whatsapp: "skipped", email: "skipped" };

  if (SILENT_STATUSES.has(context.status)) {
    return { sent: false, channels, reason: `${context.status} is not notified` };
  }

  const composed = composeStatusNotification(context);
  const waId = toWaId(context.customerPhone);

  if (waId) channels.whatsapp = await sendWhatsapp(waId, composed.whatsapp);
  if (context.customerEmail) channels.email = await sendEmail(context.customerEmail, composed);

  return { sent: channels.whatsapp === "sent" || channels.email === "sent", channels };
}

/**
 * The active notifier. Swappable so tests can observe dispatch without sending
 * anything, and so a deployment could route notifications through a queue
 * instead of sending inline.
 */
let notifier: (context: StatusNotificationContext) => Promise<unknown> = deliverStatusNotification;

export function setStatusNotifier(fn: typeof notifier): () => void {
  const previous = notifier;
  notifier = fn;
  return () => {
    notifier = previous;
  };
}

export function resetStatusNotifier(): void {
  notifier = deliverStatusNotification;
}

type Db = {
  select: (...args: any[]) => any;
  execute?: (...args: any[]) => any;
};

/**
 * Loads the customer and device detail a message needs.
 *
 * Read after the status change has committed, so the row is the one the customer
 * is being told about.
 */
async function loadContext(
  db: Db,
  bookingId: string,
  status: BookingStatus,
  previousStatus: BookingStatus | null,
  note: string | null,
): Promise<StatusNotificationContext | null> {
  const rows = await db
    .select({
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      bookingCode: bookings.bookingCode,
      userId: bookings.userId,
      brandName: brands.name,
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
    .where(eq(bookings.id, bookingId))
    .limit(1);

  const row = (rows as Record<string, string | null>[])[0];
  if (!row) return null;

  // Email lives in Supabase auth, not in a Looplic table, and only exists for a
  // booking placed while signed in. Failure here is ignored: no address just
  // means WhatsApp only.
  let customerEmail: string | null = null;
  if (row.userId && db.execute) {
    try {
      const result = await db.execute(
        sql`SELECT email FROM auth.users WHERE id = ${row.userId}::uuid LIMIT 1`,
      );
      const authRow = (result as unknown as { rows?: { email?: string }[] }).rows?.[0];
      customerEmail = authRow?.email ?? null;
    } catch {
      customerEmail = null;
    }
  }

  return {
    bookingId,
    status,
    previousStatus,
    note,
    customerName: row.customerName ?? null,
    customerPhone: row.customerPhone ?? null,
    customerEmail,
    bookingCode: row.bookingCode ?? null,
    deviceLabel: [row.brandName, row.modelName].filter(Boolean).join(" ") || null,
    repairLabel: row.subcategoryName || row.categoryName || null,
  };
}

/**
 * Fire-and-forget dispatch, called by `changeBookingStatus` once the change has
 * committed.
 *
 * Deliberately not awaited by the caller and deliberately swallowing everything:
 * the booking has already moved on, and an operator watching a dashboard should
 * not see a status change fail because Meta returned a 500. A failure is logged
 * so it is visible in the server log rather than lost.
 */
export function dispatchStatusNotification(
  db: Db,
  input: {
    bookingId: string;
    status: BookingStatus;
    previousStatus: BookingStatus | null;
    note: string | null;
  },
): void {
  void (async () => {
    try {
      const context = await loadContext(db, input.bookingId, input.status, input.previousStatus, input.note);
      if (!context) return;
      await notifier(context);
    } catch (error) {
      console.error("[booking-status] notification failed", {
        bookingId: input.bookingId,
        status: input.status,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();
}
