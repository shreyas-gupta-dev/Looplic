"use client";

import { Amplify } from "aws-amplify";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { amplifyConfig, hasCognitoConfig } from "@/src/lib/auth/config";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { RepairBookingPopup } from "@/src/components/next/RepairBookingPopup";
import { RouteLoadingIndicator } from "@/src/components/next/RouteLoadingIndicator";
import { GoogleAdsNavigationTracker } from "@/src/components/next/GoogleAdsNavigationTracker";

if (hasCognitoConfig) {
  Amplify.configure(amplifyConfig, { ssr: true });
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
      <RouteLoadingIndicator />
      <GoogleAdsNavigationTracker />
      <AuthRedirectHandler />
      <RepairBookingPopup />
      <Toaster />
      <Sonner />
    </>
  );
}
