import type { Metadata } from "next";

import { HomepageView } from "@/src/components/next/HomepageView";
import { getBrandsForListing, getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import {
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildServiceSchema,
} from "@/src/lib/schema";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Mobile Repair in Bangalore at Your Doorstep",
  description:
    "Book doorstep mobile repair in Bangalore with quick model search, easy scheduling, and support from Looplic.",
  pathname: "/bangalore",
  keywords: ["mobile repair Bangalore", "doorstep mobile repair Bangalore", "doorstep mobile service Bangalore"],
});

export default async function BangalorePage() {
  const [brands, searchIndex] = await Promise.all([getBrandsForListing("mobile"), getCatalogSearchIndex("mobile")]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              buildLocalBusinessSchema(),
              buildServiceSchema({
                name: "Doorstep Mobile & Laptop Repair in Bangalore",
                description:
                  "Book doorstep mobile and laptop repair anywhere in Bangalore with fast scheduling, verified technicians, and 6-month warranty.",
                path: "/bangalore",
                serviceType: "Doorstep Electronics Repair",
              }),
              buildBreadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "Bangalore", path: "/bangalore" },
              ]),
            ],
          }),
        }}
      />
      <HomepageView
        brands={brands}
        searchBrands={searchIndex.brands}
        searchSeries={searchIndex.series}
        searchModels={searchIndex.models}
        heroTitle="Phone Repaired at Your Doorstep in Bangalore in 30 Minutes"
        heroDescription="Pick your phone model, choose an issue, and a verified technician fixes it in front of you. Upfront pricing, 6-month warranty, and zero upfront payment."
        heroBrowseHref="/service/mobile-repair/brands"
        heroSearchPlaceholder="Search your phone model (e.g. iPhone 15, S23, OnePlus 11)..."
      />
    </>
  );
}
