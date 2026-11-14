"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Lazy-load heavy overlay components — they're not needed for first paint.
// These render floating UI (WhatsApp wizard, splash screen) that can load after
// the main page content is interactive.

const WhatsAppBookingWizard = dynamic(
  () => import("@/src/components/next/WhatsAppBookingWizard").then((m) => m.WhatsAppBookingWizard),
  { ssr: false },
);

export function LazyOverlays() {
  const pathname = usePathname();

  // On the dedicated data recovery portal, the specialized RecoveryWhatsAppWidget
  // provides data-recovery-specific triage instead of the general phone-repair wizard.
  if (pathname?.startsWith("/data-recovery")) {
    return null;
  }

  return (
    <>
      <WhatsAppBookingWizard />
    </>
  );
}
