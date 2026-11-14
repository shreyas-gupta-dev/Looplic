import type { Metadata } from "next";

import { NewHomepageView } from "@/src/components/next/NewHomepageView";
import { getBrandsForListing, getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { siteConfig } from "@/src/lib/site";
import {
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildWebSiteSchema,
} from "@/src/lib/schema";

// Dynamically rendered to guarantee fresh routing, instant cache invalidation,
// and zero stale link state across mobile, desktop, and PWA clients.
export const revalidate = 0;

export const metadata: Metadata = buildPageMetadata({
  title: "Sell Old Phones & Doorstep Repair in Bangalore | Looplic",
  description:
    "Sell old phones and laptops with doorstep pickup in Bangalore. Fast model valuation, on-site inspection, instant payment, and 6-month warranty on repairs.",
  pathname: "/",
  keywords: [
    "sell old phone Bangalore",
    "sell old laptop Bangalore",
    "phone buyback Bangalore",
    "laptop buyback",
    "sell used phone Bangalore",
    "mobile repair Bangalore",
    "laptop repair Bangalore",
    "Looplic",
  ],
});

export default async function HomePage() {
  const [brands, searchIndex] = await Promise.all([
    getBrandsForListing("mobile"),
    getCatalogSearchIndex("mobile"),
  ]);

  // Curate top series and models per brand to avoid sending hundreds of rows down the wire
  const brandSeriesCount = new Map<string, number>();
  const curatedSeries = searchIndex.series.filter((s) => {
    const current = brandSeriesCount.get(s.brand_slug) || 0;
    if (current < 15) {
      brandSeriesCount.set(s.brand_slug, current + 1);
      return true;
    }
    return false;
  });

  const brandModelCount = new Map<string, number>();
  const curatedModels = searchIndex.models.filter((m) => {
    const current = brandModelCount.get(m.brand_slug) || 0;
    if (current < 15) {
      brandModelCount.set(m.brand_slug, current + 1);
      return true;
    }
    return false;
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              buildWebSiteSchema(),
              buildLocalBusinessSchema(),
              buildBreadcrumbSchema([{ name: "Home", path: "/" }]),
            ],
          }),
        }}
      />
      <NewHomepageView
        brands={brands}
        searchBrands={searchIndex.brands}
        searchSeries={curatedSeries}
        searchModels={curatedModels}
      />
    </>
  );
}
