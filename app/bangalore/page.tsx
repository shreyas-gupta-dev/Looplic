import type { Metadata } from "next";

import { HomepageView } from "@/src/components/next/HomepageView";
import { getBrandsForListing, getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;
export const dynamic = "force-dynamic";

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
    <HomepageView
      brands={brands}
      searchBrands={searchIndex.brands}
      searchSeries={searchIndex.series}
      searchModels={searchIndex.models}
      heroTitle="Mobile Repair at Your Doorstep in Bangalore"
      heroDescription="Pick your model, choose a repair, and book a doorstep technician in minutes."
      heroBrowseHref="/service/mobile-repair/brands"
      heroSearchPlaceholder="Search your phone model in Bangalore..."
    />
  );
}
