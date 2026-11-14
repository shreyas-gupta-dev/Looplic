"use client";

import { useState } from "react";
import { RecoveryNavbar } from "./RecoveryNavbar";
import { RecoveryHero } from "./RecoveryHero";
import { RecoveryStorageGrid } from "./RecoveryStorageGrid";
import { RecoveryTechDeepDives } from "./RecoveryTechDeepDives";
import { RecoveryEmergencyGuide } from "./RecoveryEmergencyGuide";
import { RecoveryTrustPillars } from "./RecoveryTrustPillars";
import { RecoveryProcessTimeline } from "./RecoveryProcessTimeline";
import { RecoveryPricingTiers } from "./RecoveryPricingTiers";
import { RecoveryBookingForm } from "./RecoveryBookingForm";
import { RecoveryCorporateOnsite } from "./RecoveryCorporateOnsite";
import { RecoveryTrackingSection } from "./RecoveryTrackingSection";
import { RecoveryFaqAccordion } from "./RecoveryFaqAccordion";
import { RecoveryLocationContact } from "./RecoveryLocationContact";
import { RecoveryWhatsAppWidget } from "./RecoveryWhatsAppWidget";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

export function DataRecoveryView() {
  const [selectedCategory, setSelectedCategory] = useState<string>("hdd");
  const [selectedPriority, setSelectedPriority] = useState<"standard" | "priority" | "emergency">("standard");
  const [activeTrackCode, setActiveTrackCode] = useState<string>("");

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
  };

  const handleSelectPriority = (prio: "standard" | "priority" | "emergency") => {
    setSelectedPriority(prio);
  };

  const handleTrackLookup = (code: string) => {
    setActiveTrackCode(code);
  };

  const handleBookingSuccess = (code: string) => {
    setActiveTrackCode(code);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* 1. Header with Announcement */}
      <RecoveryNavbar />

      <main id="main-content" className="flex-1">
        {/* 2. Hero Section with Quick Track Box */}
        <RecoveryHero onTrackLookup={handleTrackLookup} />

        {/* 3. Storage Device Categories Grid */}
        <RecoveryStorageGrid onSelectCategory={handleSelectCategory} />

        {/* 4. Technical Deep Dives (Mechanical HDD + Mac Logic Board) */}
        <RecoveryTechDeepDives />

        {/* 5. Emergency Drive Failure Protocol: What To Do & What NOT To Do */}
        <RecoveryEmergencyGuide />

        {/* 6. Trust & Security Pillars */}
        <RecoveryTrustPillars />

        {/* 7. Four-Step Process Timeline */}
        <RecoveryProcessTimeline />

        {/* 8. Turnaround & Priority Tiers */}
        <RecoveryPricingTiers onSelectPriority={handleSelectPriority} />

        {/* 9. Interactive Free Diagnosis Booking Form */}
        <RecoveryBookingForm
          selectedCategory={selectedCategory}
          selectedPriority={selectedPriority}
          onBookingSuccess={handleBookingSuccess}
        />

        {/* 10. Corporate On-Site Recovery Tab / Section */}
        <RecoveryCorporateOnsite />

        {/* 11. Live Case Tracking Section */}
        <RecoveryTrackingSection initialCode={activeTrackCode} />

        {/* 12. Comprehensive FAQ Accordion */}
        <RecoveryFaqAccordion />

        {/* 13. Lab Location, Map & Direct Contact */}
        <RecoveryLocationContact />
      </main>

      {/* 14. Global Footer */}
      <HomepageFooter />

      {/* 15. Floating WhatsApp Chat Widget */}
      <RecoveryWhatsAppWidget />
    </div>
  );
}
