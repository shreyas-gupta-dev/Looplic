"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck, Truck } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 p-6 sm:p-8 text-gray-900 shadow-sm">
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Heading and value propositions */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-3 py-1 text-xs font-semibold text-blue-700 mb-3">
            <span>Device Resale Valuation</span>
          </div>

          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
            Check Your Phone&apos;s Estimated Resale Value
          </h3>

          <p className="mt-2 text-sm text-gray-600 max-w-xl leading-relaxed">
            Get an estimated resale value based on your device model, storage, condition and other relevant factors. Final offer determined after doorstep inspection.
          </p>

          <div className="mt-5 flex flex-wrap gap-4 text-xs font-medium text-gray-700">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Payment via UPI/bank after acceptance</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-blue-600 shrink-0" />
              <span>Secure data erasure process</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="size-4 text-gray-600 shrink-0" />
              <span>Free doorstep pickup in Bengaluru</span>
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Dropdowns Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleCalculate} className="rounded-xl bg-white p-5 border border-gray-200 shadow-sm">
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  1. Select Brand
                </label>
                <select
                  value={selectedBrandSlug}
                  onChange={(e) => {
                    setSelectedBrandSlug(e.target.value);
                    setSelectedModelSlug("");
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  required
                >
                  <option value="" disabled className="text-gray-400">
                    -- Choose Phone Brand --
                  </option>
                  {brands.slice(0, 15).map((b) => (
                    <option key={b.id} value={b.slug} className="text-gray-900">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  2. Select Model
                </label>
                <select
                  value={selectedModelSlug}
                  onChange={(e) => setSelectedModelSlug(e.target.value)}
                  disabled={!selectedBrandSlug}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="" className="text-gray-400">
                    {selectedBrandSlug ? "-- Choose Exact Model --" : "First select a brand above"}
                  </option>
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.slug} className="text-gray-900">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedBrandSlug}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>Get Estimated Value</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
