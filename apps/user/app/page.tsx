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
  title: "Doorstep Mobile & Laptop Repair in Bangalore",
  description:
    "Book doorstep mobile repair, laptop repair, CCTV installation & IT support in Bangalore. Quick scheduling, technician assignment, and live order tracking.",
  pathname: "/",
  keywords: [
    "doorstep mobile repair",
    "mobile repair at home",
    "mobile repair Bangalore",
    "laptop repair at home",
    "laptop repair Bangalore",
    "CCTV installation",
    "desktop assembly",
    "IT support",
    "managed IT services",
    "AMC IT support",
    "Looplic",
  ],
});

export default async function HomePage() {
  const [brands, searchIndex] = await Promise.all([getBrandsForListing("mobile"), getCatalogSearchIndex("mobile")]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: siteConfig.name,
            url: siteConfig.url,
            description: "Doorstep mobile repair, laptop repair, CCTV installation, desktop assembly, IT support, and managed IT services in Bangalore.",
            areaServed: {
              "@type": "City",
              name: "Bangalore",
            },
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Looplic Services",
              itemListElement: [
                "Mobile Repair",
                "Laptop Repair",
                "Desktop Assembly",
                "CCTV Installation",
                "IT Support",
                "Managed IT Services",
              ].map((name) => ({
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name,
                },
              })),
            },
          }),
        }}
      />
      <NewHomepageView brands={brands} searchBrands={searchIndex.brands} searchSeries={searchIndex.series} searchModels={searchIndex.models} />
    </>
  );
}
