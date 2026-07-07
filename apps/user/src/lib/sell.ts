import type { BuybackServiceType } from "@/src/lib/data/buyback";

// Sell-flow URL categories (/sell/phone, /sell/laptop) mapped to the catalog
// + buyback service types they draw data from.
export const SELL_CATEGORIES = {
  phone: {
    serviceType: "mobile" as BuybackServiceType,
    label: "Phone",
    noun: "phone",
  },
  laptop: {
    serviceType: "laptop" as BuybackServiceType,
    label: "Laptop",
    noun: "laptop",
  },
  tablet: {
    serviceType: "tablet" as BuybackServiceType,
    label: "Tablet",
    noun: "tablet",
  },
  smartwatch: {
    serviceType: "smartwatch" as BuybackServiceType,
    label: "Smartwatch",
    noun: "smartwatch",
  },
  audio: {
    serviceType: "audio" as BuybackServiceType,
    label: "Audio Device",
    noun: "earbuds or headphones",
  },
} as const;

export type SellCategory = keyof typeof SELL_CATEGORIES;

export function resolveSellCategory(category: string): SellCategory | null {
  return category in SELL_CATEGORIES ? (category as SellCategory) : null;
}

export function buildSellBrandRoute(category: SellCategory, brandSlug: string) {
  return `/sell/${category}/${brandSlug}`;
}

export function buildSellModelRoute(category: SellCategory, brandSlug: string, seriesSlug: string, modelSlug: string) {
  return `/sell/${category}/${brandSlug}/${seriesSlug}/${modelSlug}`;
}
