"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  MapPin,
  MessageCircle,
  PackageSearch,
  PhoneCall,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Truck,
  Video,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { whatsappPhone, supportPhoneDisplay } from "@/src/lib/company";
import { downloadBookingConfirmationPdf } from "@/src/lib/invoice-pdf";

export type BookingPlacedSuccessProps = {
  bookingCode: string;
  phone?: string;
  customerName?: string;
  deviceLabel?: string;
  serviceLabel?: string;
  serviceType?: string;
  scheduledDate?: string;
  timeSlot?: string;
  address?: string;
  city?: string;
  pincode?: string;
  price?: number | string;
  status?: string;
  createdAt?: string;
  history?: {
    status: string;
    label: string;
    description: string;
    note: string | null;
    at: string;
  }[];
};

function formatPrice(val?: number | string) {
  if (!val) return null;
  const num = typeof val === "string" ? parseFloat(val.replace(/[^\d.]/g, "")) : val;
  if (isNaN(num) || num <= 0) return null;
  return `₹${num.toLocaleString("en-IN")}`;
}

export function BookingPlacedSuccessView({
  bookingCode,
  phone = "",
  customerName = "Valued Customer",
  deviceLabel = "Your Device",
  serviceLabel = "Device Repair & Service",
  serviceType = "mobile_repair",
  scheduledDate,
  timeSlot,
  address,
  city,
  pincode,
  price,
  createdAt,
}: BookingPlacedSuccessProps) {
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const formattedPrice = formatPrice(price);
  const fullAddress = [address, city, pincode].filter(Boolean).join(", ");
  const appointmentDisplay = [scheduledDate, timeSlot].filter(Boolean).join(" · ");

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(bookingCode);
      setCopied(true);
      toast.success("Booking ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleDownloadPdf = () => {
    try {
      setDownloadingPdf(true);
      downloadBookingConfirmationPdf({
        bookingCode,
        customerName: customerName.replace(/•+/g, "").trim() || "Customer",
        customerPhone: phone || "9876543210",
        serviceType,
        serviceLabel,
        price: price ? String(price) : undefined,
        model: deviceLabel,
        scheduledDate,
        timeSlot,
        address: fullAddress || undefined,
        city,
        pincode,
      });
      toast.success("Booking receipt downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Unable to generate receipt PDF. Please try again.");
    } finally {
      setTimeout(() => setDownloadingPdf(false), 800);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Looplic Support! I just placed a booking with ID: ${bookingCode} for ${deviceLabel} (${serviceLabel}). Could you please share the current status?`
  );
  const whatsappHref = `https://wa.me/91${whatsappPhone}?text=${whatsappMessage}`;

  // Generate Google Calendar Link
  const calendarTitle = encodeURIComponent(`Looplic Service: ${deviceLabel} (${serviceLabel})`);
  const calendarDetails = encodeURIComponent(
    `Booking ID: ${bookingCode}\nService: ${serviceLabel}\nDevice: ${deviceLabel}\nAddress: ${fullAddress || "Doorstep"}\nLooplic Support: ${supportPhoneDisplay}`
  );
  const calendarLocation = encodeURIComponent(fullAddress || "Doorstep Inspection");
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&details=${calendarDetails}&location=${calendarLocation}`;

  // Direct track URL
  const trackHref = phone
    ? `/track?code=${encodeURIComponent(bookingCode)}&phone=${encodeURIComponent(phone)}`
    : `/track/${encodeURIComponent(bookingCode)}`;

  const orderTimeDisplay = createdAt
    ? new Date(createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    : "Just now";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      {/* ─── Hero Header & Celebration ─────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[32px] border border-brand-200/80 bg-gradient-to-b from-white via-brand-50/20 to-white p-6 sm:p-8 text-center shadow-[0_20px_60px_-15px_rgba(5,150,105,0.12)]">
        {/* Glow ambient background elements */}
        <div className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-4 size-60 rounded-full bg-emerald-400/10 blur-2xl" />

        {/* Animated Checkmark Badge */}
        <div className="relative mx-auto mb-4 flex size-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-brand-400/20" />
          <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-lg shadow-brand-500/30">
            <Check className="size-10 stroke-[3]" />
          </div>
        </div>

        {/* Notification Pill */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/90 px-3.5 py-1 text-xs font-bold text-brand-700 shadow-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-600" />
          </span>
          Order Placed Successfully · {orderTimeDisplay}
        </div>

        <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
          Booking Confirmed!
        </h1>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-gray-600 sm:text-base">
          Thank you, <span className="font-semibold text-gray-900">{customerName}</span>. Your service request has been received and routed to our technical dispatch hub.
        </p>

        {/* Booking ID with 1-click Copy */}
        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-gray-200/80 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
            Booking ID
          </span>
          <span className="font-mono text-sm font-black tracking-wider text-brand-700 sm:text-base">
            {bookingCode}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy booking code"
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700 transition hover:bg-brand-50 hover:text-brand-700 focus:outline-none"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-brand-600" />
                <span className="text-brand-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* SMS & WhatsApp notification badge */}
        <p className="mt-3 text-xs text-gray-500">
          A confirmation SMS & WhatsApp message with this reference ID will reach you shortly.
        </p>
      </section>

      {/* ─── Real-Time Journey Stepper ─────────────────────────────── */}
      <section className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-7 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 sm:text-lg">
              Order Lifecycle Progress
            </h2>
            <p className="text-xs text-gray-500">
              Live updates as your repair progresses through each milestone
            </p>
          </div>
          <Link
            href={trackHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
          >
            <PackageSearch className="size-3.5" />
            Live Tracker →
          </Link>
        </div>

        {/* 5-Step Visual Stepper */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-2">
          {/* Step 1 */}
          <div className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white ring-4 ring-brand-100">
              <Check className="size-4 stroke-[3]" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-700">1. Order Placed</p>
              <p className="text-[11px] text-gray-500">Received & logged</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-50 text-brand-700 ring-4 ring-brand-50">
              <Clock className="size-4 animate-spin text-brand-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">2. Confirmation</p>
              <p className="text-[11px] text-brand-600 font-semibold">Verification call</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center opacity-75">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-400">
              <Truck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">3. Doorstep Visit</p>
              <p className="text-[11px] text-gray-400">{timeSlot || "Scheduled slot"}</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center opacity-75">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-400">
              <Wrench className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">4. Lab / Live CCTV</p>
              <p className="text-[11px] text-gray-400">Precision repair</p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center opacity-75">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-400">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">5. Quality Tested</p>
              <p className="text-[11px] text-gray-400">Delivery & Pay</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Two-Column Booking & Price Summary ──────────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Device & Service Details */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-brand-600">
            <Wrench className="size-4" />
            Booking Specifications
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase text-gray-400">Device</span>
              <p className="text-base font-bold text-gray-900">{deviceLabel}</p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-gray-400">Service Required</span>
              <p className="text-sm font-semibold text-gray-800">{serviceLabel}</p>
            </div>

            {appointmentDisplay ? (
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400">Appointment Slot</span>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  <CalendarCheck className="size-4 text-brand-600" />
                  {appointmentDisplay}
                </div>
              </div>
            ) : null}

            {fullAddress ? (
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400">Doorstep Location</span>
                <div className="mt-0.5 flex items-start gap-1.5 text-xs text-gray-700">
                  <MapPin className="size-4 shrink-0 text-gray-400" />
                  <span>{fullAddress}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: Payment & Transparent Billing */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-brand-600">
            <ShieldCheck className="size-4" />
            Payment & Pricing Transparency
          </div>

          <div className="space-y-3 rounded-2xl bg-gray-50/80 p-4">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Doorstep Visit / Inspection</span>
              <span className="font-bold text-emerald-600">FREE (₹0)</span>
            </div>

            {formattedPrice ? (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Estimated Service Quote</span>
                <span className="font-bold text-gray-900">{formattedPrice}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Diagnosis & Quote</span>
                <span className="font-bold text-gray-900">Shared after inspection</span>
              </div>
            )}

            <div className="border-t border-gray-200/80 pt-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Total Payable Amount</p>
                <p className="text-[11px] text-gray-500">Pay only after you test & verify</p>
              </div>
              <span className="text-lg font-black text-brand-700">
                {formattedPrice || "Pay Later"}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-emerald-600 shrink-0" />
              <p className="text-xs font-bold text-emerald-900">
                100% Pay After Service
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-700">
              No advance payment is needed. Test your device thoroughly, and pay easily via UPI, Card, or Cash only when fully satisfied.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Workshop Live CCTV Stream Teaser ─────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-red-200/70 bg-gradient-to-r from-red-50/80 via-white to-orange-50/60 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-500/20">
              <Video className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-600" />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                  Looplic Workshop Live Cam
                </span>
              </div>
              <h3 className="mt-0.5 text-sm sm:text-base font-bold text-gray-900">
                Watch Your Device Being Repaired Live
              </h3>
              <p className="mt-1 text-xs text-gray-600 max-w-lg">
                Once your repair begins on the workbench, you can watch our certified technicians work on your device live in full HD.
              </p>
            </div>
          </div>

          <Link
            href="/live-repair"
            className="shrink-0 rounded-full bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 shadow-sm"
          >
            Explore Workshop Cam →
          </Link>
        </div>
      </section>

      {/* ─── What Happens Next? 4-Step Roadmap ───────────────────────── */}
      <section className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-gray-400">
          What Happens Next?
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
            <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold text-xs">
              1
            </div>
            <p className="text-xs font-bold text-gray-900">Verification Call</p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Our support team calls within 15–30 mins to confirm parts availability and your time slot.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
            <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold text-xs">
              2
            </div>
            <p className="text-xs font-bold text-gray-900">Doorstep Arrival</p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              A background-verified technician arrives in Looplic gear with genuine spare parts.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
            <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold text-xs">
              3
            </div>
            <p className="text-xs font-bold text-gray-900">Live Repair</p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Completed right before your eyes, or in our dust-free lab under high-definition CCTV.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
            <div className="mb-2 flex size-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold text-xs">
              4
            </div>
            <p className="text-xs font-bold text-gray-900">Verify & Pay</p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Test your device thoroughly. Pay only if satisfied and receive your warranty card.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Customer Action Hub ─────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
          Booking Actions & Utilities
        </h2>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Action 1: Track Live */}
          <Link
            href={trackHref}
            className="flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50/50 p-4 font-bold text-brand-800 transition hover:bg-brand-100/60"
          >
            <div className="flex items-center gap-3">
              <PackageSearch className="size-5 text-brand-600" />
              <div className="text-left">
                <div className="text-xs font-bold">Track Live Status</div>
                <div className="text-[11px] font-normal text-brand-700/80">Follow technician & updates</div>
              </div>
            </div>
            <ExternalLink className="size-4 text-brand-600" />
          </Link>

          {/* Action 2: Download PDF Receipt */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 font-bold text-gray-800 transition hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Download className="size-5 text-gray-600" />
              <div className="text-left">
                <div className="text-xs font-bold">
                  {downloadingPdf ? "Generating PDF..." : "Download Receipt"}
                </div>
                <div className="text-[11px] font-normal text-gray-500">Official PDF booking slip</div>
              </div>
            </div>
          </button>

          {/* Action 3: Add to Google Calendar */}
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 font-bold text-gray-800 transition hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-blue-600" />
              <div className="text-left">
                <div className="text-xs font-bold">Add to Calendar</div>
                <div className="text-[11px] font-normal text-gray-500">Set reminder for slot</div>
              </div>
            </div>
            <ExternalLink className="size-4 text-gray-400" />
          </a>

          {/* Action 4: WhatsApp Support */}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 font-bold text-emerald-800 transition hover:bg-emerald-100/60"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="size-5 text-emerald-600" />
              <div className="text-left">
                <div className="text-xs font-bold">WhatsApp Support</div>
                <div className="text-[11px] font-normal text-emerald-700/80">Chat with support agent</div>
              </div>
            </div>
            <ExternalLink className="size-4 text-emerald-600" />
          </a>

          {/* Action 5: My Account Orders */}
          <Link
            href="/account"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 font-bold text-gray-800 transition hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-gray-600" />
              <div className="text-left">
                <div className="text-xs font-bold">My Account</div>
                <div className="text-[11px] font-normal text-gray-500">View all past orders</div>
              </div>
            </div>
          </Link>

          {/* Action 6: Book Another Device */}
          <Link
            href="/"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 font-bold text-gray-800 transition hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="size-5 text-gray-600" />
              <div className="text-left">
                <div className="text-xs font-bold">Back to Home</div>
                <div className="text-[11px] font-normal text-gray-500">Browse more services</div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── Peace of Mind Guarantees ────────────────────────────────── */}
      <section className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-400">
          <Sparkles className="size-4 text-brand-600" />
          Looplic Assurance & Guarantees
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="text-center p-3 rounded-2xl bg-gray-50">
            <ShieldCheck className="size-6 text-brand-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">Up to 1-Yr Warranty</p>
            <p className="text-[10px] text-gray-500">On genuine spare parts</p>
          </div>

          <div className="text-center p-3 rounded-2xl bg-gray-50">
            <CheckCircle2 className="size-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">No Fix, No Fee</p>
            <p className="text-[10px] text-gray-500">Zero charges if unfixed</p>
          </div>

          <div className="text-center p-3 rounded-2xl bg-gray-50">
            <Shield className="size-6 text-blue-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">100% Data Privacy</p>
            <p className="text-[10px] text-gray-500">Zero access to personal data</p>
          </div>

          <div className="text-center p-3 rounded-2xl bg-gray-50">
            <Wrench className="size-6 text-amber-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">Tested Components</p>
            <p className="text-[10px] text-gray-500">Certified grade-A parts</p>
          </div>
        </div>
      </section>
    </div>
  );
}
