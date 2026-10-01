import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { CalendarCheck, MapPin, PackageSearch, Wrench } from "lucide-react";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { RepairLiveView } from "@/src/components/next/RepairLiveView";
import { StatusTimeline } from "@/src/components/next/StatusTimeline";
import { getActiveSession } from "@looplic/db/repair-stream";
import { db } from "@/src/lib/db";
import { serviceLabelFor, trackBooking } from "@/src/lib/data/booking-tracking";
import { buildPageMetadata } from "@/src/lib/metadata";
import { enforceRateLimit } from "@/src/lib/rate-limit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Track Your Repair Order",
  description:
    "Follow your Looplic repair from pickup to delivery. Enter your booking ID and phone number to see the live status.",
  pathname: "/track",
  noIndex: true,
});

type PageProps = {
  params: Promise<{ code?: string[] }>;
  searchParams: Promise<{ code?: string; phone?: string }>;
};

/**
 * Repair order tracking.
 *
 * One route handles both /track and /track/<code> (an optional catch-all), so a
 * booking code can be shared as a link that pre-fills the form while still
 * requiring the phone number. The code is not treated as a bearer token: codes
 * follow a predictable shape, so a code-only URL would be guessable in bulk.
 */
export default async function TrackPage({ params, searchParams }: PageProps) {
  const { code: pathSegments } = await params;
  const { code: queryCode = "", phone = "" } = await searchParams;

  // A code in the path pre-fills the form; the query value wins if both exist.
  const pathCode = Array.isArray(pathSegments) ? (pathSegments[0] ?? "") : "";
  const code = (queryCode || pathCode).trim();
  const attempted = Boolean(code && phone.trim());

  // Code + phone is brute-forceable without a cap, so limit attempts per IP.
  const requestHeaders = await headers();
  const rateLimit = attempted
    ? await enforceRateLimit({ headers: requestHeaders } as unknown as Request, "repair-track", 20, 600)
    : { allowed: true };

  const booking = attempted && rateLimit.allowed ? await trackBooking(code, phone) : null;
  const rateLimited = attempted && !rateLimit.allowed;
  const liveSession = booking ? await getActiveSession(db as never, booking.bookingId).catch(() => null) : null;
  const isLiveCctv = liveSession?.provider === "hls";

  const inputClassName =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-medium text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />

      <main className="container mx-auto max-w-xl px-4 py-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-50">
            <PackageSearch className="size-6 text-brand-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-[#111827]">Track your repair</h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Enter your booking ID and the phone number you booked with.
          </p>
        </div>

        <form method="GET" action="/track" className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Booking ID *
              </span>
              <input
                required
                name="code"
                defaultValue={code}
                placeholder="MOB-123456-ABCD"
                autoComplete="off"
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Phone *</span>
              <input
                required
                name="phone"
                type="tel"
                defaultValue={phone}
                placeholder="98765 43210"
                autoComplete="tel"
                className={inputClassName}
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-6 py-3 text-[14px] font-bold text-white transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            Track Order
          </button>
        </form>

        {rateLimited ? (
          <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center text-[13px] font-semibold text-amber-700">
            Too many attempts. Please wait a few minutes and try again, or{" "}
            <Link href="/contact-us" className="underline">
              contact support
            </Link>
            .
          </p>
        ) : attempted && !booking ? (
          // Deliberately one message for every failure: unknown code, wrong phone
          // and malformed input read identically, so this page cannot be used to
          // confirm which booking codes exist.
          <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center text-[13px] font-semibold text-amber-700">
            No booking found for that ID and phone combination. Double-check both, or{" "}
            <Link href="/contact-us" className="underline">
              contact support
            </Link>
            .
          </p>
        ) : null}

        {isLiveCctv ? (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-3xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-red-600" />
              </span>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                  🔴 Live CCTV Stream Active
                </div>
                <div className="text-xs sm:text-sm font-bold text-gray-900">
                  Your phone is currently on the workbench being repaired.
                </div>
              </div>
            </div>
            <a
              href="#live-repair-view"
              className="shrink-0 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition-colors"
            >
              Watch Live ↓
            </a>
          </div>
        ) : null}

        {booking ? (
          <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="mb-4 rounded-2xl bg-gray-50 p-4">
              <div className="text-[12px] font-bold tracking-widest text-brand-600">{booking.bookingCode}</div>
              <div className="mt-1 text-[14px] font-bold text-gray-900">
                {booking.deviceLabel ?? serviceLabelFor(booking.serviceType)}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500">
                {booking.repairLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <Wrench className="size-3.5" aria-hidden="true" /> {booking.repairLabel}
                  </span>
                ) : null}
                {booking.scheduledDate || booking.timeSlot ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarCheck className="size-3.5" aria-hidden="true" />{" "}
                    {[booking.scheduledDate, booking.timeSlot].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
                {booking.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden="true" /> {booking.location}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 text-[11px] text-gray-400">
                {booking.customerNameMasked} · {booking.phoneMasked}
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <p className="text-[13px] font-bold text-brand-700">{booking.statusLabel}</p>
              <p className="mt-0.5 text-[12px] text-brand-700/80">{booking.statusDescription}</p>
              {booking.nextStatusLabel ? (
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-brand-600/70">
                  Next: {booking.nextStatusLabel}
                </p>
              ) : null}
            </div>

            <h2 className="mb-3 text-[13px] font-bold text-gray-900">Order status</h2>
            <StatusTimeline status={booking.status} events={booking.history} />
          </div>
        ) : null}

        {/* Live view of the repair. Renders nothing unless a session is open, so
            an order that is not being worked on shows no empty placeholder. */}
        {booking ? <RepairLiveView bookingId={booking.bookingId} phone={phone} /> : null}

        <p className="mt-6 text-center text-[12px] text-gray-400">
          Selling a device instead?{" "}
          <Link href="/sell/track" className="font-semibold text-brand-600 underline-offset-4 hover:underline">
            Track a buyback order
          </Link>
        </p>
      </main>

      <HomepageFooter />
    </div>
  );
}
