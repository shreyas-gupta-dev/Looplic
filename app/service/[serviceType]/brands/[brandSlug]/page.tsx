import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CatalogServiceTabs } from "@/src/components/next/CatalogServiceTabs";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { LaptopBrandBookingPrompt } from "@/src/components/next/LaptopBrandBookingPrompt";
import { MobileSeriesCatalogPage } from "@/src/components/next/MobileSeriesCatalogPage";
import { ModelsCatalogPage } from "@/src/components/next/ModelsCatalogPage";
import { SeriesCatalogPage } from "@/src/components/next/SeriesCatalogPage";
import { getModelsForSeries, getSeriesForBrand } from "@/src/lib/data/catalog";
import { resolveBrandPageData } from "@/src/lib/data/catalog-page";
import { buildPageMetadata } from "@/src/lib/metadata";

// Pre-render these pages at build time and serve them via ISR (revalidate below)
// instead of querying the database on every request. force-dynamic caused empty
// "0 models available" pages whenever the runtime could not reach the database.
export const revalidate = 300;

type PageProps = {
  params: Promise<{
    serviceType: string;
    brandSlug: string;
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

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { serviceType, brandSlug } = await params;
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!config) {
    return {
      title: "Service Brand Detail",
    };
  }

  const { brand } = await resolveBrandPageData(brandSlug, config.listingType);

  if (!brand) {
    return {
      title: "Service Brand Detail",
    };
  }

  return buildPageMetadata({
    title: `${brand.name} ${config.label}`,
    description: `Browse ${brand.name} device series supported for ${config.label.toLowerCase()} and continue to the right booking page for your model.`,
    pathname: `${config.pathPrefix}/${brand.slug}`,
  });
}

export default async function ServiceBrandPage({ params }: PageProps) {
  const { serviceType, brandSlug } = await params;
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!config) {
    notFound();
  }

  const { brand } = await resolveBrandPageData(brandSlug, config.listingType);

  if (!brand) {
    notFound();
  }

  const seriesList = await getSeriesForBrand(brand.id);

  if (config.listingType === "mobile") {
    // Cashify-scraped brands (Motorola, Nokia, Infinix, ...) carry a single
    // "All Models" series, so the series-selection page is a pointless one-card
    // hop. When a brand has only one series, render the model grid directly on
    // the brand page — matching where the multi-series brands (Apple, Samsung)
    // ultimately land, just without the extra click.
    if (seriesList.length === 1) {
      const series = seriesList[0];
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
            collapsedSeries
          />
          <CrawlableInternalLinks
            title={`${brand.name} ${config.label} models`}
            links={[
              { href: `/service/${serviceType}/brands`, label: `All ${config.label} brands` },
              { href: `/service/${serviceType}`, label: `${config.label} overview` },
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

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CatalogNavbar />
        <CatalogServiceTabs active={config.activeTab} />
        <MobileSeriesCatalogPage
          brand={brand}
          seriesList={seriesList}
          brandsPath={`/service/${serviceType}/brands`}
          seriesPathPrefix={`/service/${serviceType}/brands/${brand.slug}`}
          serviceLabel={config.label}
        />
        <CrawlableInternalLinks
          title={`${brand.name} ${config.label} models`}
          links={[
            { href: `/service/${serviceType}/brands`, label: `All ${config.label} brands` },
            { href: `/service/${serviceType}`, label: `${config.label} overview` },
            ...seriesList.map((series) => ({
              href: `/service/${serviceType}/brands/${brand.slug}/${series.slug}`,
              label: `${brand.name} ${series.name}`,
            })),
          ]}
        />
        <HomepageFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogNavbar />
      <CatalogServiceTabs active={config.activeTab} />
      <SeriesCatalogPage
        brand={brand}
        seriesList={seriesList}
        brandsPath={`/service/${serviceType}/brands`}
        seriesPathPrefix={`/service/${serviceType}/brands/${brand.slug}`}
        serviceLabel={config.label}
      />
      {config.listingType === "laptop" ? <LaptopBrandBookingPrompt brandName={brand.name} /> : null}
      <CrawlableInternalLinks
        title={`${brand.name} ${config.label} series`}
        links={[
          { href: `/service/${serviceType}/brands`, label: `All ${config.label} brands` },
          { href: `/service/${serviceType}`, label: `${config.label} overview` },
          ...seriesList.map((series) => ({
            href: `/service/${serviceType}/brands/${brand.slug}/${series.slug}`,
            label: `${brand.name} ${series.name}`,
          })),
        ]}
      />
      <HomepageFooter />
    </div>
  );
}
