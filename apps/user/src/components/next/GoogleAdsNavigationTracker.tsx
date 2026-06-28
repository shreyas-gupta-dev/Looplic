"use client";

import { useEffect } from "react";

import { trackGoogleAdsConversion } from "@/src/lib/gtag";

function isWhatsappHref(href: string) {
  return href.includes("wa.me/") || href.includes("api.whatsapp.com/") || href.startsWith("whatsapp://");
}

export function GoogleAdsNavigationTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) {
        return;
      }

      if (!isWhatsappHref(target.href)) {
        return;
      }

      trackGoogleAdsConversion("whatsapp_click", {
        page_path: window.location.pathname,
        destination: target.href,
      });
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}
