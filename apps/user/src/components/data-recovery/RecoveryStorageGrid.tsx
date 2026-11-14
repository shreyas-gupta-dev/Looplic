"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { STORAGE_CATEGORIES, StorageCategory } from "./recovery-data";

type RecoveryStorageGridProps = {
  onSelectCategory: (categoryId: string) => void;
};

export function RecoveryStorageGrid({ onSelectCategory }: RecoveryStorageGridProps) {
  const handleSelect = (categoryId: string) => {
    onSelectCategory(categoryId);
    const formSection = document.getElementById("book");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="services" className="scroll-mt-16 bg-slate-50 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Storage Types & Supported Media
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Every Storage Device. Every Kind of Failure.
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            From single external drives to high-density multi-drive RAID servers and encrypted Apple Silicon logic boards, our lab handles complex recoveries daily.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STORAGE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg"
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                      <Icon className="size-6" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                      {cat.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {cat.description}
                  </p>

                  {/* Common Failure Signs */}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Common Failure Symptoms:
                    </div>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                      {cat.commonIssues.map((issue) => (
                        <li key={issue} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Supported Brands */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-medium text-slate-400">
                      Supported: <span className="text-slate-600">{cat.supportedBrands.slice(0, 4).join(" · ")}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelect(cat.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-800 transition-all hover:bg-emerald-600 hover:border-emerald-600 hover:text-white"
                  >
                    <span>Request Diagnosis</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
