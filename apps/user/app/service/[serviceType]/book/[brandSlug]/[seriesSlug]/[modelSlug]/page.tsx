import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingPageShell } from "@/src/components/next/BookingPageShell";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { getModelsForSeries } from "@/src/lib/data/catalog";
import { getRepairCatalogData, resolveModelPageData } from "@/src/lib/data/catalog-page";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

type PageProps = {
  params: Promise<{
    serviceType: string;
    brandSlug: string;
    seriesSlug: string;
    modelSlug: string;
  }>;
};

const serviceMap = {
  "mobile-repair": {
    listingType: "mobile" as const,
    label: "Mobile Repair",
    activeTab: "mobile-repair" as const,
    pathPrefix: "/service/mobile-repair/book",
  },
  "laptop-repair": {
    listingType: "laptop" as const,
    label: "Laptop Repair",
    activeTab: "laptop-repair" as const,
    pathPrefix: "/service/laptop-repair/book",
  },
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { serviceType, brandSlug, seriesSlug, modelSlug } = await params;
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!config) {
    return { title: "Service Booking" };
  }

  const { brand, series, model } = await resolveModelPageData(brandSlug, seriesSlug, modelSlug, config.listingType);
  if (!brand) {
    return { title: "Service Booking" };
  }
  if (!series) {
    return { title: `${brand.name} Booking` };
  }
  if (!model) {
    return { title: `${brand.name} ${series.name}` };
  }

  return buildPageMetadata({
    title: `${brand.name} ${model.name} ${config.label}`,
    description: `Choose the right ${config.label.toLowerCase()} service and book doorstep support for ${brand.name} ${model.name}.`,
    pathname: `${config.pathPrefix}/${brand.slug}/${series.slug}/${model.slug}`,
    keywords: [`${brand.name} ${model.name} ${config.label.toLowerCase()}`, `${brand.name} ${model.name} repair booking`],
  });
}

export default async function ServiceBookingPage({ params }: PageProps) {
  const { serviceType, brandSlug, seriesSlug, modelSlug } = await params;
  const config = serviceMap[serviceType as keyof typeof serviceMap];

  if (!config) {
    notFound();
  }

  const { brand, series, model } = await resolveModelPageData(brandSlug, seriesSlug, modelSlug, config.listingType);
  if (!brand) {
    notFound();
  }
  if (!series) {
    notFound();
  }
  if (!model) {
    notFound();
  }
  const [{ repairCategories, repairSubcategories }, siblingModels] = await Promise.all([
    getRepairCatalogData(config.listingType, model.id),
    getModelsForSeries(series.id),
  ]);

  return (
    <>
      <BookingPageShell
        brand={brand}
        series={series}
        model={model}
        activeTab={config.activeTab}
        basePath={`/service/${serviceType}`}
        isRepair
        repairServiceType={config.listingType}
        repairCategories={repairCategories}
        repairSubcategories={repairSubcategories}
      />
      <CrawlableInternalLinks
        title={`Related ${brand.name} ${series.name} ${config.label} pages`}
        links={[
          { href: `/service/${serviceType}/brands/${brand.slug}/${series.slug}`, label: `All ${brand.name} ${series.name} models` },
          { href: `/service/${serviceType}/brands/${brand.slug}`, label: `All ${brand.name} series` },
          { href: `/service/${serviceType}/brands`, label: `All ${config.label} brands` },
          ...siblingModels
            .filter((relatedModel) => relatedModel.id !== model.id)
            .slice(0, 12)
            .map((relatedModel) => ({
              href: `/service/${serviceType}/book/${brand.slug}/${series.slug}/${relatedModel.slug}`,
              label: `${brand.name} ${relatedModel.name} ${config.label}`,
            })),
        ]}
      />
    </>
  );
}
