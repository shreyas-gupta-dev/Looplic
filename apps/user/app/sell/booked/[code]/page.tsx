import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BadgeIndianRupee, CalendarCheck, CheckCircle, PhoneCall, Truck } from "lucide-react";

import { BuybackStatusTimeline } from "@/src/components/next/BuybackStatusTimeline";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { getBuybackBookingByCode } from "@/src/lib/data/buyback-bookings";
import { deviceDisplayName } from "@/src/lib/sell";
import { enforceRateLimit } from "@/src/lib/rate-limit";

// Personal(ish) page — never ISR-cache one visitor's booking for another.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buyback Booking Confirmed | Looplic",
  robots: { index: false, follow: false },
};

const nextSteps = [
  { icon: PhoneCall, text: "Our executive calls you to confirm the pickup time." },
  { icon: Truck, text: "We arrive at your doorstep and verify the device condition." },
  { icon: BadgeIndianRupee, text: "You get paid instantly via UPI or bank transfer." },
];

export default async function BuybackBookedPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  if (!/^LBB-[A-Z0-9]{6}$/.test(normalized)) notFound();

  // This page is reachable by code alone (no phone check) so a scripted
  // visitor could otherwise enumerate LBB-XXXXXX codes — cap lookups per IP.
  const hdrs = await headers();
  const rateLimit = await enforceRateLimit({ headers: hdrs } as unknown as Request, "sell-booked-lookup", 30, 600);
  const booking = rateLimit.allowed ? await getBuybackBookingByCode(normalized) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />

      <main className="container mx-auto max-w-xl px-4 py-10">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-6 py-7 text-center text-white">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white/15">
              <CheckCircle className="size-6 text-white" />
            </div>
            <h1 className="text-[20px] font-semibold">Booking confirmed!</h1>
            <p className="mt-1 text-[13px] font-bold tracking-widest text-white/80">{normalized}</p>
          </div>

          <div className="space-y-5 p-6">
            {booking ? (
              <>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="text-[14px] font-bold text-gray-900">
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
                    <span>Contact: {booking.phoneMasked}</span>
                  </div>
                </div>

                <div>
                  <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-gray-400">Status</h2>
                  <BuybackStatusTimeline status={booking.status} />
                </div>
              </>
            ) : (
              <p className="rounded-2xl bg-gray-50 p-4 text-[13px] leading-relaxed text-gray-600">
                Your booking <b>{normalized}</b> is recorded — our team has the details and will call you shortly.
              </p>
            )}

            <div>
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-gray-400">What happens next</h2>
              <ul className="space-y-2.5">
                {nextSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.text} className="flex items-center gap-3 text-[13px] text-gray-700">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                        <Icon className="size-4 text-violet-500" />
                      </span>
                      {step.text}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 border-t border-gray-100 pt-4 text-[12px] font-semibold">
              <Link href="/sell/track" className="text-violet-600 hover:underline">Track this order</Link>
              <Link href="/sell" className="text-gray-500 hover:text-gray-700">Sell another device</Link>
              <Link href="/contact-us" className="text-gray-500 hover:text-gray-700">Need help?</Link>
            </div>
          </div>
        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
