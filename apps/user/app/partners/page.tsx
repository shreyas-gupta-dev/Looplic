import type { Metadata } from "next";
import { buildPageMetadata } from "@/src/lib/metadata";
import { PartnersPageView } from "@/src/components/next/PartnersPageView";

export const metadata: Metadata = buildPageMetadata({
  title: "Partner with Looplic - Franchise Opportunities",
  description: "Join Looplic's partner network. Open a franchise, become a collection partner, or integrate our buyback solution into your business.",
  pathname: "/partners",
  keywords: ["Looplic franchise", "partner program", "reseller", "buyback partner", "business opportunity"],
});

export default function PartnersPage() {
  return <PartnersPageView />;
}
