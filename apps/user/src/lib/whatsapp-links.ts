import { whatsappUrl } from "@/src/lib/company";

// Click-to-WhatsApp deep links.
//
// A wa.me link can prefill the customer's FIRST message. The bot's intent
// detector (src/lib/whatsapp/flow/intent.ts) reads that message and drops them
// straight onto the right step of the guided booking wizard — so "Book on
// WhatsApp" from a model page opens the repair picker for that exact model
// rather than a generic chat.
//
// Everything in a wa.me link is visible to the customer, so these read like
// something a person would actually type. Keep the service keyword ("repair",
// "screen guard", "sell", "CCTV") in the text: that keyword is what the intent
// detector matches on.
//
// This module is client-safe — it must never import anything server-only.

export type WhatsappLinkService = "mobile_repair" | "laptop_repair" | "screen_guard" | "cctv" | "sell" | "support";

type LinkInput = {
  service: WhatsappLinkService;
  /** Brand + model, e.g. "Apple iPhone 15 Pro" — seeds the catalogue lookup. */
  device?: string | null;
  /** Optional extra sentence (e.g. the specific issue). */
  detail?: string | null;
};

const OPENERS: Record<WhatsappLinkService, (device: string) => string> = {
  mobile_repair: (device) => `Hi Looplic, I want to book a mobile repair${device}.`,
  laptop_repair: (device) => `Hi Looplic, I want to book a laptop repair${device}.`,
  screen_guard: (device) => `Hi Looplic, I want a screen guard${device}.`,
  cctv: () => "Hi Looplic, I need CCTV installation.",
  sell: (device) => `Hi Looplic, I want to sell my device${device}.`,
  support: () => "Hi Looplic, I need some help.",
};

export function buildWhatsappLink({ service, device, detail }: LinkInput): string {
  const suffix = device?.trim() ? ` for my ${device.trim()}` : "";
  const text = [OPENERS[service](suffix), detail?.trim()].filter(Boolean).join(" ");
  return `${whatsappUrl}?text=${encodeURIComponent(text)}`;
}
