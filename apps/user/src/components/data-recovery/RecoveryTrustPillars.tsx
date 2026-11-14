"use client";

import { TRUST_PILLARS } from "./recovery-data";

export function RecoveryTrustPillars() {
  return (
    <section id="why-us" className="scroll-mt-16 bg-slate-50 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Trust & Security Standards
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Handled with Care. Guarded by Strict Privacy.
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Data loss is stressful. We remove uncertainty with transparent diagnostic reports, legally binding NDAs, and full file verification before you pay.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
