"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackGoogleAdsConversion, trackGoogleAdsPageView } from "@/src/lib/gtag";

function isWhatsappHref(href: string) {
  return href.includes("wa.me/") || href.includes("api.whatsapp.com/") || href.startsWith("whatsapp://");
}

export function GoogleAdsNavigationTracker() {
  const pathname = usePathname();
  const isInitialLoad = useRef(true);

  // The gtag('config') calls in the root layout record the first page view;
  // this covers subsequent client-side route changes, which never reload gtag.
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    trackGoogleAdsPageView(pathname);
  }, [pathname]);

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
