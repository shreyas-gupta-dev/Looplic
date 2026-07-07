import type { Metadata } from "next";

import { SellHomepageView, type SellSearchBrand, type SellSearchModel } from "@/src/components/next/SellHomepageView";
import { getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { siteConfig } from "@/src/lib/site";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Sell Your Phone or Laptop for Instant Cash in Bangalore",
  description:
    "Sell your old phone or laptop at your doorstep in Bangalore. Instant quote, free pickup, and same-day payment via UPI or bank transfer. Best price guaranteed.",
  pathname: "/sell",
  keywords: [
    "sell old phone",
    "sell used phone Bangalore",
    "sell old laptop",
    "sell used laptop Bangalore",
    "phone buyback",
    "laptop buyback",
    "instant cash for phone",
    "doorstep phone pickup",
    "Looplic",
  ],
});

const CATEGORY_BY_SERVICE = { mobile: "phone", laptop: "laptop" } as const;

export default async function SellHomePage() {
  const [mobileIndex, laptopIndex] = await Promise.all([
    getCatalogSearchIndex("mobile"),
    getCatalogSearchIndex("laptop"),
  ]);

  const searchBrands: SellSearchBrand[] = [];
  const searchModels: SellSearchModel[] = [];

  for (const [serviceType, index] of [["mobile", mobileIndex], ["laptop", laptopIndex]] as const) {
    const category = CATEGORY_BY_SERVICE[serviceType];
    for (const brand of index.brands) {
      searchBrands.push({
        id: `${category}-${brand.id}`,
        name: brand.name,
        category,
        href: `/sell/${category}/${brand.slug}`,
      });
    }
    for (const model of index.models) {
      searchModels.push({
        id: `${category}-${model.id}`,
        name: model.name,
        brandName: model.brand_name,
        seriesName: model.series_name,
        category,
        href: `/sell/${category}/${model.brand_slug}/${model.series_slug}/${model.slug}`,
      });
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Device Buyback",
            provider: {
              "@type": "LocalBusiness",
              name: siteConfig.name,
              url: siteConfig.url,
            },
            description:
              "Sell used phones and laptops with doorstep pickup, instant quotes, and same-day payment in Bangalore.",
            areaServed: { "@type": "City", name: "Bangalore" },
          }),
        }}
      />
      <SellHomepageView searchBrands={searchBrands} searchModels={searchModels} />
    </>
  );
}
