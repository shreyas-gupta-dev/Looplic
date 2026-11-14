import Link from "next/link";
import { ArrowLeft, HardDrive, RefreshCw, Search, ShoppingBag, Truck } from "lucide-react";
import { supportPhoneDisplay, whatsappUrl } from "@/src/lib/company";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16 text-slate-900">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl sm:p-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          Page Not Found · Error 404
        </span>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Looking for Something?
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          The link you followed may be outdated, moved, or misspelled. Use the shortcuts below to find what you need.
        </p>

        {/* Quick navigation grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <Link
            href="/sell"
            className="group flex items-start gap-2.5 rounded-2xl border border-slate-200 p-3.5 transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <RefreshCw className="size-4" />
            </div>
            <div>
              <strong className="block text-xs font-bold text-slate-900 group-hover:text-emerald-700">Sell Device</strong>
              <span className="text-[11px] text-slate-500">Instant quote & pickup</span>
            </div>
          </Link>

          <Link
            href="/buy"
            className="group flex items-start gap-2.5 rounded-2xl border border-slate-200 p-3.5 transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <ShoppingBag className="size-4" />
            </div>
            <div>
              <strong className="block text-xs font-bold text-slate-900 group-hover:text-teal-700">Buy Refurbished</strong>
              <span className="text-[11px] text-slate-500">Warranty tested phones</span>
            </div>
          </Link>

          <Link
            href="/data-recovery"
            className="group flex items-start gap-2.5 rounded-2xl border border-slate-200 p-3.5 transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <HardDrive className="size-4" />
            </div>
            <div>
              <strong className="block text-xs font-bold text-slate-900 group-hover:text-emerald-700">Data Recovery</strong>
              <span className="text-[11px] text-slate-500">Free cleanroom diagnosis</span>
            </div>
          </Link>

          <Link
            href="/track"
            className="group flex items-start gap-2.5 rounded-2xl border border-slate-200 p-3.5 transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Truck className="size-4" />
            </div>
            <div>
              <strong className="block text-xs font-bold text-slate-900 group-hover:text-slate-900">Track Order</strong>
              <span className="text-[11px] text-slate-500">Real-time case lookup</span>
            </div>
          </Link>
        </div>

        {/* Action button */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Homepage</span>
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <span>WhatsApp Support</span>
          </a>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Need immediate phone assistance? Call us at <strong className="text-slate-700">{supportPhoneDisplay}</strong>
        </p>
      </div>
    </main>
  );
}
