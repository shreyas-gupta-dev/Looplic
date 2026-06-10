import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";

import { ThankYouTracker } from "@/src/components/next/ThankYouTracker";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Thank You",
  description: "Thank you for contacting Looplic. We have received your request and will follow up shortly.",
  pathname: "/thank-you",
});

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; booking_code?: string; service_type?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const type = resolvedSearchParams?.type || "lead";
  const bookingCode = resolvedSearchParams?.booking_code;
  const isBooking = type === "booking";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Suspense fallback={null}>
        <ThankYouTracker />
      </Suspense>
      <section className="w-full max-w-md rounded-[28px] border border-border bg-card p-7 text-center shadow-card-brand">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-foreground">
          {isBooking ? "Booking request received" : "Thanks, we received it"}
        </h1>
        {bookingCode ? <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-primary">{bookingCode}</p> : null}
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          {isBooking
            ? "Looplic support will review your booking and contact you shortly to confirm the next step."
            : "Looplic support will get back to you shortly. For urgent help, WhatsApp is usually the fastest path."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href="/" className="flex-1 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground">
            Home
          </Link>
          <Link href="/contact-us" className="flex-1 rounded-2xl border border-border px-5 py-3 text-sm font-black text-foreground">
            Contact
          </Link>
        </div>
      </section>
    </main>
  );
}
