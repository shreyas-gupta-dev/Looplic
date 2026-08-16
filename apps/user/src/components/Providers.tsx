"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { RouteLoadingIndicator } from "@/src/components/next/RouteLoadingIndicator";
import { GoogleAdsNavigationTracker } from "@/src/components/next/GoogleAdsNavigationTracker";
import { appUrl } from "@/src/lib/auth/config";

// Lazy-load the popup — only shows on specific paths, not needed at initial load
const RepairBookingPopup = dynamic(
  () => import("@/src/components/next/RepairBookingPopup").then((m) => m.RepairBookingPopup),
  { ssr: false },
);

// Safety net for the production build only: if a user somehow loads the deployed
// app from a localhost address (stale OAuth redirect, browser autocomplete, an
// old service worker), bounce them to the canonical site so sign-in can't dead-end
// on localhost. Local `next dev` (NODE_ENV !== "production") is never touched.
function LocalhostGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const { hostname, pathname, search, hash } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
      window.location.replace(`${appUrl}${pathname}${search}${hash}`);
    }
  }, []);

  return null;
}

function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    const match = document.cookie.match(new RegExp("(^| )looplic-auth-redirect=([^;]+)"));
    if (match) {
      const redirectUrl = decodeURIComponent(match[2]);
      document.cookie = "looplic-auth-redirect=; Path=/; Max-Age=0;";
      if (redirectUrl && redirectUrl.startsWith("/")) {
        router.replace(redirectUrl);
        router.refresh();
      }
    }
  }, [router]);

  return null;
}

export function AppProviders() {
  return (
    <>
      <LocalhostGuard />
      <RouteLoadingIndicator />
      <GoogleAdsNavigationTracker />
      <AuthRedirectHandler />
      <RepairBookingPopup />
      <Toaster />
      <Sonner />
    </>
  );
}
