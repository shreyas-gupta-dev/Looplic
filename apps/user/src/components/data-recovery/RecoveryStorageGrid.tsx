"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { STORAGE_CATEGORIES } from "./recovery-data";
import { RecoveryButton } from "./RecoveryButton";
import { RECOVERY_TOKENS } from "./recovery-tokens";

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
    <section id="services" className={`scroll-mt-16 bg-white ${RECOVERY_TOKENS.layout.sectionPadding} border-b border-slate-200`}>
      <div className={RECOVERY_TOKENS.layout.container}>
        {/* Section Header */}
        <div className="max-w-3xl lg:max-w-4xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Storage Formats & Media
          </span>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl lg:text-[40px] font-bold tracking-tight text-slate-900 leading-[1.2]">
            Supported Devices & Failure Scenarios
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
            Our cleanroom engineers handle hardware and logical failures across mechanical drives, NVMe solid-state media, MacBooks, and enterprise RAID arrays.
          </p>
        </div>

        {/* 6-Card 12-Column Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STORAGE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:border-emerald-600 hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                      {cat.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                    {cat.description}
                  </p>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-900 mb-2">
                      Common Failure Symptoms:
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {cat.commonIssues.map((issue) => (
                        <li key={issue} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    {cat.supportedBrands.slice(0, 3).join(", ")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                    Select device <ArrowRight className="size-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Exactly ONE primary button for this section */}
        <div className="mt-12 flex justify-center">
          <RecoveryButton href="#book">
            Start Free Diagnosis for Your Storage Device
          </RecoveryButton>
        </div>
      </div>
    </section>
  );
}
