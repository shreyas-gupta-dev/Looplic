import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { SellModelsGrid, type SellModelItem } from "@/src/components/next/SellModelsGrid";
import { getBrandBySlug, getModelsForSeries, getSeriesBySlug } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { buildSellModelRoute, deviceDisplayName, resolveSellCategory, SELL_CATEGORIES } from "@/src/lib/sell";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ category: string; brandSlug: string; seriesSlug: string }>;
};

async function resolvePageData(params: Awaited<PageProps["params"]>) {
  const sellCategory = resolveSellCategory(params.category);
  if (!sellCategory) return null;

  const { serviceType } = SELL_CATEGORIES[sellCategory];
  const brand = await getBrandBySlug(params.brandSlug, serviceType);
  if (!brand) return null;

  const series = await getSeriesBySlug(brand.id, params.seriesSlug);
  if (!series) return null;

  return { sellCategory, brand, series };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await resolvePageData(await params);
  if (!data) return {};

  const { sellCategory, brand, series } = data;
  return buildPageMetadata({
    title: `Sell Old ${deviceDisplayName(brand.name, series.name)} for Instant Cash`,
    description: `Pick your exact ${brand.name} ${series.name} model to get an instant buyback quote with free doorstep pickup in Bangalore.`,
    pathname: `/sell/${sellCategory}/${brand.slug}/${series.slug}`,
  });
}

// Models of one series only — a single small query, matching the repair flow.
export default async function SellSeriesModelsPage({ params }: PageProps) {
  const data = await resolvePageData(await params);
  if (!data) notFound();

  const { sellCategory, brand, series } = data;
  const { label, noun } = SELL_CATEGORIES[sellCategory];
  const models = await getModelsForSeries(series.id);

  const modelItems: SellModelItem[] = models.map((model) => ({
    id: model.id,
    name: model.name,
    seriesName: series.name,
    imageUrl: model.image_url,
    href: buildSellModelRoute(sellCategory, brand.slug, series.slug, model.slug),
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
          <Link href={`/sell/${sellCategory}/${brand.slug}`} className="font-semibold text-violet-600 hover:underline">Sell Old {brand.name}</Link>
          <span className="mx-1.5">/</span>
          <span>{series.name}</span>
        </nav>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#8B3DFF]"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B3DFF]">{deviceDisplayName(brand.name, series.name)}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#111827]">Which {series.name} model do you have?</h1>
          <p className="mt-1 text-[13px] text-gray-500">Pick your exact model to see its instant quote.</p>
        </div>

        {modelItems.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-[13px] font-semibold text-gray-900">No models listed in {series.name} yet.</p>
            <p className="mt-1 text-[12px] text-gray-500">
              Check back soon, or <Link href="/contact-us" className="font-semibold text-violet-600 hover:underline">contact us</Link> for a manual quote.
            </p>
          </div>
        ) : (
          <SellModelsGrid models={modelItems} noun={noun} />
        )}
      </main>

      <HomepageFooter />
    </div>
  );
}
