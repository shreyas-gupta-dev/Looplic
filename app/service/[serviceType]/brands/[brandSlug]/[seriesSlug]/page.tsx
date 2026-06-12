import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CatalogServiceTabs } from "@/src/components/next/CatalogServiceTabs";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { ModelsCatalogPage } from "@/src/components/next/ModelsCatalogPage";
import { getModelsForSeries, getSeriesForBrand } from "@/src/lib/data/catalog";
import { resolveSeriesPageData } from "@/src/lib/data/catalog-page";
import { buildPageMetadata } from "@/src/lib/metadata";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    serviceType: string;
    brandSlug: string;
    seriesSlug: string;
  }>;
};

const serviceMap = {
  "mobile-repair": {
    listingType: "mobile" as const,
    label: "Mobile Repair",
    activeTab: "mobile-repair" as const,
    pathPrefix: "/service/mobile-repair/brands",
  },
  "laptop-repair": {
    listingType: "laptop" as const,
    label: "Laptop Repair",
    activeTab: "laptop-repair" as const,
    pathPrefix: "/service/laptop-repair/brands",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { serviceType, brandSlug, seriesSlug } = await params;
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!config) {
    return {
      title: "Service Series Detail",
    };
  }

  const { brand, series } = await resolveSeriesPageData(brandSlug, seriesSlug, config.listingType);
  if (!brand) {
    return {
      title: "Service Series Detail",
    };
  }
  if (!series) {
    return {
      title: `${brand.name} Series`,
    };
  }

  return buildPageMetadata({
    title: `${brand.name} ${series.name} ${config.label}`,
    description: `Browse ${brand.name} ${series.name} models supported for ${config.label.toLowerCase()} and continue to device-specific doorstep service booking.`,
    pathname: `${config.pathPrefix}/${brand.slug}/${series.slug}`,
  });
}

export default async function ServiceSeriesPage({ params }: PageProps) {
  const { serviceType, brandSlug, seriesSlug } = await params;
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!config) {
    notFound();
  }

  const { brand, series } = await resolveSeriesPageData(brandSlug, seriesSlug, config.listingType);
  if (!brand) {
    notFound();
  }
  if (!series) {
    notFound();
  }

  const models = await getModelsForSeries(series.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogNavbar />
      <CatalogServiceTabs active={config.activeTab} />
      <ModelsCatalogPage
        brand={brand}
        series={series}
        models={models}
        brandsPath={`/service/${serviceType}/brands`}
        seriesPath={`/service/${serviceType}/brands/${brand.slug}`}
        modelPathPrefix={`/service/${serviceType}/book/${brand.slug}/${series.slug}`}
        serviceLabel={config.label}
      />
      <CrawlableInternalLinks
        title={`${brand.name} ${series.name} model links`}
        links={[
          { href: `/service/${serviceType}/brands/${brand.slug}`, label: `All ${brand.name} series` },
          { href: `/service/${serviceType}/brands`, label: `All ${config.label} brands` },
          ...models.map((model) => ({
            href: `/service/${serviceType}/book/${brand.slug}/${series.slug}/${model.slug}`,
            label: `${brand.name} ${model.name} ${config.label}`,
          })),
        ]}
      />
      <HomepageFooter />
    </div>
  );
}
