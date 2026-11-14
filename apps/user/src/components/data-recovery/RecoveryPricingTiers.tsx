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
    <section id="pricing" className="scroll-mt-16 bg-white py-16 text-slate-900 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto max-w-3xl lg:max-w-4xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Turnaround Options
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Choose Your Queue Speed
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
            Every case begins with an evaluation and fixed-price quote. Select the queue priority that matches your urgency.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col justify-between rounded-2xl p-7 transition-all sm:p-8 ${
                tier.popular
                  ? "border-2 border-emerald-600 bg-white shadow-xl shadow-emerald-500/10"
                  : "border border-slate-200 bg-slate-50/70 hover:border-slate-300"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                  Most Requested
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-slate-900">{tier.name}</h3>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Clock className="size-3.5" />
                    <span>{tier.turnaround}</span>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">{tier.idealFor}</p>

                <div className="mt-6 border-t border-slate-200/80 pt-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Included in this tier:
                  </span>
                  <ul className="mt-3 space-y-2.5 text-xs text-slate-700">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
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
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all sm:text-sm ${
                    tier.popular
                      ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                      : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
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
