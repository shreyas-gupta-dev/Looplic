import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomepageView } from "@/src/components/next/HomepageView";
import { getBrandsForListing, getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { bangaloreAreas, getBangaloreAreaBySlug } from "@/src/lib/service-areas";

export const revalidate = 300;
export const dynamic = "force-dynamic";

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
    title: `Mobile Repair and Laptop Repair in ${area.name}, Bangalore`,
    description: `Book doorstep mobile repair, laptop repair, and tech support in ${area.name}, Bangalore with Looplic.`,
    pathname: `/bangalore/${area.slug}`,
    keywords: [
      `${area.name} mobile repair pickup`,
      `${area.name} laptop repair pickup`,
      `${area.name} tech support`,
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
    <HomepageView
      brands={brands}
      searchBrands={searchIndex.brands}
      searchSeries={searchIndex.series}
      searchModels={searchIndex.models}
      heroEyebrow={`${area.name} Bangalore Service`}
      heroTitle={`Mobile Repair and Laptop Repair at Your Doorstep in ${area.name}, Bangalore`}
      heroDescription={`Book quick doorstep device repair and tech support in ${area.name}, Bangalore.`}
      heroBrowseHref="/service/mobile-repair/brands"
      heroSearchPlaceholder={`Search your phone model in ${area.name}...`}
      currentAreaSlug={area.slug}
    />
  );
}

export function generateStaticParams() {
  return bangaloreAreas.map((area) => ({
    areaSlug: area.slug,
  }));
}
