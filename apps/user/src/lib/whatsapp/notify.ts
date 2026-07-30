import type { LeadPayload } from "@/src/lib/leads/types";
import { siteConfig } from "@/src/lib/site";

import { sendImage, sendTemplate, sendText } from "./client";
import { getTeamNumbers, isWhatsappConfigured, whatsappConfig } from "./config";
import { setLastBookingCode } from "./store";

// WhatsApp-safe branding image: a SOLID/colored PNG (the app icon) that stays
// visible on WhatsApp's light image bubble. Do NOT use the white transparent
// email logo here — it renders invisible on WhatsApp. Override with env if you
// host a wider branded banner (jpeg/png only).
const WHATSAPP_LOGO_URL =
  process.env.WHATSAPP_LOGO_URL || new URL("/looplic-app-icon-512.png", siteConfig.url).toString();

// Normalizes an Indian phone number to E.164 without the leading '+', which is
// what the Cloud API expects as the `to` field. Handles 10-digit local numbers,
// numbers already carrying 91, and stray formatting characters.
export function toWaId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  // Basic sanity: an Indian mobile in E.164 is 12 digits (91 + 10).
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

function deviceLabel(payload: LeadPayload): string {
  return [payload.device?.brand, payload.device?.series, payload.device?.model]
    .map((v) => (v ? String(v).trim() : ""))
    .filter(Boolean)
    .join(" ");
}

// Sends the customer a booking-received confirmation on WhatsApp. Mirrors the
// email confirmation. Outside the 24h customer-service window a free-text send
// will silently not deliver — so if WHATSAPP_BOOKING_TEMPLATE is configured we
// use the approved template (the only reliable way to open a new conversation).
export async function notifyCustomerBookingConfirmation(payload: LeadPayload): Promise<void> {
  if (!isWhatsappConfigured()) return;
  const to = toWaId(payload.customer?.phone);
  if (!to) return;

  const name = payload.customer?.name?.trim() || "there";
  const service = payload.service?.label || payload.service?.type || "your service";
  const device = deviceLabel(payload);
  const code = payload.bookingCode || "";

  if (whatsappConfig.bookingTemplate) {
    // Template body params — order must match how the template was approved in
    // Meta. Convention here: {{1}} name, {{2}} service, {{3}} booking code.
    // Branding (logo/header) lives in the approved template itself.
    await sendTemplate(
      to,
      whatsappConfig.bookingTemplate,
      [name, device ? `${service} (${device})` : service, code || "—"],
      "en",
      "booking-confirm",
    );
  } else {
    const caption = [
      `*Looplic* — booking received ✅`,
      "",
      `Hi ${name}, thanks for choosing Looplic!`,
      code ? `Booking ID: ${code}` : "",
      `Service: ${service}`,
      device ? `Device: ${device}` : "",
      "",
      "Our team will reach out shortly to confirm the details. Reply here anytime if you need help.",
    ]
      .filter(Boolean)
      .join("\n");
    // Send the confirmation as a branded image message (visible Looplic logo +
    // the details as the caption). If the image send fails (e.g. the logo URL
    // isn't reachable), fall back to a plain-text confirmation so the customer
    // always gets confirmed.
    const imageResult = await sendImage(to, WHATSAPP_LOGO_URL, caption, "booking-confirm");
    if (!imageResult.ok) {
      await sendText(to, caption.replace(/\*/g, ""), "booking-confirm-fallback");
    }
  }

  if (code) await setLastBookingCode(to, code);
}

// Alerts the team that a customer asked for a human. Sent to the same staff
// numbers as new-lead alerts.
export async function notifyTeamHandoff(waId: string, profileName: string | null): Promise<void> {
  if (!isWhatsappConfigured()) return;
  const team = getTeamNumbers();
  if (team.length === 0) return;

  const body = [
    "🙋 Customer asked for a human on WhatsApp",
    profileName ? `Name: ${profileName}` : "",
    `Number: +${waId}`,
    "The bot is paused on this chat for 2 hours — reply to them directly.",
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.all(team.map((num) => sendText(num, body, "team-handoff")));
}

// Tells the customer their booking moved to a new stage. Called from wherever
// staff change a booking's status (admin / operator). Inside the 24h window a
// plain text send works; outside it this needs an approved template, which is
// why WHATSAPP_STATUS_TEMPLATE is honoured when configured.
export async function notifyCustomerStatusChange(input: {
  phone: string;
  bookingCode: string;
  status: string;
  serviceLabel?: string | null;
  scheduledDate?: string | null;
  timeSlot?: string | null;
}): Promise<void> {
  if (!isWhatsappConfigured()) return;
  const to = toWaId(input.phone);
  if (!to) return;

  const statusText = CUSTOMER_STATUS_TEXT[input.status.toLowerCase()];
  if (!statusText) return; // Not a stage worth pinging about.

  const template = process.env.WHATSAPP_STATUS_TEMPLATE || "";
  if (template) {
    await sendTemplate(
      to,
      template,
      [input.bookingCode, statusText, input.serviceLabel || "your booking"],
      "en",
      "status-change",
    );
    return;
  }

  const lines = [
    `*Looplic* — update on your booking`,
    "",
    `Booking ID: *${input.bookingCode}*`,
    input.serviceLabel ? `Service: ${input.serviceLabel}` : "",
    `Status: *${statusText}*`,
    input.scheduledDate ? `Scheduled: ${input.scheduledDate}${input.timeSlot ? ` · ${input.timeSlot}` : ""}` : "",
    "",
    "Reply here if you need anything, or type *track* to see the latest.",
  ].filter(Boolean);

  await sendText(to, lines.join("\n"), "status-change");
}

// Only the stages a customer actually cares about get a WhatsApp ping.
const CUSTOMER_STATUS_TEXT: Record<string, string> = {
  confirmed: "Confirmed ✅",
  assigned: "Technician assigned 🧑‍🔧",
  in_progress: "In progress 🔧",
  picked_up: "Device picked up 📦",
  completed: "Completed ✅",
  cancelled: "Cancelled",
};

// Sends an internal new-lead alert to each staff number in WHATSAPP_TEAM_NUMBERS.
// Note: like any free-text send, this only delivers if the staff member has
// messaged the business number within the last 24h (or use a template for them).
export async function notifyTeamNewLead(payload: LeadPayload): Promise<void> {
  if (!isWhatsappConfigured()) return;
  const team = getTeamNumbers();
  if (team.length === 0) return;

  const name = payload.customer?.name?.trim() || "New customer";
  const phone = payload.customer?.phone?.trim() || "—";
  const service = payload.service?.label || payload.service?.type || "Lead";
  const device = deviceLabel(payload);
  const address = [payload.address, payload.city, payload.pincode]
    .map((v) => (v ? String(v).trim() : ""))
    .filter(Boolean)
    .join(", ");

  const lines = [
    `🔔 New Looplic ${payload.source === "booking" ? "booking" : "lead"}`,
    payload.bookingCode ? `ID: ${payload.bookingCode}` : "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Service: ${service}`,
    device ? `Device: ${device}` : "",
    address ? `Address: ${address}` : "",
    payload.schedule?.date ? `When: ${payload.schedule.date} ${payload.schedule.timeSlot || ""}`.trim() : "",
    payload.notes ? `Notes: ${payload.notes}` : "",
  ].filter(Boolean);

  const body = lines.join("\n");
  await Promise.all(team.map((num) => sendText(num, body, "team-alert")));
}
