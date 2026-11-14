"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { COMMON_FAQS } from "./recovery-data";

export function RecoveryFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="scroll-mt-16 bg-white py-16 md:py-24">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Frequently Asked Questions
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Clear Answers Before You Book
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Everything you need to know about pricing, physical head crashes, cleanroom procedures, and turnaround times.
          </p>
        </div>

        <div className="mt-12 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm sm:p-6">
          {COMMON_FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={faq.q} className="py-4 first:pt-2 last:pb-2">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between text-left text-sm font-bold text-slate-900 transition-colors hover:text-emerald-700 sm:text-base"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4">{faq.q}</span>
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-emerald-100 text-emerald-700" : ""
                    }`}
                  >
                    <ChevronDown className="size-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 pr-8 text-xs leading-relaxed text-slate-600 sm:text-sm animate-in fade-in duration-200">
                    <p>{faq.a}</p>
                    <span className="mt-2 inline-block rounded-md bg-slate-200/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      Category: {faq.category}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
