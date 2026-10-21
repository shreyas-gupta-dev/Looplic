"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Truck } from "lucide-react";
import type { CatalogBrand, SearchModel } from "@/src/lib/data/catalog";

type QuickBuybackCalculatorProps = {
  brands: CatalogBrand[];
  models: SearchModel[];
};

export function QuickBuybackCalculator({ brands, models }: QuickBuybackCalculatorProps) {
  const [selectedBrandSlug, setSelectedBrandSlug] = useState("");
  const [selectedModelSlug, setSelectedModelSlug] = useState("");
  const router = useRouter();

  // Filter models for selected brand
  const availableModels = selectedBrandSlug
    ? models.filter((m) => m.brand_slug.toLowerCase() === selectedBrandSlug.toLowerCase()).slice(0, 30)
    : [];

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrandSlug) return;

    if (selectedModelSlug) {
      const foundModel = models.find((m) => m.slug === selectedModelSlug && m.brand_slug === selectedBrandSlug);
      if (foundModel) {
        router.push(`/sell/phone/${foundModel.brand_slug}/${foundModel.series_slug}/${foundModel.slug}`);
        return;
      }
    }
    router.push(`/sell/phone/${selectedBrandSlug}`);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1838] via-[#102a5c] to-[#0a1931] p-6 sm:p-8 lg:p-10 text-white shadow-2xl border border-white/10">
      {/* Decorative ambient gradient glows */}
      <div className="absolute -right-20 -top-20 size-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 size-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* Left Column: Heading and value propositions */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 text-xs font-semibold text-cyan-300 mb-3.5 shadow-sm">
            <Sparkles className="size-3.5 text-cyan-400" />
            <span>Instant Mobile Buyback Value</span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Check Your Phone&apos;s Exact Resale Price in{" "}
            <span className="text-cyan-400 font-black underline decoration-cyan-400/40">10 Seconds</span>
          </h3>

          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            AI-powered algorithm gives you the highest valuation in India. Zero deduction at doorstep with free 30-minute pickup.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs sm:text-sm font-medium text-slate-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Instant UPI / Cash Payment</span>
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-cyan-400 shrink-0" />
              <span>100% Data Wipe Guarantee</span>
            </span>
            <span className="flex items-center gap-2">
              <Truck className="size-4 text-amber-400 shrink-0" />
              <span>Free Doorstep Pickup</span>
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Dropdowns Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleCalculate} className="rounded-2xl bg-white/10 backdrop-blur-md p-5 sm:p-6 border border-white/15 shadow-xl">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  1. Select Brand
                </label>
                <select
                  value={selectedBrandSlug}
                  onChange={(e) => {
                    setSelectedBrandSlug(e.target.value);
                    setSelectedModelSlug("");
                  }}
                  className="w-full rounded-xl bg-slate-900/90 border border-white/20 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors cursor-pointer"
                  required
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">
                    -- Choose Phone Brand --
                  </option>
                  {brands.slice(0, 15).map((b) => (
                    <option key={b.id} value={b.slug} className="bg-slate-900 text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  2. Select Model
                </label>
                <select
                  value={selectedModelSlug}
                  onChange={(e) => setSelectedModelSlug(e.target.value)}
                  disabled={!selectedBrandSlug}
                  className="w-full rounded-xl bg-slate-900/90 border border-white/20 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    {selectedBrandSlug ? "-- Choose Exact Model --" : "First select a brand above"}
                  </option>
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.slug} className="bg-slate-900 text-white">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedBrandSlug}
                className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-5 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.01] hover:shadow-emerald-500/40 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <span>Get Exact Price Quote</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
