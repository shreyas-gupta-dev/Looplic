"use client";

import dynamic from "next/dynamic";

// Lazy-load heavy overlay components — they're not needed for first paint.
// These render floating UI (WhatsApp wizard, splash screen) that can load after
// the main page content is interactive.

const WhatsAppBookingWizard = dynamic(
  () => import("@/src/components/next/WhatsAppBookingWizard").then((m) => m.WhatsAppBookingWizard),
  { ssr: false },
);

const SplashScreen = dynamic(
  () => import("@/src/components/next/SplashScreen").then((m) => m.SplashScreen),
  { ssr: false },
);

export function LazyOverlays() {
  return (
    <>
      <SplashScreen />
      <WhatsAppBookingWizard />
    </>
  );
}
