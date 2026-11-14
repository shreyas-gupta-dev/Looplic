import type { Metadata } from "next";

import { SellHomepageView, type SellSearchBrand, type SellSearchModel } from "@/src/components/next/SellHomepageView";
import { getBrandsForListing } from "@/src/lib/data/catalog";
import { getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { siteConfig } from "@/src/lib/site";
import {
  buildBreadcrumbSchema,
  buildServiceSchema,
} from "@/src/lib/schema";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Sell Old Phone or Laptop for Cash in Bangalore",
  description:
    "Sell your used phone or laptop in Bangalore. Get an upfront valuation in 60s, free doorstep pickup, on-spot inspection, and instant UPI or bank transfer.",
  pathname: "/sell",
  keywords: [
    "sell old phone Bangalore",
    "sell used phone Bangalore",
    "sell old laptop Bangalore",
    "sell used laptop Bangalore",
    "phone buyback Bangalore",
    "laptop buyback Bangalore",
    "instant payment for phone",
    "doorstep phone pickup Bangalore",
    "Looplic",
  ],
});

const CATEGORY_BY_SERVICE = {
  mobile: "phone",
  laptop: "laptop",
  tablet: "tablet",
  smartwatch: "smartwatch",
  audio: "audio",
} as const;

type CategoryBrand = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  letter: string;
  gradient: string;
  category: string;
  href: string;
};

export default async function SellHomePage() {
  const serviceTypes = Object.keys(CATEGORY_BY_SERVICE) as Array<keyof typeof CATEGORY_BY_SERVICE>;
  const indexes = await Promise.all(serviceTypes.map((serviceType) => getCatalogSearchIndex(serviceType)));

  // Get brands for each category to show in category tabs
  const brandsByCategory: Record<string, CategoryBrand[]> = {};
  for (const serviceType of serviceTypes) {
    const category = CATEGORY_BY_SERVICE[serviceType];
    const brands = await getBrandsForListing(serviceType);
    brandsByCategory[category] = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      image_url: brand.image_url,
      letter: brand.letter,
      gradient: brand.gradient,
      category,
      href: `/sell/${category}/${brand.slug}`,
    }));
  }

  // Support Desktop category
  if (brandsByCategory["laptop"]) {
    brandsByCategory["desktop"] = brandsByCategory["laptop"].map((brand) => ({
      ...brand,
      category: "desktop",
      href: `/sell/desktop/${brand.slug}`,
    }));
  }

  const searchBrands: SellSearchBrand[] = [];
  const searchModels: SellSearchModel[] = [];

  if (brandsByCategory["desktop"]) {
    for (const brand of brandsByCategory["desktop"]) {
      searchBrands.push({
        id: `desktop-${brand.id}`,
        name: `${brand.name} Desktop`,
        category: "desktop",
        href: brand.href,
      });
    }
  }

  for (const [i, serviceType] of serviceTypes.entries()) {
    const index = indexes[i];
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
            "@graph": [
              buildServiceSchema({
                name: "Device Buyback & Old Phone Resale in Bangalore",
                description:
                  "Sell used phones and laptops with doorstep pickup, instant quotes, and same-day payment in Bangalore.",
                path: "/sell",
                serviceType: "Electronics Buyback",
              }),
              buildBreadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "Sell Old Devices", path: "/sell" },
              ]),
            ],
          }),
        }}
      />
      <SellHomepageView
        searchBrands={searchBrands}
        searchModels={searchModels}
        brandsByCategory={brandsByCategory}
      />
    </>
  );
}
