import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrandModelsCatalogPage } from "@/src/components/next/BrandModelsCatalogPage";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CatalogServiceTabs } from "@/src/components/next/CatalogServiceTabs";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { LaptopBrandBookingPrompt } from "@/src/components/next/LaptopBrandBookingPrompt";
import { SeriesCatalogPage } from "@/src/components/next/SeriesCatalogPage";
import { getAllModelsForBrand, getBrandsForListing, getSeriesForBrand } from "@/src/lib/data/catalog";
import { resolveBrandPageData } from "@/src/lib/data/catalog-page";
import { buildPageMetadata } from "@/src/lib/metadata";

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

export async function generateStaticParams() {
  const params = await Promise.all(
    Object.entries(serviceMap).map(async ([serviceType, config]) => {
      const brands = await getBrandsForListing(config.listingType);
      return brands.map((brand) => ({
        serviceType,
        brandSlug: brand.slug,
      }));
    }),
  );

  return params.flat();
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

  if (config.listingType === "mobile") {
    const allModels = await getAllModelsForBrand(brand.id);
    const seriesList = await getSeriesForBrand(brand.id);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CatalogNavbar />
        <CatalogServiceTabs active={config.activeTab} />
        <BrandModelsCatalogPage
          brand={brand}
          models={allModels}
          brandsPath={`/service/${serviceType}/brands`}
          serviceType="mobile-repair"
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

  const seriesList = await getSeriesForBrand(brand.id);

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
