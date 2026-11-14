"use client";

import { useState } from "react";
import {
  ShieldCheck,
  FileCheck2,
  Truck,
  ArrowRight,
  MessageSquare,
  Phone,
  Search,
  Lock,
  Layers,
} from "lucide-react";
import { LAB_CONTACT } from "./recovery-data";

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
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-[#0c1838] to-slate-900 py-16 text-white md:py-24">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -right-40 top-20 size-96 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md">
            <span className="flex size-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Dedicated Data Recovery Lab · Bengaluru</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.15]">
            Lost Critical Data? <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              We Bring It Back Safely.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm leading-relaxed text-slate-300 sm:text-base md:text-lg">
            Professional cleanroom data recovery for Hard Drives, SSDs, MacBooks, and RAID servers.
            Comprehensive diagnostics, strict NDA confidentiality, and zero data exposure.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            <a
              href="#book"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:scale-[1.02]"
            >
              <span>Book Free Diagnosis</span>
              <ArrowRight className="size-4" />
            </a>

            <a
              href={`https://wa.me/${LAB_CONTACT.whatsapp}?text=${encodeURIComponent("Hi Looplic Data Recovery, I need an urgent consultation for my storage device.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-950/40 px-6 py-3.5 text-sm font-bold text-emerald-300 backdrop-blur-sm transition-all hover:bg-emerald-900/60 hover:border-emerald-400"
            >
              <MessageSquare className="size-4" />
              <span>WhatsApp an Engineer</span>
            </a>

            <a
              href={`tel:${LAB_CONTACT.phone}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-5 py-3.5 text-sm font-bold text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
            >
              <Phone className="size-4 text-emerald-400" />
              <span>Call Lab</span>
            </a>
          </div>

          {/* ─── Quick Track Box ─────────────────────────────────────────────── */}
          <div className="mx-auto mt-10 max-w-lg">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-2 shadow-2xl backdrop-blur-md">
              <form onSubmit={handleQuickTrack} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={quickCode}
                    onChange={(e) => setQuickCode(e.target.value)}
                    placeholder="Have a case? Enter REC-XXXXXX"
                    className="w-full rounded-xl border-0 bg-slate-800/90 py-2.5 pl-10 pr-3 text-xs font-medium text-white placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-emerald-400 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-500 sm:text-sm"
                >
                  Track Case
                </button>
              </form>
            </div>
          </div>

          {/* ─── Trust Pillars Bar ───────────────────────────────────────────── */}
          <div className="mt-12 grid grid-cols-2 gap-3 pt-6 border-t border-slate-800/80 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-left">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-500/20 text-emerald-400">
                <Lock className="size-4" />
              </div>
              <div className="text-[11px] leading-tight">
                <strong className="block text-white">Strict NDA & Privacy</strong>
                <span className="text-slate-400">Isolated offline labs</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-left">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-500/20 text-emerald-400">
                <FileCheck2 className="size-4" />
              </div>
              <div className="text-[11px] leading-tight">
                <strong className="block text-white">See Files First</strong>
                <span className="text-slate-400">Verify file list pre-pay</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-left">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-500/20 text-emerald-400">
                <Layers className="size-4" />
              </div>
              <div className="text-[11px] leading-tight">
                <strong className="block text-white">Cleanroom Stations</strong>
                <span className="text-slate-400">Laminar flow benches</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-left">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-500/20 text-emerald-400">
                <Truck className="size-4" />
              </div>
              <div className="text-[11px] leading-tight">
                <strong className="block text-white">Doorstep Pickup</strong>
                <span className="text-slate-400">Free across Bengaluru</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
