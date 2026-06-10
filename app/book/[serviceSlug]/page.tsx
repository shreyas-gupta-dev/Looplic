import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Suspense } from "react";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { UniversalBookingFlow } from "@/src/components/next/UniversalBookingFlow";
import { buildPageMetadata } from "@/src/lib/metadata";

export const dynamic = "force-dynamic";

const SERVICE_LABELS: Record<string, string> = {
  "desktop-assembly": "Desktop Assembly",
  cctv: "CCTV Installation",
  "it-support": "IT Support",
  "managed-it-services": "Managed IT Services",
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  "desktop-assembly": "Book a custom PC build, wiring, and component installation at your doorstep.",
  cctv: "Book professional CCTV camera installation, DVR setup, and surveillance configuration.",
  "it-support": "Book IT support for OS setup, software installation, and network configuration.",
  "managed-it-services": "Book recurring managed IT support, AMC planning, system maintenance, network setup, cloud support, and cybersecurity basics.",
};

type PageProps = {
  params: Promise<{ serviceSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { serviceSlug } = await params;
  const label = SERVICE_LABELS[serviceSlug];
  if (!label) return { title: "Book Service" };
  return buildPageMetadata({
    title: `${label} - Doorstep Booking`,
    description: SERVICE_DESCRIPTIONS[serviceSlug] || `Book ${label} at your doorstep.`,
    pathname: `/book/${serviceSlug}`,
  });
}

export default async function SimpleBookingPage({ params }: PageProps) {
  const { serviceSlug } = await params;

  if (!SERVICE_LABELS[serviceSlug]) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogNavbar />
      <div className="flex-1 pb-14 sm:pb-20 lg:pb-24">
        <Suspense fallback={
          <main className="flex flex-1 items-center justify-center p-6">
            <div className="text-sm text-muted-foreground">Loading booking flow&hellip;</div>
          </main>
        }>
          <UniversalBookingFlow serviceSlug={serviceSlug} />
        </Suspense>
      </div>
      <HomepageFooter />
    </div>
  );
}
