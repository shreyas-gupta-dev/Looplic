import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, MessageCircle, PhoneCall } from "lucide-react";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { ThankYouTracker } from "@/src/components/next/ThankYouTracker";
import { BookingPlacedSuccessView } from "@/src/components/next/BookingPlacedSuccessView";
import { getBookingSummaryByCode, serviceLabelFor } from "@/src/lib/data/booking-tracking";
import { buildPageMetadata } from "@/src/lib/metadata";
import { whatsappPhone, supportPhoneDisplay } from "@/src/lib/company";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Booking Confirmed | Looplic",
  description: "Thank you for choosing Looplic. Your service booking has been confirmed.",
  pathname: "/thank-you",
  noIndex: true,
});

type ThankYouPageProps = {
  searchParams?: Promise<{
    type?: string;
    booking_code?: string;
    service_type?: string;
    service_label?: string;
    device?: string;
    scheduled_date?: string;
    time_slot?: string;
    phone?: string;
    name?: string;
    price?: string;
    address?: string;
    source?: string;
  }>;
};

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const type = resolved?.type || "lead";
  const bookingCode = (resolved?.booking_code || "").trim();
  const isBooking = type === "booking" || Boolean(bookingCode);

  // If a booking code is provided, fetch the verified record from the DB
  const dbBooking = bookingCode ? await getBookingSummaryByCode(bookingCode).catch(() => null) : null;

  // Merge database values with query parameters
  const resolvedDevice = dbBooking?.deviceLabel || resolved?.device || "Device Service";
  const resolvedServiceType = dbBooking?.serviceType || resolved?.service_type || "mobile_repair";
  const resolvedServiceLabel =
    dbBooking?.repairLabel ||
    resolved?.service_label ||
    serviceLabelFor(resolvedServiceType);
  const resolvedDate = dbBooking?.scheduledDate || resolved?.scheduled_date || undefined;
  const resolvedTimeSlot = dbBooking?.timeSlot || resolved?.time_slot || undefined;
  const resolvedName = dbBooking?.customerNameMasked || resolved?.name || "Customer";
  const resolvedPhone = resolved?.phone || dbBooking?.phoneMasked || undefined;
  const resolvedAddress = dbBooking?.location || resolved?.address || undefined;
  const resolvedPrice = resolved?.price || undefined;
  const resolvedStatus = dbBooking?.status || "pending";
  const resolvedCreatedAt = dbBooking?.createdAt || undefined;
  const resolvedHistory = dbBooking?.history || undefined;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <CatalogNavbar />

      <Suspense fallback={null}>
        <ThankYouTracker />
      </Suspense>

      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        {isBooking ? (
          <BookingPlacedSuccessView
            bookingCode={bookingCode || "LOOPLIC-PENDING"}
            phone={resolvedPhone}
            customerName={resolvedName}
            deviceLabel={resolvedDevice}
            serviceLabel={resolvedServiceLabel}
            serviceType={resolvedServiceType}
            scheduledDate={resolvedDate}
            timeSlot={resolvedTimeSlot}
            address={resolvedAddress}
            price={resolvedPrice}
            status={resolvedStatus}
            createdAt={resolvedCreatedAt}
            history={resolvedHistory}
          />
        ) : (
          <section className="mx-auto max-w-md rounded-[32px] border border-gray-200 bg-white p-7 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-brand-100">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="mt-5 text-2xl font-black tracking-tight text-gray-900">
              Thanks, we received your enquiry!
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">
              A member of the Looplic customer care team will review your enquiry and contact you within 30 minutes.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={`https://wa.me/91${whatsappPhone}?text=${encodeURIComponent("Hi Looplic! I just submitted an inquiry on your website.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
              <a
                href={`tel:${whatsappPhone}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-100"
              >
                <PhoneCall className="size-4" />
                Call Us
              </a>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <Link href="/" className="text-xs font-bold text-brand-600 hover:underline">
                ← Return to Homepage
              </Link>
            </div>
          </section>
        )}
      </main>

      <HomepageFooter />
    </div>
  );
}
