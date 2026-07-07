import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { SellEvaluationFlow } from "@/src/components/next/SellEvaluationFlow";
import { getBuybackQuestionSet, getBuybackVariants } from "@/src/lib/data/buyback";
import { BrandLogo } from "@/src/components/next/BrandLogo";
import { getBrandBySlug, getBrandsForListing, getModelBySlug, getSeriesBySlug } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { deviceDisplayName, resolveSellCategory, SELL_CATEGORIES } from "@/src/lib/sell";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ category: string; brandSlug: string; seriesSlug: string; modelSlug: string }>;
};

async function resolvePageData(params: Awaited<PageProps["params"]>) {
  const sellCategory = resolveSellCategory(params.category);
  if (!sellCategory) return null;

  const { serviceType } = SELL_CATEGORIES[sellCategory];
  const brand = await getBrandBySlug(params.brandSlug, serviceType);
  if (!brand) return null;

  const series = await getSeriesBySlug(brand.id, params.seriesSlug);
  if (!series) return null;

  const model = await getModelBySlug(series.id, params.modelSlug);
  if (!model) return null;

  return { sellCategory, brand, series, model };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await resolvePageData(await params);
  if (!data) return {};

  const { sellCategory, brand, series, model } = data;
  return buildPageMetadata({
    title: `Sell ${deviceDisplayName(brand.name, model.name)} for Instant Cash`,
    description: `Get an instant buyback quote for your ${deviceDisplayName(brand.name, model.name)} — free doorstep pickup and same-day UPI or bank payment in Bangalore.`,
    pathname: `/sell/${sellCategory}/${brand.slug}/${series.slug}/${model.slug}`,
  });
}

export default async function SellEvaluatePage({ params }: PageProps) {
  const data = await resolvePageData(await params);
  if (!data) notFound();

  const { sellCategory, brand, model } = data;
  const { serviceType, label } = SELL_CATEGORIES[sellCategory];

  const [variants, questionSet, brands] = await Promise.all([
    getBuybackVariants(model.id),
    getBuybackQuestionSet(serviceType),
    getBrandsForListing(serviceType),
  ]);

  const displayName = deviceDisplayName(brand.name, model.name);
  // Deterministic pseudo social-proof count derived from the model id, so it
  // is stable across renders (Cashify-style "7400+ already sold").
  const soldCount = (Array.from(model.id).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9007, 7) % 180 + 8) * 50;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-xl font-semibold text-[#111827] sm:text-2xl">Sell Old {displayName}</h1>
        <nav aria-label="Breadcrumb" className="mb-5 text-[12px] text-gray-500">
          <Link href="/sell" className="font-semibold text-violet-600 hover:underline">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/sell/${sellCategory}`} className="font-semibold text-violet-600 hover:underline">Sell Old {label === "Phone" ? "Mobile Phone" : label}</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/sell/${sellCategory}/${brand.slug}`} className="font-semibold text-violet-600 hover:underline">Sell Old {brand.name}</Link>
          <span className="mx-1.5">/</span>
          <span>Sell Old {displayName}</span>
        </nav>

        <SellEvaluationFlow
          soldCount={soldCount}
          model={{
            id: model.id,
            name: model.name,
            brandName: brand.name,
            imageUrl: model.image_url,
            categoryLabel: label,
          }}
          variants={variants}
          serviceType={serviceType}
          questions={questionSet.questions}
          optionsByQuestion={questionSet.optionsByQuestion}
        />

        {/* Top Selling Brands (Cashify-style section under the model card) */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-[#111827]">Top Selling Brands</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 md:gap-3">
            {brands.slice(0, 12).map((b) => (
              <Link
                key={b.id}
                href={`/sell/${sellCategory}/${b.slug}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200"
              >
                <BrandLogo name={b.name} imageUrl={b.image_url} letter={b.letter} gradient={b.gradient} className="size-9 rounded-xl object-contain" fallbackClassName="size-9 rounded-xl shadow-sm" />
                <span className="text-[11px] font-bold text-gray-900">{b.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <HomepageFooter />
    </div>
  );
}
