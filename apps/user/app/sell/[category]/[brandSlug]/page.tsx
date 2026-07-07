import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { SellModelsGrid, type SellModelItem } from "@/src/components/next/SellModelsGrid";
import { getBrandBySlug, getSeriesForBrand } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { resolveSellCategory, SELL_CATEGORIES } from "@/src/lib/sell";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ category: string; brandSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, brandSlug } = await params;
  const sellCategory = resolveSellCategory(category);
  if (!sellCategory) return {};

  const { serviceType, label } = SELL_CATEGORIES[sellCategory];
  const brand = await getBrandBySlug(brandSlug, serviceType);
  if (!brand) return {};

  return buildPageMetadata({
    title: `Sell Old ${brand.name} ${label} for Instant Cash in Bangalore`,
    description: `Get an instant buyback quote for your ${brand.name} ${label.toLowerCase()} with free doorstep pickup and same-day payment in Bangalore.`,
    pathname: `/sell/${sellCategory}/${brand.slug}`,
  });
}

// Mirrors the repair flow's brand → series → models hierarchy: this page only
// loads the brand's series list (a single small query) instead of eagerly
// fetching every model of every series.
export default async function SellSeriesPage({ params }: PageProps) {
  const { category, brandSlug } = await params;
  const sellCategory = resolveSellCategory(category);
  if (!sellCategory) notFound();

  const { serviceType, label, noun } = SELL_CATEGORIES[sellCategory];
  const brand = await getBrandBySlug(brandSlug, serviceType);
  if (!brand) notFound();

  const seriesList = await getSeriesForBrand(brand.id);

  const seriesItems: SellModelItem[] = seriesList.map((series) => ({
    id: series.id,
    name: series.name,
    seriesName: brand.name,
    imageUrl: series.image_url,
    href: `/sell/${sellCategory}/${brand.slug}/${series.slug}`,
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-[12px] text-gray-500">
          <Link href="/sell" className="font-semibold text-violet-600 hover:underline">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/sell/${sellCategory}`} className="font-semibold text-violet-600 hover:underline">Sell Old {label === "Phone" ? "Mobile Phone" : label}</Link>
          <span className="mx-1.5">/</span>
          <span>Sell Old {brand.name}</span>
        </nav>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#8B3DFF]"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B3DFF]">Sell {brand.name} {label}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#111827]">Sell Old {brand.name} {label}</h1>
          <p className="mt-1 text-[13px] text-gray-500">Pick your series, then your exact model — free pickup and same-day payment in Bangalore.</p>
        </div>

        {seriesItems.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-[13px] font-semibold text-gray-900">No series listed for {brand.name} yet.</p>
            <p className="mt-1 text-[12px] text-gray-500">
              Check back soon, or <Link href="/contact-us" className="font-semibold text-violet-600 hover:underline">contact us</Link> for a manual quote.
            </p>
          </div>
        ) : (
          <SellModelsGrid models={seriesItems} noun={noun} ctaLabel="View models" searchLabel={`Search ${brand.name} series...`} />
        )}
      </main>

      <HomepageFooter />
    </div>
  );
}
