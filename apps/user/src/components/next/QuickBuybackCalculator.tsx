"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Smartphone, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1838] via-[#102a5c] to-[#0a1931] p-6 sm:p-8 text-white shadow-2xl border border-white/10">
      {/* Decorative gradient glow */}
      <div className="absolute -right-20 -top-20 size-60 rounded-full bg-brandcyan-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 size-60 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Heading and value propositions */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-brandcyan-500/10 border border-brandcyan-500/30 px-3 py-1 text-xs font-semibold text-brandcyan-300 mb-3">
            <Sparkles className="size-3.5 text-brandcyan-400" />
            <span>Instant Mobile Buyback Value</span>
          </div>

          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
            Check Your Phone&apos;s Exact Resale Price in <span className="text-cyan-400 font-extrabold underline decoration-cyan-400/40">10 Seconds</span>
          </h3>

          <p className="mt-2 text-sm text-gray-300 max-w-xl">
            AI-powered algorithm gives you the highest valuation in India. Zero deduction at doorstep with free 30-minute pickup.
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Instant UPI / Cash Payment</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-brandcyan-400" />
              <span>100% Data Wipe Guarantee</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="size-4 text-amber-400" />
              <span>Free Doorstep Pickup</span>
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Dropdowns Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleCalculate} className="rounded-xl bg-white/10 backdrop-blur-md p-4 sm:p-5 border border-white/15 shadow-inner">
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  1. Select Brand
                </label>
                <select
                  value={selectedBrandSlug}
                  onChange={(e) => {
                    setSelectedBrandSlug(e.target.value);
                    setSelectedModelSlug("");
                  }}
                  className="w-full rounded-lg bg-gray-900/80 border border-white/20 px-3.5 py-2.5 text-sm text-white focus:border-brandcyan-400 focus:outline-none focus:ring-1 focus:ring-brandcyan-400"
                  required
                >
                  <option value="" disabled className="bg-gray-900 text-gray-400">
                    -- Choose Phone Brand --
                  </option>
                  {brands.slice(0, 15).map((b) => (
                    <option key={b.id} value={b.slug} className="bg-gray-900 text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  2. Select Model
                </label>
                <select
                  value={selectedModelSlug}
                  onChange={(e) => setSelectedModelSlug(e.target.value)}
                  disabled={!selectedBrandSlug}
                  className="w-full rounded-lg bg-gray-900/80 border border-white/20 px-3.5 py-2.5 text-sm text-white focus:border-brandcyan-400 focus:outline-none focus:ring-1 focus:ring-brandcyan-400 disabled:opacity-50"
                >
                  <option value="" className="bg-gray-900 text-gray-400">
                    {selectedBrandSlug ? "-- Choose Exact Model --" : "First select a brand above"}
                  </option>
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.slug} className="bg-gray-900 text-white">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedBrandSlug}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:pointer-events-none"
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
