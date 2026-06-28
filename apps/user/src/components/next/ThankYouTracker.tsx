"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { trackGoogleAdsConversion } from "@/src/lib/gtag";

export function ThankYouTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("type") || "lead";

    trackGoogleAdsConversion("thank_you_page_view", {
      lead_type: type,
      booking_code: searchParams.get("booking_code"),
      service_type: searchParams.get("service_type"),
      source: searchParams.get("source"),
      page_path: window.location.pathname,
    });
  }, [searchParams]);

  return null;
}
