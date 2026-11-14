"use client";

import { TRUST_PILLARS } from "./recovery-data";
import { RecoveryButton } from "./RecoveryButton";

export function RecoveryTrustPillars() {
  return (
    <section id="why-us" className="scroll-mt-16 bg-slate-50 py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto max-w-3xl lg:max-w-4xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Security & Compliance
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Strict Confidentiality & Isolated Hardware Labs
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
            Your drive never leaves our strict chain of custody. Offline recovery stations and mandatory NDAs protect your sensitive records.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-slate-900">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <RecoveryButton href="#book" variant="primary">
            Schedule Free Lab Diagnosis →
          </RecoveryButton>
        </div>
      </div>
    </section>
  );
}
