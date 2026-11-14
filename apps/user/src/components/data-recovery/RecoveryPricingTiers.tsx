"use client";

import { Check, Clock, ArrowRight } from "lucide-react";
import { PRICING_TIERS } from "./recovery-data";

type RecoveryPricingTiersProps = {
  onSelectPriority: (priority: "standard" | "priority" | "emergency") => void;
};

export function RecoveryPricingTiers({ onSelectPriority }: RecoveryPricingTiersProps) {
  const handleSelect = (priorityId: string) => {
    onSelectPriority(priorityId as "standard" | "priority" | "emergency");
    const bookSection = document.getElementById("book");
    if (bookSection) {
      bookSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="pricing" className="scroll-mt-16 bg-white py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Speed & Turnaround Tiers
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Choose How Fast You Need Your Data Back
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Every case starts with a comprehensive diagnostic evaluation and a fixed quote. You decide the turnaround speed that fits your schedule.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between rounded-3xl p-7 transition-all duration-200 sm:p-8 ${
                tier.popular
                  ? "border-2 border-emerald-500 bg-white shadow-xl shadow-emerald-500/10"
                  : "border border-slate-200 bg-slate-50/70 hover:border-slate-300"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-extrabold text-white shadow-sm">
                  Most Requested
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Clock className="size-3.5" />
                    <span>{tier.turnaround}</span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-600">{tier.idealFor}</p>

                <div className="mt-6 border-t border-slate-200/60 pt-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Included in this tier:
                  </span>
                  <ul className="mt-3 space-y-2.5 text-xs text-slate-700">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => handleSelect(tier.id)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all sm:text-sm ${
                    tier.popular
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                      : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <span>Select {tier.name} Queue</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
