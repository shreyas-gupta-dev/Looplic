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
  title: "Sell Old Phones in Bangalore | Refurbished Phones – Looplic",
  description:
    "Sell old phones, laptops and other devices in Bangalore. Get an estimated resale value, doorstep pickup and payment after inspection. Shop quality-checked refurbished phones with warranty at Looplic.",
  pathname: "/",
  keywords: [
    "sell old phone Bangalore",
    "sell old laptop Bangalore",
    "buy refurbished phone Bangalore",
    "buy refurbished laptop",
    "phone buyback Bangalore",
    "laptop buyback",
    "sell used phone Bangalore",
    "refurbished phones Bangalore",
    "mobile repair Bangalore",
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
            description: "Sell old phones and buy quality-checked refurbished devices in Bangalore. Doorstep pickup and payment after inspection.",
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
