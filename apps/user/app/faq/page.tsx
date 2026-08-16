import type { Metadata } from "next";
import { buildPageMetadata } from "@/src/lib/metadata";
import { FaqPageView } from "@/src/components/next/FaqPageView";

export const metadata: Metadata = buildPageMetadata({
  title: "Frequently Asked Questions",
  description: "Get answers to common questions about selling, buying refurbished devices, pricing, pickup, payment, and warranty on Looplic.",
  pathname: "/faq",
  keywords: ["FAQ", "Looplic help", "sell phone FAQ", "refurbished warranty", "pickup questions"],
});

export default function FaqPage() {
  return <FaqPageView />;
}
