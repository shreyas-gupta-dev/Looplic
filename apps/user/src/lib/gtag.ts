// Every ID listed here receives the page views and conversion events below.
// Remove an entry if its Google Ads account is retired.
export const GOOGLE_ADS_IDS = ["AW-18323182413", "AW-18186396144"] as const;

// GA4 property (Google Analytics). Optional: tracking stays Ads-only until the
// env var is set, so builds without it behave exactly as before.
export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";

// All destinations that receive config, page views, and events.
export const GTAG_IDS: readonly string[] = GA4_MEASUREMENT_ID
  ? [...GOOGLE_ADS_IDS, GA4_MEASUREMENT_ID]
  : GOOGLE_ADS_IDS;

// The gtag.js loader script is shared across accounts, so the URL only needs one ID.
export const GOOGLE_ADS_ID = GOOGLE_ADS_IDS[0];

type GtagCommand = "js" | "config" | "event";
type GtagParams = Record<string, string | number | boolean | null | undefined | readonly string[]>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: GtagCommand, target: string | Date, params?: GtagParams) => void;
  }
}

export function trackGoogleAdsEvent(eventName: string, params: GtagParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, {
    send_to: GTAG_IDS,
    ...params,
  });
}

export function trackGoogleAdsPageView(pagePath: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  for (const id of GTAG_IDS) {
    window.gtag("config", id, { page_path: pagePath });
  }
}

export function trackGoogleAdsConversion(conversionName: string, params: GtagParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", "conversion", {
    send_to: GTAG_IDS,
    event_category: "lead",
    event_label: conversionName,
    ...params,
  });

  trackGoogleAdsEvent(conversionName, params);
}

export function buildThankYouHref(params: GtagParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `/thank-you?${query}` : "/thank-you";
}
