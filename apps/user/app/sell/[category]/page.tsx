import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { getBrandsForListing } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { buildSellBrandRoute, resolveSellCategory, SELL_CATEGORIES } from "@/src/lib/sell";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const sellCategory = resolveSellCategory(category);
  if (!sellCategory) return {};
  const { label, noun } = SELL_CATEGORIES[sellCategory];

  return buildPageMetadata({
    title: `Sell Your ${label} for Instant Cash — Pick Your Brand`,
    description: `Choose your ${noun} brand to get an instant buyback quote with free doorstep pickup and same-day payment in Bangalore.`,
    pathname: `/sell/${sellCategory}`,
  });
}

export default async function SellBrandsPage({ params }: PageProps) {
  const { category } = await params;
  const sellCategory = resolveSellCategory(category);
  if (!sellCategory) notFound();

  const { serviceType, label, noun } = SELL_CATEGORIES[sellCategory];
  const brands = await getBrandsForListing(serviceType);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-[12px] text-gray-500">
          <Link href="/sell" className="font-semibold text-violet-600 hover:underline">Sell</Link>
          <span className="mx-1.5">/</span>
          <span>Sell {label}</span>
        </nav>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#8B3DFF]"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B3DFF]">Sell {label}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#111827]">Which brand is your {noun}?</h1>
          <p className="mt-1 text-[13px] text-gray-500">Pick a brand to see models and get your instant quote.</p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 md:gap-3">
          {brands.map((brand) => (
            <Link
              href={buildSellBrandRoute(sellCategory, brand.slug)}
              key={brand.id}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)]"
            >
              <BrandLogo
                name={brand.name}
                imageUrl={brand.image_url}
                letter={brand.letter}
                gradient={brand.gradient}
                className="size-10 rounded-xl object-contain"
                fallbackClassName="size-10 rounded-xl shadow-sm"
              />
              <span className="text-[11px] font-bold text-gray-900">{brand.name}</span>
            </Link>
          ))}
        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
