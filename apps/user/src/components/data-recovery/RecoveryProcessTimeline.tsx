"use client";

import { RECOVERY_STEPS } from "./recovery-data";
import { ArrowRight } from "lucide-react";
import { RecoveryButton } from "./RecoveryButton";

export function RecoveryProcessTimeline() {
  return (
    <section id="process" className="scroll-mt-16 bg-white py-16 text-slate-900 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Chain of Custody
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Four Steps from Intake to Safe Delivery
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
            Documented handling at every stage. Review verified file lists before committing to any recovery fee.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RECOVERY_STEPS.map((step, idx) => (
            <div
              key={step.step}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm transition-all hover:border-emerald-500/40 hover:bg-white"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-extrabold text-emerald-700">
                    {step.step}
                  </span>
                  {idx < RECOVERY_STEPS.length - 1 && (
                    <ArrowRight className="hidden size-4 text-slate-400 lg:block" />
                  )}
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <RecoveryButton href="#book" variant="primary">
            Start Step 1: Book Free Diagnosis →
          </RecoveryButton>
        </div>
      </div>
    </section>
  );
}
