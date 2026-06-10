export const GOOGLE_ADS_ID = "AW-18186396144";

type GtagCommand = "js" | "config" | "event";
type GtagParams = Record<string, string | number | boolean | null | undefined>;

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
    send_to: GOOGLE_ADS_ID,
    ...params,
  });
}

export function trackGoogleAdsConversion(conversionName: string, params: GtagParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", "conversion", {
    send_to: GOOGLE_ADS_ID,
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
