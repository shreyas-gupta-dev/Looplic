// Central place that reads WhatsApp / Meta Cloud API configuration from the
// environment. Everything here is server-only — never import this into a client
// component. See `.env.example` (WhatsApp Bot section) for how to obtain values.

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

// True when we have enough config to actually call the Cloud API. When false,
// the webhook still verifies and logs but sends nothing (safe no-op).
export function isWhatsappConfigured(): boolean {
  return Boolean(whatsappConfig.phoneNumberId && whatsappConfig.accessToken);
}

export function graphMessagesUrl(): string {
  return `https://graph.facebook.com/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`;
}
