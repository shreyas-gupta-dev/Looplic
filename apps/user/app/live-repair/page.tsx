import type { Metadata } from "next";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { LiveRepairClient } from "@/src/components/next/LiveRepairClient";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Watch Our Repair Workshop Live on CCTV | 100% Transparency | Looplic",
  description:
    "Watch our master technicians repair mobile phones live on CCTV. Experience 100% transparent phone repair with genuine OEM parts, clean ESD workstations, and zero part-swapping guarantee.",
  pathname: "/live-repair",
  keywords: [
    "live repair cctv",
    "watch mobile repair live",
    "transparent phone repair",
    "looplic repair workshop",
    "live repair lab",
    "bangalore phone repair live",
  ],
});

export default function LiveRepairPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      <CatalogNavbar />
      <LiveRepairClient />
      <HomepageFooter />
    </div>
  );
}
