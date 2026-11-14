import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomepageView } from "@/src/components/next/HomepageView";
import { getBrandsForListing, getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { bangaloreAreas, getBangaloreAreaBySlug } from "@/src/lib/service-areas";
import {
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildServiceSchema,
} from "@/src/lib/schema";

export const revalidate = 300;

export function generateStaticParams() {
  // Pre-generate top area, rest generated on-demand and cached via ISR revalidate: 300
  return [{ areaSlug: "koramangala" }];
}

type PageProps = {
  params: Promise<{
    areaSlug: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaSlug } = await params;
  const area = getBangaloreAreaBySlug(areaSlug);

  if (!area) {
    return {
      title: "Bangalore Service Area",
    };
  }

  return buildPageMetadata({
    title: `Mobile & Laptop Repair in ${area.name}`,
    description: `Doorstep mobile and laptop repair in ${area.name}, Bangalore. Repaired in front of you in 30 mins with 100% data privacy and 6-month warranty.`,
    pathname: `/bangalore/${area.slug}`,
    keywords: [
      `${area.name} mobile repair`,
      `doorstep phone repair ${area.name}`,
      `${area.name} laptop repair`,
      `mobile repair in ${area.name} bangalore`,
    ],
  });
}

export default async function BangaloreAreaPage({ params }: PageProps) {
  const { areaSlug } = await params;
  const area = getBangaloreAreaBySlug(areaSlug);

  if (!area) {
    notFound();
  }

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
                name: `Doorstep Phone & Laptop Repair in ${area.name}, Bangalore`,
                description: `Fast doorstep electronics repair across ${area.name}, Bangalore. Replaced on-site in front of you with genuine parts and a 6-month warranty.`,
                path: `/bangalore/${area.slug}`,
                serviceType: "Electronics Repair",
              }),
              buildBreadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "Bangalore", path: "/bangalore" },
                { name: area.name, path: `/bangalore/${area.slug}` },
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
        heroEyebrow={`${area.name} Bangalore Service`}
        heroTitle={`Doorstep Mobile & Laptop Repair in ${area.name}`}
        heroDescription={`Technician arrives at your home or office in ${area.name}, Bangalore. Device fixed in front of you in 30 mins with original parts and 6-month warranty.`}
        heroBrowseHref="/service/mobile-repair/brands"
        heroSearchPlaceholder={`Search your phone model in ${area.name}...`}
        currentAreaSlug={area.slug}
      />
    </>
  );
}
