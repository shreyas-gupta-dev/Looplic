import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { SellEvaluationFlow } from "@/src/components/next/SellEvaluationFlow";
import { getBuybackQuestionSet, getBuybackVariants } from "@/src/lib/data/buyback";
import { getBrandBySlug, getModelBySlug, getSeriesBySlug } from "@/src/lib/data/catalog";
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

  const [variants, questionSet] = await Promise.all([
    getBuybackVariants(model.id),
    getBuybackQuestionSet(serviceType),
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-[12px] text-gray-500">
          <Link href="/sell" className="font-semibold text-violet-600 hover:underline">Sell</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/sell/${sellCategory}`} className="font-semibold text-violet-600 hover:underline">Sell {label}</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/sell/${sellCategory}/${brand.slug}`} className="font-semibold text-violet-600 hover:underline">{brand.name}</Link>
          <span className="mx-1.5">/</span>
          <span>{model.name}</span>
        </nav>

        <SellEvaluationFlow
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
      </main>

      <HomepageFooter />
    </div>
  );
}
