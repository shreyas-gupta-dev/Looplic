"use client";

import { ArrowRight, ArrowUpRight, BadgeIndianRupee, Banknote, Headphones, IndianRupee, Laptop, Search, ShieldCheck, Smartphone, Sparkles, Tablet, Truck, Watch, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { RepairSellToggle } from "@/src/components/next/RepairSellToggle";
import { TrustSignals } from "@/src/components/next/TrustSignals";
import { whatsappPhone } from "@/src/lib/company";

export type SellSearchBrand = {
  id: string;
  name: string;
  category: "phone" | "laptop";
  href: string;
};

export type SellSearchModel = {
  id: string;
  name: string;
  brandName: string;
  seriesName: string;
  category: "phone" | "laptop";
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
        subtitle: brand.category === "phone" ? "Sell phone — browse models" : "Sell laptop — browse models",
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
    <div className="relative mx-auto mt-6 max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="flex items-center rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow focus-within:shadow-[0_8px_30px_rgb(79,70,229,0.15)]"
      >
        <Search className="ml-3.5 size-4 flex-shrink-0 text-gray-400" />
        <input
          type="text"
          placeholder="Enter model to get quote e.g. iPhone 13"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent p-3 text-[14px] font-medium text-gray-900 outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="flex-shrink-0 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] p-3 transition-transform active:scale-95"
          aria-label="Get instant quote"
        >
          <ArrowRight className="size-4 text-white" />
        </button>
      </form>

      {query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          {results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {results.map((result) => (
                <Link key={result.id} href={result.href} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-gray-50">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-gray-900">{result.title}</div>
                    <div className="truncate text-[11px] text-gray-500">{result.subtitle}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-600">{result.kind}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-[13px] font-semibold text-gray-900">No results found.</p>
              <p className="mt-1 text-[11px] text-gray-500">Try a brand or model name, or pick a category below.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

const sellCategories = [
  {
    id: "sell-phone",
    title: "Sell Phone",
    description: "iPhone, Samsung, OnePlus & more",
    badge: "INSTANT",
    href: "/sell/phone",
    icon: Smartphone,
    iconColor: "text-teal-500",
    iconBg: "bg-teal-50",
  },
  {
    id: "sell-laptop",
    title: "Sell Laptop",
    description: "Mac, Dell, HP, Lenovo — any age",
    badge: "TOP PRICE",
    href: "/sell/laptop",
    icon: Laptop,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
  },
  {
    id: "sell-tablet",
    title: "Sell Tablet",
    description: "iPad & Android tablets",
    badge: null,
    whatsappMessage: "Hi! I want to sell my tablet. Can you give me a quote?",
    icon: Tablet,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-50",
  },
  {
    id: "smartwatch",
    title: "Smartwatch",
    description: "Apple Watch, Galaxy Watch",
    badge: null,
    whatsappMessage: "Hi! I want to sell my smartwatch. Can you give me a quote?",
    icon: Watch,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-50",
  },
  {
    id: "audio-buds",
    title: "Audio & Buds",
    description: "AirPods, headphones, buds",
    badge: null,
    whatsappMessage: "Hi! I want to sell my earbuds/headphones. Can you give me a quote?",
    icon: Headphones,
    iconColor: "text-pink-500",
    iconBg: "bg-pink-50",
  },
  {
    id: "bulk-corporate",
    title: "Bulk / Corporate",
    description: "Company IT asset buy-back",
    badge: "B2B",
    whatsappMessage: "Hi! I'm interested in bulk/corporate IT asset buy-back for my company.",
    icon: BadgeIndianRupee,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
  },
] as Array<{
  id: string;
  title: string;
  description: string;
  badge: string | null;
  href?: string;
  whatsappMessage?: string;
  icon: typeof Smartphone;
  iconColor: string;
  iconBg: string;
}>;

const howItWorks = [
  {
    icon: IndianRupee,
    title: "Get an instant quote",
    description: "Pick your model, answer a few quick questions about its condition, and see your price on the spot.",
  },
  {
    icon: Truck,
    title: "Free doorstep pickup",
    description: "Our executive comes to you, verifies the device condition, and confirms the final price in front of you.",
  },
  {
    icon: Banknote,
    title: "Instant payment",
    description: "Get paid the same day via UPI or bank transfer — before the executive leaves your door.",
  },
];

const whySell = [
  {
    icon: Zap,
    iconColor: "text-yellow-500",
    iconBg: "bg-yellow-50",
    badge: "FAST",
    title: "Instant Quote",
    description: "Real-time price in 30 seconds",
  },
  {
    icon: Truck,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
    badge: "FREE",
    title: "Free Doorstep Pickup",
    description: "We come to you — no shipping hassle",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-sky-500",
    iconBg: "bg-sky-50",
    badge: null,
    title: "Secure Data Wipe",
    description: "Certified factory reset on the spot",
  },
  {
    icon: BadgeIndianRupee,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    badge: "HOT",
    title: "Best Price Promise",
    description: "Beat any quote by ₹500 or ₹500 extra",
  },
  {
    icon: Sparkles,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-50",
    badge: null,
    title: "Same-Day Payment",
    description: "UPI / IMPS the moment we pick up",
  },
  {
    icon: Smartphone,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-50",
    badge: null,
    title: "Any Condition",
    description: "Broken screen? Dead battery? Still cash.",
  },
];

export function SellHomepageView({ searchBrands, searchModels }: { searchBrands: SellSearchBrand[]; searchModels: SellSearchModel[] }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <HomepageNavbar />

      {/* Hero Section */}
      <section className="bg-[#F1F0FB] px-4 pt-6 pb-10 sm:pt-8 sm:pb-12">
        <div className="container mx-auto max-w-2xl text-center">
          <RepairSellToggle active="sell" />

          <h1 className="mx-auto mt-7 max-w-[22rem] text-[26px] font-semibold leading-[1.1] tracking-tight text-[#111827] sm:max-w-xl sm:text-[32px] md:text-[44px]">
            Sell Your Phone or Laptop.{" "}
            <span className="bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] bg-clip-text text-transparent">Instant Cash</span> at Your Door.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-gray-500 sm:text-[15px]">
            Free doorstep pickup, instant quote, same-day payment via UPI or bank. Best price guaranteed.
          </p>

          <SellSearchBox brands={searchBrands} models={searchModels} />
        </div>
      </section>

      {/* Category Cards */}
      <section className="container mx-auto max-w-3xl px-4 pt-10 pb-6">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#8B3DFF]"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B3DFF]">What are you selling?</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#111827]">Pick a category to get instant cash</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {sellCategories.map((category) => {
            const Icon = category.icon;
            const cardClassName =
              "group relative block rounded-[20px] border border-gray-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:rounded-3xl sm:p-5";
            const cardBody = (
              <>
                <div
                  className="absolute inset-0 rounded-3xl opacity-[0.03]"
                  style={{
                    backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                <div className="relative z-10">
                  <div className="mb-4 flex items-start justify-between sm:mb-8">
                    <div className={`flex size-10 items-center justify-center rounded-xl sm:size-12 sm:rounded-2xl ${category.iconBg}`}>
                      <Icon className={`size-5 sm:size-6 ${category.iconColor}`} />
                    </div>
                    <ArrowUpRight className="size-4 text-gray-400 transition-colors group-hover:text-gray-900 sm:size-5" />
                  </div>

                  <h3 className="mb-1 text-[15px] font-semibold leading-tight text-gray-900 sm:text-[17px] sm:leading-normal">
                    {category.title}
                  </h3>
                  <p className={`text-[11px] leading-snug text-gray-500 sm:text-[13px] sm:leading-relaxed ${category.badge ? "mb-4 sm:mb-6" : ""}`}>
                    {category.description}
                  </p>

                  {category.badge ? (
                    <div className="inline-block rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 sm:px-3 sm:py-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600 sm:text-[10px]">
                        {category.badge}
                      </span>
                    </div>
                  ) : null}
                </div>
              </>
            );

            return category.href ? (
              <Link key={category.id} href={category.href} className={cardClassName}>
                {cardBody}
              </Link>
            ) : (
              <a
                key={category.id}
                href={`https://wa.me/91${whatsappPhone}?text=${encodeURIComponent(category.whatsappMessage ?? "")}`}
                target="_blank"
                rel="noreferrer"
                className={cardClassName}
              >
                {cardBody}
              </a>
            );
          })}
        </div>
      </section>

      {/* Why Looplic */}
      <section className="container mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#00D28E]"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#00B47D]">Why Looplic</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#111827]">India&apos;s easiest way to sell</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {whySell.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:rounded-3xl">
                <div className="mb-3 flex items-start justify-between">
                  <div className={`flex size-9 items-center justify-center rounded-xl ${item.iconBg} sm:size-10`}>
                    <Icon className={`size-4 ${item.iconColor} sm:size-5`} />
                  </div>
                  {item.badge ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-500">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <h3 className="mb-1 text-[13px] font-semibold leading-tight text-gray-900 sm:text-[14px]">{item.title}</h3>
                <p className="text-[11px] leading-snug text-gray-500 sm:text-[12px]">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top Offers */}
      <section className="container mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#8B3DFF]"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B3DFF]">Top Offers</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#111827]">Get a quote in 60 seconds</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {/* Offer 1: Sell Phone */}
          <div className="flex flex-col rounded-[20px] border border-violet-100/60 bg-gradient-to-br from-violet-50/80 to-indigo-50/40 p-5 md:rounded-3xl md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <Smartphone className="size-5 text-violet-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-700 sm:text-xs">Sell Phone</span>
            </div>

            <h3 className="mb-2 text-[18px] font-semibold leading-tight text-gray-900 sm:text-[20px]">
              Upgrading? Turn Your Old Phone Into Cash.
            </h3>

            <p className="mb-5 text-[13px] leading-relaxed text-gray-500 sm:text-[14px]">
              Answer a few questions about its condition and get an exact price — paid the moment we pick it up.
            </p>

            <div className="mb-6 mt-auto flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-white bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5">
                <Zap className="h-3 w-3 text-gray-400 sm:h-3.5 sm:w-3.5" />
                <span className="text-[10px] font-medium text-gray-600 sm:text-[11px]">Instant quote</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5">
                <Truck className="h-3 w-3 text-gray-400 sm:h-3.5 sm:w-3.5" />
                <span className="text-[10px] font-medium text-gray-600 sm:text-[11px]">Free pickup</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5">
                <IndianRupee className="h-3 w-3 text-gray-400 sm:h-3.5 sm:w-3.5" />
                <span className="text-[10px] font-medium text-gray-600 sm:text-[11px]">Same-day UPI</span>
              </div>
            </div>

            <Link
              href="/sell/phone"
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-5 py-2.5 text-[12px] font-bold text-white shadow-sm shadow-violet-500/20 transition-all hover:opacity-90 sm:px-6 sm:py-3 sm:text-[13px]"
            >
              Get Instant Quote <ArrowRight className="size-3.5 sm:size-4" />
            </Link>
          </div>

          {/* Offer 2: Sell Laptop */}
          <div className="flex flex-col rounded-[20px] border border-amber-100/60 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-5 md:rounded-3xl md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <Laptop className="size-5 text-amber-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-700 sm:text-xs">Sell Laptop</span>
            </div>

            <h3 className="mb-2 text-[18px] font-semibold leading-tight text-gray-900 sm:text-[20px]">
              Old Laptop Lying Around? It&apos;s Worth Money.
            </h3>

            <p className="mb-5 text-[13px] leading-relaxed text-gray-500 sm:text-[14px]">
              Mac, Dell, HP, Lenovo — any age, any condition. Get a top-price quote and doorstep pickup.
            </p>

            <div className="mb-6 mt-auto flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-white bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5">
                <BadgeIndianRupee className="h-3 w-3 text-gray-400 sm:h-3.5 sm:w-3.5" />
                <span className="text-[10px] font-medium text-gray-600 sm:text-[11px]">Top price</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5">
                <Truck className="h-3 w-3 text-gray-400 sm:h-3.5 sm:w-3.5" />
                <span className="text-[10px] font-medium text-gray-600 sm:text-[11px]">Free pickup</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5">
                <ShieldCheck className="h-3 w-3 text-gray-400 sm:h-3.5 sm:w-3.5" />
                <span className="text-[10px] font-medium text-gray-600 sm:text-[11px]">Data wiped</span>
              </div>
            </div>

            <Link
              href="/sell/laptop"
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-5 py-2.5 text-[12px] font-bold text-white shadow-sm shadow-violet-500/20 transition-all hover:opacity-90 sm:px-6 sm:py-3 sm:text-[13px]"
            >
              Quote My Laptop <ArrowRight className="size-3.5 sm:size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto max-w-3xl px-4 py-6 pb-12">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#4F46E5]"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#4F46E5]">How it works</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#111827]">Sold in 3 simple steps</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {howItWorks.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative rounded-[20px] border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:rounded-3xl sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 sm:size-12 sm:rounded-2xl">
                    <Icon className="size-5 text-violet-500 sm:size-6" />
                  </div>
                  <span className="text-[28px] font-extrabold leading-none text-gray-100">{index + 1}</span>
                </div>
                <h3 className="mb-1 text-[14px] font-semibold text-gray-900 sm:text-[16px]">{step.title}</h3>
                <p className="text-[12px] leading-relaxed text-gray-500 sm:text-[13px]">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <TrustSignals />
      <HomepageFooter />
    </div>
  );
}
