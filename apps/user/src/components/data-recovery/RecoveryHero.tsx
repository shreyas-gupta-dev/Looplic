"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Truck,
  Lock,
  Layers,
  ChevronRight,
  ArrowLeft,
  Search,
  MessageSquare,
} from "lucide-react";
import { LAB_CONTACT } from "./recovery-data";
import { RecoveryButton } from "./RecoveryButton";
import { RECOVERY_TOKENS } from "./recovery-tokens";

type RecoveryHeroProps = {
  onTrackLookup?: (code: string) => void;
};

export function RecoveryHero({ onTrackLookup }: RecoveryHeroProps) {
  const [quickCode, setQuickCode] = useState("");

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const code = quickCode.trim().toUpperCase();
    if (!code) return;

    if (onTrackLookup) {
      onTrackLookup(code);
    }
    const trackSection = document.getElementById("track");
    if (trackSection) {
      trackSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative bg-slate-900 text-white overflow-hidden border-b border-slate-800">
      {/* Subtle calm ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(5,150,105,0.15),transparent)]" />

      <div className={`${RECOVERY_TOKENS.layout.wideContainer} relative py-16 sm:py-24 lg:py-28`}>
        <div className="mx-auto max-w-4xl lg:max-w-5xl text-center">
          {/* Breadcrumb Trail with Back to Home Action */}
          <nav aria-label="Breadcrumb" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-300">
            <Link
              href="/"
              onClick={(e) => {
                if (
                  typeof window !== "undefined" &&
                  window.history.length > 1 &&
                  document.referrer &&
                  document.referrer.includes(window.location.host)
                ) {
                  e.preventDefault();
                  window.history.back();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/90 px-3 py-1 text-slate-300 transition-colors hover:border-emerald-500/60 hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft className="size-3 text-emerald-400" />
              <span>Back to Home</span>
            </Link>
            <ChevronRight className="size-3 text-slate-500" />
            <span className="text-emerald-400 font-semibold" aria-current="page">
              Hard Drive Data Recovery
            </span>
          </nav>

          {/* Eyebrow badge */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Dedicated Recovery Lab · Bengaluru
            </span>
          </div>

          {/* Single H1 Primary Heading */}
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl xl:text-[62px] font-bold tracking-tight text-white leading-[1.12]">
            Hard Drive Data Recovery in Bangalore
          </h1>

          {/* Concise, calming subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
            Cleanroom recovery for clicking hard drives, failed SSDs, dead MacBooks, and RAID servers. Free diagnostic evaluation, file list verification before payment, and secure doorstep pickup.
          </p>

          {/* Exactly ONE primary button per section + calm inline text link */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <RecoveryButton href="#book" className="min-w-[240px] text-sm sm:text-base py-3 px-7 sm:py-3.5 sm:px-8">
              Request Free Lab Diagnosis
            </RecoveryButton>

            <a
              href={`https://wa.me/${LAB_CONTACT.whatsapp}?text=${encodeURIComponent("Hi Looplic Data Recovery, I need an urgent consultation for my storage device.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <MessageSquare className="size-4 text-emerald-400" />
              <span>Need immediate advice? Chat with an engineer on WhatsApp</span>
            </a>
          </div>

          {/* Quick Case Tracking Input */}
          <div className="mt-10 sm:mt-12 mx-auto max-w-md sm:max-w-lg">
            <form onSubmit={handleQuickTrack} className="flex items-center rounded-xl border border-slate-700 bg-slate-800/80 p-1.5 shadow-lg">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value)}
                  placeholder="Enter Case ID (e.g. REC-123456)"
                  className="w-full bg-transparent py-2 pl-10 pr-3 text-sm text-white placeholder-slate-400 outline-none"
                  aria-label="Track existing case code"
                />
              </div>
              <button
                type="submit"
                className="h-9 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white transition-colors"
              >
                Track Case
              </button>
            </form>
          </div>
        </div>

        {/* 4 Trust Pillars (Full-Width Responsive 4-Column Grid) */}
        <div className="mt-16 pt-8 border-t border-slate-800/80 mx-auto max-w-6xl lg:max-w-7xl">
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 text-left">
            <div className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-800/30 p-3 sm:p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
                <Lock className="size-4" />
              </div>
              <div className="min-w-0">
                <strong className="block text-xs sm:text-sm font-semibold text-white truncate">Strict NDA & Privacy</strong>
                <span className="text-[11px] sm:text-xs text-slate-300">Offline diagnostic labs</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-800/30 p-3 sm:p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
                <FileCheck2 className="size-4" />
              </div>
              <div className="min-w-0">
                <strong className="block text-xs sm:text-sm font-semibold text-white truncate">Review File List</strong>
                <span className="text-[11px] sm:text-xs text-slate-300">Verify data before paying</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-800/30 p-3 sm:p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
                <Layers className="size-4" />
              </div>
              <div className="min-w-0">
                <strong className="block text-xs sm:text-sm font-semibold text-white truncate">Clean Workstations</strong>
                <span className="text-[11px] sm:text-xs text-slate-300">Laminar flow benches</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-800/30 p-3 sm:p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
                <Truck className="size-4" />
              </div>
              <div className="min-w-0">
                <strong className="block text-xs sm:text-sm font-semibold text-white truncate">Doorstep Pickup</strong>
                <span className="text-[11px] sm:text-xs text-slate-300">Free across Bengaluru</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
