import type { Metadata } from "next";

import { NewHomepageView } from "@/src/components/next/NewHomepageView";
import { getBrandsForListing, getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { siteConfig } from "@/src/lib/site";

// ISR (not force-dynamic) so the homepage is edge-cacheable. The OAuth `/?code=`
// return is handled entirely in middleware.ts (redirect to /auth/callback), so
// this page never needs request-time searchParams.
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Sell Old Phone & Laptop for Instant Cash | Buy Refurbished Devices",
  description:
    "India's most trusted platform to sell and buy refurbished phones, laptops, tablets & more. Instant price quotes, free doorstep pickup, and certified refurbished devices with warranty.",
  pathname: "/",
  keywords: [
    "sell old phone",
    "sell old laptop",
    "buy refurbished phone",
    "buy refurbished laptop",
    "phone buyback",
    "laptop buyback",
    "instant cash for phone",
    "certified refurbished",
    "sell used phone",
    "Looplic",
  ],
});

import { getFeaturedProducts } from "@/src/lib/data/products";

export default async function HomePage() {
  const [brands, searchIndex, featuredProducts] = await Promise.all([
    getBrandsForListing("mobile"),
    getCatalogSearchIndex("mobile"),
    getFeaturedProducts(),
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
            "@type": "WebSite",
            name: siteConfig.name,
            url: siteConfig.url,
            description: "India's most trusted platform to sell and buy refurbished phones, laptops, tablets & more.",
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteConfig.url}/sell?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
            publisher: {
              "@type": "Organization",
              name: siteConfig.name,
              url: siteConfig.url,
            },
          }),
        }}
      />
      <NewHomepageView
        brands={brands}
        searchBrands={searchIndex.brands}
        searchSeries={curatedSeries}
        searchModels={curatedModels}
        featuredProducts={featuredProducts}
      />
    </>
  );
}
