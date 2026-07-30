import type { CatalogServiceType } from "@/src/lib/data/catalog";

import { searchDevices } from "../booking";
import { applyModel } from "./machine";
import type { FlowContext, FlowStep } from "./types";

// Free-text → wizard hand-in.
//
// A customer who types "my iphone 12 screen is broken" shouldn't be dropped into
// a generic chat: they should land on the repair picker for the iPhone 12 with
// the catalogue already narrowed. This module does that deterministically —
// cheap, instant, and it never invents a price. Anything it can't classify falls
// through to the AI lane in bot.ts.

const SELL_RE = /\b(sell|sale|exchange|buy ?back|buyback|trade[- ]?in|resale|kitna milega|bech)\b/i;
const REPAIR_RE =
  /\b(repair|repare|fix|broken|cracked|crack|damage[d]?|not working|dead|replace|replacement|screen|display|battery|charging|speaker|mic|camera|water damage|service)\b/i;
const GUARD_RE = /\b(screen ?guard|tempered|protector|glass guard)\b/i;
const CCTV_RE = /\b(cctv|camera install|surveillance|dvr|nvr|security camera)\b/i;
const IT_RE = /\b(it support|desktop|assembl|network|wifi|wi-fi|router|managed it|server)\b/i;
const TRACK_RE = /\b(track|status|where is my|my order|my booking|order id|booking id)\b/i;
const LAPTOP_RE = /\b(laptop|macbook|notebook|ultrabook)\b/i;

export type Intent = { step: FlowStep; context: FlowContext; note?: string } | null;

// Booking codes look like MOB-260730-ABC123 / LAP-… / CCT-… / LBB-XXXXXX.
const BOOKING_CODE_RE = /\b((?:MOB|LAP|CCT|SCG|DSK|ITS|WIF|MIT)-\d{6}-[A-Z0-9]{4,8}|LBB-[A-Z0-9]{6})\b/i;

export function extractBookingCode(text: string): string | null {
  const match = text.match(BOOKING_CODE_RE);
  return match ? match[1].toUpperCase() : null;
}

// Best-effort classification of an opening message. Returns the wizard step to
// start at, or null to let the AI answer.
export async function detectIntent(text: string): Promise<Intent> {
  const value = (text || "").trim();
  if (value.length < 2) return null;

  const code = extractBookingCode(value);
  if (code) {
    return { step: "manage_booking", context: { kind: "track", bookingCode: code } };
  }
  if (TRACK_RE.test(value)) {
    return { step: "track_code", context: { kind: "track" } };
  }

  if (CCTV_RE.test(value)) {
    return {
      step: "cctv_service",
      context: { kind: "cctv", dbServiceType: "cctv" },
      note: "Happy to help with CCTV 🎥",
    };
  }

  if (SELL_RE.test(value)) {
    const catalogType: CatalogServiceType = LAPTOP_RE.test(value) ? "laptop" : "mobile";
    const context: FlowContext = { kind: "sell", dbServiceType: "buyback", catalogType };
    const match = await findDevice(value, catalogType);
    if (match) {
      // The model is already known, so hand in at the step AFTER model
      // selection — which for a sell is variant/condition questions, or
      // straight to details when the model has no configured price.
      const transition = await applyModel({ ...context, ...match.context });
      return {
        step: transition.step,
        context: transition.context,
        note: transition.note ?? `Let's get you a price for the *${match.label}* 💰`,
      };
    }
    return { step: "sell_category", context, note: "Let's get you a quote 💰" };
  }

  if (GUARD_RE.test(value)) {
    const context: FlowContext = { kind: "guard", dbServiceType: "screen_guard", catalogType: "mobile" };
    const match = await findDevice(value, "mobile");
    if (match) return { step: "guard", context: { ...context, ...match.context }, note: `For your *${match.label}* 🛡` };
    return { step: "brand", context, note: "Let's find the right screen guard 🛡" };
  }

  if (REPAIR_RE.test(value)) {
    const catalogType: CatalogServiceType = LAPTOP_RE.test(value) ? "laptop" : "mobile";
    const context: FlowContext = {
      kind: "repair",
      dbServiceType: catalogType === "laptop" ? "laptop_repair" : "mobile_repair",
      catalogType,
    };
    const match = await findDevice(value, catalogType);
    if (match) {
      return {
        step: "repair_category",
        context: { ...context, ...match.context },
        note: `Got it — *${match.label}* 🔧`,
      };
    }
    return { step: "brand", context, note: "Let's get that sorted 🔧" };
  }

  if (IT_RE.test(value)) {
    return {
      step: "notes",
      context: { kind: "simple", dbServiceType: IT_RE.test(value) && /desktop|assembl/i.test(value) ? "desktop_assembly" : "it_support" },
    };
  }

  return null;
}

async function findDevice(
  text: string,
  catalogType: CatalogServiceType,
): Promise<{ label: string; context: Partial<FlowContext> } | null> {
  // Strip the intent words so "sell my iphone 12" searches for "iphone 12".
  const cleaned = text
    .replace(SELL_RE, " ")
    .replace(REPAIR_RE, " ")
    .replace(GUARD_RE, " ")
    .replace(/\b(my|the|a|an|is|for|want|to|please|pls|i|need|of)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 3) return null;

  const matches = await searchDevices(cleaned, catalogType, 1);
  const match = matches[0];
  if (!match) return null;
  return {
    label: match.label,
    context: {
      // brand/series ids are what make Back work from a hand-in.
      brandId: match.brandId ?? undefined,
      brandName: match.brandName,
      seriesId: match.seriesId ?? undefined,
      seriesName: match.seriesName,
      modelId: match.modelId,
      modelName: match.modelName,
    },
  };
}
