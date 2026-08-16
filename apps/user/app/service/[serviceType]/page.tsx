import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { ServiceLandingPage } from "@/src/components/next/ServiceLandingPage";
import { getBrandsForListing, getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { seoServicePages } from "@/src/lib/seo-service-pages";

export const revalidate = 300;

type PageProps = {
  params: Promise<{
    serviceType: string;
  }>;
};

const serviceMap = {
  "mobile-repair": {
    listingType: "mobile" as const,
    label: "Mobile Repair",
    activeTab: "mobile-repair" as const,
    pathname: "/service/mobile-repair",
  },
  "laptop-repair": {
    listingType: "laptop" as const,
    label: "Laptop Repair",
    activeTab: "laptop-repair" as const,
    pathname: "/service/laptop-repair",
  },
};

export function generateStaticParams() {
  return Object.keys(serviceMap).map((serviceType) => ({ serviceType }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { serviceType } = await params;
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!config) {
    return {
      title: "Service Landing",
    };
  }

  return buildPageMetadata({
    title: `${config.label} at Your Doorstep`,
    description: `Browse supported brands and start your ${config.label.toLowerCase()} booking with device-wise routes and doorstep service support.`,
    pathname: config.pathname,
    keywords: [config.label.toLowerCase(), `${config.label.toLowerCase()} booking`, `doorstep ${config.label.toLowerCase()}`],
  });
}

export default async function ServicePage({ params }: PageProps) {
  const { serviceType } = await params;
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!config) {
    notFound();
  }

  const [brands, searchIndex] = await Promise.all([getBrandsForListing(config.listingType), getCatalogSearchIndex(config.listingType)]);

  return (
    <div className="min-h-screen bg-white">
      <CatalogNavbar />
      <ServiceLandingPage
        serviceType={serviceType as "mobile-repair" | "laptop-repair"}
        brands={brands}
        searchSeries={searchIndex.series}
        searchModels={searchIndex.models}
        heroTitle={
          serviceType === "mobile-repair"
            ? "Mobile Phone Repair at Your Doorstep"
            : "Laptop Repair at Your Doorstep"
        }
        heroDescription={
          serviceType === "mobile-repair"
            ? "Pick your model, choose a repair, and book a doorstep technician in minutes."
            : "Professional laptop repair with certified technicians at your location."
        }
        searchPlaceholder={
          serviceType === "mobile-repair"
            ? "Search your phone model..."
            : "Search your laptop model..."
        }
      />
      <CrawlableInternalLinks
        title={`${config.label} internal links`}
        links={[
          { href: `/service/${serviceType}/brands`, label: `${config.label} brands` },
          ...brands.slice(0, 24).map((brand) => ({
            href: `/service/${serviceType}/brands/${brand.slug}`,
            label: `${brand.name} ${config.label}`,
          })),
          ...(serviceType === "mobile-repair"
            ? seoServicePages.map((page) => ({ href: `/${page.slug}`, label: page.eyebrow }))
            : []),
        ]}
      />
      <HomepageFooter />
    </div>
  );
}
