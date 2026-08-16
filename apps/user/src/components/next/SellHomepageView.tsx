"use client";

import { ArrowRight, Banknote, IndianRupee, Laptop, Search, ShieldCheck, Smartphone, Tablet, Truck, Watch, Headphones } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

export type SellSearchCategory = "phone" | "laptop" | "tablet" | "smartwatch" | "audio";

export type SellSearchBrand = {
  id: string;
  name: string;
  category: SellSearchCategory;
  href: string;
};

export type SellSearchModel = {
  id: string;
  name: string;
  brandName: string;
  seriesName: string;
  category: SellSearchCategory;
  href: string;
};

type CategoryBrand = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  letter: string;
  gradient: string;
  category: string;
  href: string;
};

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: "Brand" | "Model";
};

function scoreMatch(query: string, value: string) {
  const lower = value.toLowerCase();
  if (lower === query) return 400;
  if (lower.startsWith(query)) return 250;
  if (lower.includes(query)) return 120;
  return 0;
}

/* ---------- Category Tabs ---------- */
const categoryTabs = [
  { id: "phone" as const, label: "Phone", icon: Smartphone },
  { id: "laptop" as const, label: "Laptop", icon: Laptop },
  { id: "tablet" as const, label: "Tablet", icon: Tablet },
  { id: "smartwatch" as const, label: "Smartwatch", icon: Watch },
  { id: "audio" as const, label: "Audio", icon: Headphones },
];

/* ---------- How It Works ---------- */
const howItWorks = [
  {
    step: 1,
    icon: IndianRupee,
    title: "Get Instant Price",
    description: "Select your device, answer a few questions about its condition, and get an exact price instantly.",
  },
  {
    step: 2,
    icon: Truck,
    title: "Schedule Free Pickup",
    description: "Book a convenient time slot. Our executive comes to your doorstep — no packing or shipping needed.",
  },
  {
    step: 3,
    icon: Banknote,
    title: "Get Paid Instantly",
    description: "Device verified on the spot and payment transferred immediately via UPI or bank transfer.",
  },
];

/* ---------- Search Box ---------- */
function SellSearchBox({ brands, models }: { brands: SellSearchBrand[]; models: SellSearchModel[] }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [] as SearchResult[];

    const brandResults = brands
      .map((brand) => ({
        id: `brand-${brand.id}`,
        title: brand.name,
        subtitle: `Sell ${brand.category} — browse models`,
        href: brand.href,
        kind: "Brand" as const,
        score: scoreMatch(normalized, brand.name),
      }))
      .filter((item) => item.score > 0);

    const modelResults = models
      .map((model) => ({
        id: `model-${model.id}`,
        title: model.name,
        subtitle: `${model.brandName} · Get instant quote`,
        href: model.href,
        kind: "Model" as const,
        score: Math.max(
          scoreMatch(normalized, model.name),
          scoreMatch(normalized, `${model.brandName} ${model.name}`),
          scoreMatch(normalized, `${model.brandName} ${model.seriesName} ${model.name}`),
        ),
      }))
      .filter((item) => item.score > 0);

    return [...modelResults, ...brandResults]
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 8)
      .map(({ score, ...item }) => item);
  }, [brands, models, query]);

  const topResult = results[0];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(topResult?.href || "/sell/phone");
  }

  return (
    <div className="relative mx-auto max-w-lg">
      <form
        onSubmit={handleSubmit}
        className="flex items-center rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow focus-within:border-blue-300 focus-within:shadow-md"
      >
        <Search className="ml-4 size-4 flex-shrink-0 text-gray-400" />
        <input
          type="text"
          placeholder="Search your device e.g. iPhone 13, MacBook Pro"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent px-3 py-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="mr-1.5 flex-shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          aria-label="Search"
        >
          Search
        </button>
      </form>

      {query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{result.title}</div>
                    <div className="truncate text-xs text-gray-500">{result.subtitle}</div>
                  </div>
                  <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {result.kind}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-600">No results found for &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-xs text-gray-500">Try a brand or model name.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Main View ---------- */
export function SellHomepageView({
  searchBrands,
  searchModels,
  brandsByCategory,
}: {
  searchBrands: SellSearchBrand[];
  searchModels: SellSearchModel[];
  brandsByCategory: Record<string, CategoryBrand[]>;
}) {
  const [activeCategory, setActiveCategory] = useState<SellSearchCategory>("phone");
  const [brandSearch, setBrandSearch] = useState("");

  const currentBrands = brandsByCategory[activeCategory] || [];

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return currentBrands;
    return currentBrands.filter((b) => b.name.toLowerCase().includes(q));
  }, [currentBrands, brandSearch]);

  return (
    <div className="min-h-screen bg-white">
      <CatalogNavbar />

      {/* Hero Section */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-4 pb-10 pt-8 sm:pt-12 sm:pb-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
            Sell Your Old Device
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-gray-500 sm:text-lg">
            Get instant price, free doorstep pickup, and same-day payment. Best price guaranteed.
          </p>

          <div className="mt-8">
            <SellSearchBox brands={searchBrands} models={searchModels} />
          </div>
        </div>
      </section>

      {/* Category Tabs + Brand Grid */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
          Select Your Brand
        </h2>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveCategory(tab.id); setBrandSearch(""); }}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Brand Search within category */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            placeholder={`Search ${activeCategory} brands...`}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
          />
        </div>

        {/* Brand Grid */}
        {filteredBrands.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-600">
              {brandSearch
                ? `No brands found for "${brandSearch}".`
                : "No brands available in this category yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {filteredBrands.map((brand) => (
              <Link
                key={brand.id}
                href={brand.href}
                className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-5 transition-all duration-150 hover:border-gray-300 hover:shadow-md"
              >
                <BrandLogo
                  name={brand.name}
                  imageUrl={brand.image_url}
                  letter={brand.letter}
                  gradient={brand.gradient}
                  className="size-12 rounded-lg object-contain"
                  fallbackClassName="size-12 rounded-lg"
                />
                <span className="text-center text-xs font-medium text-gray-800 leading-tight">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* View all link */}
        <div className="mt-6 text-center">
          <Link
            href={`/sell/${activeCategory}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            View all {activeCategory} brands <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-xl font-bold text-gray-900 sm:text-2xl">
            How It Works
          </h2>
          <p className="mb-10 text-center text-sm text-gray-500 sm:text-base">
            Sell your device in 3 simple steps
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            {howItWorks.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-blue-50">
                    <Icon className="size-6 text-blue-600" />
                  </div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                    Step {step.step}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="border-t border-gray-100 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-xl font-bold text-gray-900 sm:text-2xl">
            Why Sell With Us
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-5 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-green-50">
                <IndianRupee className="size-5 text-green-600" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Best Price</h3>
              <p className="text-xs text-gray-500">Guaranteed best market value for your device</p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-5 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-blue-50">
                <Truck className="size-5 text-blue-600" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Free Pickup</h3>
              <p className="text-xs text-gray-500">Doorstep pickup at your convenience, no cost</p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-5 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-purple-50">
                <Banknote className="size-5 text-purple-600" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Instant Payment</h3>
              <p className="text-xs text-gray-500">Get paid immediately via UPI or bank transfer</p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-5 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-orange-50">
                <ShieldCheck className="size-5 text-orange-600" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Data Safety</h3>
              <p className="text-xs text-gray-500">Certified data wipe before and after handover</p>
            </div>
          </div>
        </div>
      </section>

      <HomepageFooter />
    </div>
  );
}
