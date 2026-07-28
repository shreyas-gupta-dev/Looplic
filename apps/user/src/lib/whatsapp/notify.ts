import type { LeadPayload } from "@/src/lib/leads/types";

import { sendTemplate, sendText } from "./client";
import { getTeamNumbers, isWhatsappConfigured, whatsappConfig } from "./config";
import { setLastBookingCode } from "./store";

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
    await sendTemplate(
      to,
      whatsappConfig.bookingTemplate,
      [name, device ? `${service} (${device})` : service, code || "—"],
      "en",
      "booking-confirm",
    );
  } else {
    const lines = [
      `Hi ${name}, thanks for choosing Looplic! ✅`,
      "",
      "Your booking request has been received.",
      code ? `Booking ID: ${code}` : "",
      `Service: ${service}`,
      device ? `Device: ${device}` : "",
      "",
      "Our team will reach out shortly to confirm the details. Reply here anytime if you need help.",
    ].filter(Boolean);
    await sendText(to, lines.join("\n"), "booking-confirm");
  }

  if (code) await setLastBookingCode(to, code);
}

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
