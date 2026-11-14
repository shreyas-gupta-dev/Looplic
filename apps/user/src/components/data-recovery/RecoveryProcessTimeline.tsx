"use client";

import { RECOVERY_STEPS } from "./recovery-data";
import { ArrowRight } from "lucide-react";

export function RecoveryProcessTimeline() {
  return (
    <section id="process" className="scroll-mt-16 bg-[#0c1838] py-16 text-white md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Step-by-Step Transparency
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Four Clear Steps Between You and Your Data
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            No guessing games or mysterious charges. Every case follows a documented chain-of-custody path from arrival to verified delivery.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RECOVERY_STEPS.map((step, idx) => (
            <div
              key={step.step}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/50 hover:bg-slate-800/90"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-extrabold text-emerald-400">
                    {step.step}
                  </span>
                  {idx < RECOVERY_STEPS.length - 1 && (
                    <ArrowRight className="hidden size-5 text-slate-600 lg:block" />
                  )}
                </div>
                <h3 className="mt-4 text-base font-bold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#book"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-emerald-400"
          >
            <span>Start Step 1: Request Free Diagnosis</span>
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
