import type { Metadata } from "next";
import Link from "next/link";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { SellEvaluationFlow } from "@/src/components/next/SellEvaluationFlow";
import type { BuybackOption, BuybackQuestionRow } from "@/src/lib/buyback/calc";
import type { BuybackVariant } from "@/src/lib/data/buyback";
import { buildPageMetadata } from "@/src/lib/metadata";

// Interactive demo of the Cashify-style evaluation flow with hardcoded sample
// data (iPhone 13, three storage variants, the full mobile question set from
// scripts/seed-buyback-questions-cashify.cjs). Lets the flow be reviewed
// before the variants migration + question seeds are run against prod.
// noindex — this is an internal preview page, not a customer route.

export const metadata: Metadata = buildPageMetadata({
  title: "Sell Flow Demo",
  description: "Internal demo of the buyback evaluation flow with sample data.",
  pathname: "/sell/demo",
  noIndex: true,
});

const demoVariants: BuybackVariant[] = [
  { id: "v-128", label: "128 GB", basePrice: 24000 },
  { id: "v-256", label: "256 GB", basePrice: 26500 },
  { id: "v-512", label: "512 GB", basePrice: 30000 },
];

// [id, title, description, type, options: [id, label, description, effect, amount]]
const demoData: Array<{
  q: BuybackQuestionRow;
  options: BuybackOption[];
}> = [
  {
    q: { id: "q1", service_type: "mobile", title: "Are you able to make and receive calls?", description: "Check your device for cellular network connectivity issues.", question_type: "single", sort_order: 1, active: true },
    options: [
      { id: "q1-yes", question_id: "q1", label: "Yes", description: "Connects to network and calls work fine", effect_type: "deduct_fixed", amount: 600, sort_order: 1 },
      { id: "q1-no", question_id: "q1", label: "No", description: "Cannot make or receive calls / no network", effect_type: "deduct_percent", amount: 55, sort_order: 2 },
    ],
  },
  {
    q: { id: "q2", service_type: "mobile", title: "Is your device's touch screen working properly?", description: "Check the touch screen functionality of your phone.", question_type: "single", sort_order: 2, active: true },
    options: [
      { id: "q2-yes", question_id: "q2", label: "Yes", description: "Touch responds accurately everywhere", effect_type: "deduct_fixed", amount: 500, sort_order: 1 },
      { id: "q2-no", question_id: "q2", label: "No", description: "Touch faulty, dead zones or unresponsive", effect_type: "deduct_percent", amount: 30, sort_order: 2 },
    ],
  },
  {
    q: { id: "q3", service_type: "mobile", title: "Is your phone's screen original?", description: "Pick \"Yes\" if screen was never changed or was changed by an Authorized Service Center.", question_type: "single", sort_order: 3, active: true },
    options: [
      { id: "q3-yes", question_id: "q3", label: "Yes", description: "Original or authorized-service-center screen", effect_type: "deduct_fixed", amount: 400, sort_order: 1 },
      { id: "q3-no", question_id: "q3", label: "No", description: "Screen changed at a local shop", effect_type: "deduct_percent", amount: 22, sort_order: 2 },
    ],
  },
  {
    q: { id: "q4", service_type: "mobile", title: "Select screen/body defects that are applicable", description: "Please provide correct details — skip if none apply.", question_type: "multi", sort_order: 4, active: true },
    options: [
      { id: "q4-1", question_id: "q4", label: "Broken/scratch on device screen", description: "Cracks or scratches on the glass", effect_type: "deduct_percent", amount: 30, sort_order: 1 },
      { id: "q4-2", question_id: "q4", label: "Dead spot/visible lines and discoloration on screen", description: "Display panel defects while switched on", effect_type: "deduct_percent", amount: 35, sort_order: 2 },
      { id: "q4-3", question_id: "q4", label: "Scratch/dent on device body", description: "Marks or dents on frame or back", effect_type: "deduct_percent", amount: 12, sort_order: 3 },
      { id: "q4-4", question_id: "q4", label: "Device panel missing/broken", description: "Back panel or frame parts missing or broken", effect_type: "deduct_percent", amount: 20, sort_order: 4 },
    ],
  },
  {
    q: { id: "q5", service_type: "mobile", title: "Functional or physical problems", description: "Please choose appropriate condition to get an accurate quote.", question_type: "multi", sort_order: 5, active: true },
    options: [
      { id: "q5-1", question_id: "q5", label: "Front camera not working", description: null, effect_type: "deduct_percent", amount: 8, sort_order: 1 },
      { id: "q5-2", question_id: "q5", label: "Back camera not working", description: null, effect_type: "deduct_percent", amount: 10, sort_order: 2 },
      { id: "q5-3", question_id: "q5", label: "Volume button not working", description: null, effect_type: "deduct_percent", amount: 4, sort_order: 3 },
      { id: "q5-4", question_id: "q5", label: "Fingerprint sensor not working", description: null, effect_type: "deduct_percent", amount: 6, sort_order: 4 },
      { id: "q5-5", question_id: "q5", label: "WiFi not working", description: null, effect_type: "deduct_percent", amount: 12, sort_order: 5 },
      { id: "q5-6", question_id: "q5", label: "Speaker faulty", description: null, effect_type: "deduct_percent", amount: 7, sort_order: 6 },
      { id: "q5-7", question_id: "q5", label: "Silent button not working", description: null, effect_type: "deduct_percent", amount: 3, sort_order: 7 },
      { id: "q5-8", question_id: "q5", label: "Face sensor not working", description: null, effect_type: "deduct_percent", amount: 6, sort_order: 8 },
      { id: "q5-9", question_id: "q5", label: "Power button not working", description: null, effect_type: "deduct_percent", amount: 6, sort_order: 9 },
      { id: "q5-10", question_id: "q5", label: "Charging port not working", description: null, effect_type: "deduct_percent", amount: 8, sort_order: 10 },
      { id: "q5-11", question_id: "q5", label: "Audio receiver not working", description: null, effect_type: "deduct_percent", amount: 6, sort_order: 11 },
      { id: "q5-12", question_id: "q5", label: "Camera glass broken", description: null, effect_type: "deduct_percent", amount: 5, sort_order: 12 },
      { id: "q5-13", question_id: "q5", label: "Microphone not working", description: null, effect_type: "deduct_percent", amount: 7, sort_order: 13 },
      { id: "q5-14", question_id: "q5", label: "Bluetooth not working", description: null, effect_type: "deduct_percent", amount: 8, sort_order: 14 },
      { id: "q5-15", question_id: "q5", label: "Vibrator not working", description: null, effect_type: "deduct_percent", amount: 3, sort_order: 15 },
      { id: "q5-16", question_id: "q5", label: "Proximity sensor not working", description: null, effect_type: "deduct_percent", amount: 4, sort_order: 16 },
      { id: "q5-17", question_id: "q5", label: "Battery in service (health below 80%)", description: null, effect_type: "deduct_percent", amount: 10, sort_order: 17 },
      { id: "q5-18", question_id: "q5", label: "Battery health 80-85%", description: null, effect_type: "deduct_percent", amount: 5, sort_order: 18 },
    ],
  },
  {
    q: { id: "q6", service_type: "mobile", title: "Do you have the following?", description: "Please select accessories which are available.", question_type: "multi", sort_order: 6, active: true },
    options: [
      { id: "q6-1", question_id: "q6", label: "Original charger of device", description: null, effect_type: "add_fixed", amount: 250, sort_order: 1 },
      { id: "q6-2", question_id: "q6", label: "Original box with same IMEI", description: null, effect_type: "add_fixed", amount: 250, sort_order: 2 },
    ],
  },
];

export default function SellDemoPage() {
  const questions = demoData.map((entry) => entry.q);
  const optionsByQuestion = Object.fromEntries(demoData.map((entry) => [entry.q.id, entry.options]));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="text-[12px] text-gray-500">
            <Link href="/sell" className="font-semibold text-violet-600 hover:underline">Sell</Link>
            <span className="mx-1.5">/</span>
            <span>Demo</span>
          </nav>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">
            Demo — sample data, not live prices
          </span>
        </div>

        <SellEvaluationFlow
          model={{
            id: "demo-iphone-13",
            name: "iPhone 13",
            brandName: "Apple",
            imageUrl: null,
            categoryLabel: "Phone",
          }}
          variants={demoVariants}
          questions={questions}
          optionsByQuestion={optionsByQuestion}
        />
      </main>

      <HomepageFooter />
    </div>
  );
}
