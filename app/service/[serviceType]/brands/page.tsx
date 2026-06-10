import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrandsCatalogPage } from "@/src/components/next/BrandsCatalogPage";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CatalogServiceTabs } from "@/src/components/next/CatalogServiceTabs";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { getBrandsForListing } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";

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
    pathname: "/service/mobile-repair/brands",
  },
  "laptop-repair": {
    listingType: "laptop" as const,
    label: "Laptop Repair",
    activeTab: "laptop-repair" as const,
    pathname: "/service/laptop-repair/brands",
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
      title: "Service Brands",
    };
  }

  return buildPageMetadata({
    title: `${config.label} Brands`,
    description: `Browse all brands supported for ${config.label.toLowerCase()} and continue to the right device series and model booking page.`,
    pathname: config.pathname,
  });
}

export default async function ServiceBrandsPage({ params }: PageProps) {
  const { serviceType } = await params;
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!config) {
    notFound();
  }

  const brands = await getBrandsForListing(config.listingType);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogNavbar />
      <CatalogServiceTabs active={config.activeTab} />
      <BrandsCatalogPage
        brands={brands}
        serviceLabel={config.label}
        servicePathPrefix={`/service/${serviceType}/brands`}
      />
      <CrawlableInternalLinks
        title={`${config.label} brand links`}
        links={[
          { href: `/service/${serviceType}`, label: `${config.label} overview` },
          ...brands.map((brand) => ({
            href: `/service/${serviceType}/brands/${brand.slug}`,
            label: `${brand.name} ${config.label}`,
          })),
        ]}
      />
      <HomepageFooter />
    </div>
  );
}
