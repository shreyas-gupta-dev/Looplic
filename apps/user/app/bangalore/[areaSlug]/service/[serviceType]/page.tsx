import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CatalogServiceTabs } from "@/src/components/next/CatalogServiceTabs";
import { CctvAreaLandingPage } from "@/src/components/next/CctvAreaLandingPage";
import { HowItWorks } from "@/src/components/next/HowItWorks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { ServiceAreasSection } from "@/src/components/next/ServiceAreasSection";
import { ServiceLandingPage } from "@/src/components/next/ServiceLandingPage";
import { TrustSignals } from "@/src/components/next/TrustSignals";
import { getCctvAreaPageContent } from "@/src/lib/cctv-area-pages";
import { getBrandsForListing, getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { bangaloreAreas, getBangaloreAreaBySlug } from "@/src/lib/service-areas";

export const revalidate = 300;
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    areaSlug: string;
    serviceType: string;
  }>;
};

const serviceMap = {
  "mobile-repair": {
    listingType: "mobile" as const,
    label: "Mobile Repair",
    activeTab: "mobile-repair" as const,
  },
  "laptop-repair": {
    listingType: "laptop" as const,
    label: "Laptop Repair",
    activeTab: "laptop-repair" as const,
  },
  cctv: {
    listingType: null,
    label: "CCTV Installation",
    activeTab: null,
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaSlug, serviceType } = await params;
  const area = getBangaloreAreaBySlug(areaSlug);
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!area || !config) {
    return {
      title: "Bangalore Repair Service",
    };
  }

  return buildPageMetadata({
    title: `${config.label} in ${area.name}, Bangalore at Your Doorstep`,
    description:
      serviceType === "cctv"
        ? `Book CCTV installation in ${area.name}, Bangalore with camera placement planning, DVR/NVR setup, mobile viewing, and site handover checks.`
        : `Book ${config.label.toLowerCase()} pickup and delivery in ${area.name}, Bangalore with location-specific device search and quick booking support.`,
    pathname: `/bangalore/${area.slug}/service/${serviceType}`,
    keywords: [
      `${area.name} ${config.label.toLowerCase()}`,
      `${area.name} ${config.label.toLowerCase()} Bangalore`,
      serviceType === "cctv" ? `CCTV camera installation ${area.name}` : `${config.label.toLowerCase()} pickup ${area.name}`,
    ],
  });
}

export default async function BangaloreAreaServicePage({ params }: PageProps) {
  const { areaSlug, serviceType } = await params;
  const area = getBangaloreAreaBySlug(areaSlug);
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!area || !config) {
    notFound();
  }

  if (serviceType === "cctv") {
    return <CctvAreaLandingPage content={getCctvAreaPageContent(area)} />;
  }

  const [brands, searchIndex] = await Promise.all([getBrandsForListing(config.listingType), getCatalogSearchIndex(config.listingType)]);

  return (
    <div className="min-h-screen bg-background">
      <CatalogNavbar />
      <CatalogServiceTabs active={config.activeTab} currentAreaSlug={area.slug} />
      <ServiceLandingPage
        serviceType={serviceType as "mobile-repair" | "laptop-repair"}
        brands={brands}
        searchSeries={searchIndex.series}
        searchModels={searchIndex.models}
        eyebrow={`${area.name} Bangalore ${config.label}`}
        heroTitle={`${config.label} at Your Doorstep in ${area.name}, Bangalore`}
        heroDescription={`Book ${config.label.toLowerCase()} pickup, diagnosis, and doorstep support in ${area.name}, Bangalore with fast device-wise booking.`}
        searchPlaceholder={`Search your ${config.listingType} model in ${area.name}...`}
      />
      <HowItWorks />
      <TrustSignals />
      <HomepageFooter />
      <ServiceAreasSection currentAreaSlug={area.slug} currentRepairServiceType={serviceType as "mobile-repair" | "laptop-repair"} />
    </div>
  );
}

export function generateStaticParams() {
  return bangaloreAreas.flatMap((area) =>
    (Object.keys(serviceMap) as Array<keyof typeof serviceMap>).map((serviceType) => ({
      areaSlug: area.slug,
      serviceType,
    })),
  );
}
