// Central place that reads WhatsApp / Meta Cloud API configuration from the
// environment. Everything here is server-only — never import this into a client
// component. See `.env.example` (WhatsApp Bot section) for how to obtain values.
//
// Two numbers, one app: 8884445924 and 9886579923 both live under the same
// Meta app/WABA, so one access token, app secret and verify token cover both —
// only the phone_number_id differs per number, and that's resolved per
// message via phone-context.ts rather than hardcoded here. WHATSAPP_PHONE_NUMBER_ID
// is the default/fallback used when nothing set the active context (outbound
// sends triggered by a website booking, not a WhatsApp message — see notify.ts).

import { activePhoneNumberId } from "./phone-context";

export const GRAPH_API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";

export const whatsappConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
  appSecret: process.env.WHATSAPP_APP_SECRET || "",
  bookingTemplate: process.env.WHATSAPP_BOOKING_TEMPLATE || "",
  apiVersion: GRAPH_API_VERSION,
} as const;

// Staff numbers (E.164 without '+') that receive internal new-lead alerts.
export function getTeamNumbers(): string[] {
  return (process.env.WHATSAPP_TEAM_NUMBERS || "")
    .split(",")
    .map((n) => n.replace(/[^\d]/g, "").trim())
    .filter((n) => n.length >= 8);
}

// The phone_number_id a reply should go out from: whichever number's webhook
// triggered the message currently being handled, falling back to the default
// number when nothing set that context.
export function resolvePhoneNumberId(): string {
  return activePhoneNumberId() || whatsappConfig.phoneNumberId;
}

// True when we have enough config to actually call the Cloud API. When false,
// the webhook still verifies and logs but sends nothing (safe no-op).
export function isWhatsappConfigured(): boolean {
  return Boolean(resolvePhoneNumberId() && whatsappConfig.accessToken);
}

export function graphMessagesUrl(): string {
  return `https://graph.facebook.com/${whatsappConfig.apiVersion}/${resolvePhoneNumberId()}/messages`;
}
