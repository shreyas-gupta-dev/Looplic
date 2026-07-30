import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { CalendarCheck, SearchCheck } from "lucide-react";

import { BuybackStatusTimeline } from "@/src/components/next/BuybackStatusTimeline";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { trackBuybackBooking } from "@/src/lib/data/buyback-bookings";
import { buildPageMetadata } from "@/src/lib/metadata";
import { deviceDisplayName } from "@/src/lib/sell";
import { enforceRateLimit } from "@/src/lib/rate-limit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Track Your Buyback Order",
  description: "Check the live status of your Looplic buyback pickup using your booking ID and phone number.",
  pathname: "/sell/track",
  noIndex: true,
});

type PageProps = {
  searchParams: Promise<{ code?: string; phone?: string }>;
};

export default async function SellTrackPage({ searchParams }: PageProps) {
  const { code = "", phone = "" } = await searchParams;
  const trimmedCode = code.trim().toUpperCase();
  const attempted = Boolean(trimmedCode && phone.trim());

  // A phone+code lookup is guessable in bulk without this — cap attempts per IP.
  const hdrs = await headers();
  const rateLimit = attempted
    ? await enforceRateLimit({ headers: hdrs } as unknown as Request, "sell-track", 20, 600)
    : { allowed: true };
  const booking = attempted && rateLimit.allowed ? await trackBuybackBooking(trimmedCode, phone) : null;
  const rateLimited = attempted && !rateLimit.allowed;

  const inputClassName =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-medium text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-violet-400";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />

      <main className="container mx-auto max-w-xl px-4 py-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-violet-50">
            <SearchCheck className="size-6 text-violet-500" />
          </div>
          <h1 className="text-2xl font-semibold text-[#111827]">Track your buyback order</h1>
          <p className="mt-1 text-[13px] text-gray-500">Enter your booking ID and the phone number you booked with.</p>
        </div>

        <form method="GET" className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Booking ID *</span>
              <input required name="code" defaultValue={code} placeholder="LBB-XXXXXX" className={inputClassName} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Phone *</span>
              <input required name="phone" type="tel" defaultValue={phone} placeholder="98765 43210" className={inputClassName} />
            </label>
          </div>
          <button
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-6 py-3 text-[14px] font-bold text-white transition-all hover:opacity-90"
          >
            Track Order
          </button>
        </form>

        {rateLimited ? (
          <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center text-[13px] font-semibold text-amber-700">
            Too many attempts. Please wait a few minutes and try again, or{" "}
            <Link href="/contact-us" className="underline">contact support</Link>.
          </p>
        ) : attempted && !booking ? (
          <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center text-[13px] font-semibold text-amber-700">
            No booking found for that ID and phone combination. Double-check both, or{" "}
            <Link href="/contact-us" className="underline">contact support</Link>.
          </p>
        ) : null}

        {booking ? (
          <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="mb-4 rounded-2xl bg-gray-50 p-4">
              <div className="text-[12px] font-bold tracking-widest text-violet-600">{booking.bookingCode}</div>
              <div className="mt-1 text-[14px] font-bold text-gray-900">
                {deviceDisplayName(booking.brandName, booking.modelName)}
                {booking.variantLabel ? ` (${booking.variantLabel})` : ""}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500">
                {booking.quotedAmount !== null ? (
                  <span>Quoted: <b className="text-violet-600">₹{booking.quotedAmount.toLocaleString("en-IN")}</b></span>
                ) : null}
                {booking.pickupDate || booking.timeSlot ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarCheck className="size-3.5" /> {[booking.pickupDate, booking.timeSlot].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </div>
            </div>
            <BuybackStatusTimeline status={booking.status} />
          </div>
        ) : null}
      </main>

      <HomepageFooter />
    </div>
  );
}
