"use client";

import { ArrowRight, CalendarCheck, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deviceDisplayName } from "@/src/lib/sell";

const TIME_SLOTS = ["10 AM – 1 PM", "1 PM – 4 PM", "4 PM – 7 PM"];

type BuybackPickupFormProps = {
  /** "pickup" books a doorstep pickup for a quoted device; "quote" requests a manual quote for an unpriced model. */
  mode: "pickup" | "quote";
  brandName: string;
  modelName: string;
  variantLabel?: string | null;
  quoteAmount?: number | null;
  serviceType?: string;
  quoteBreakdown?: string | null;
};

export function BuybackPickupForm({ mode, brandName, modelName, variantLabel, quoteAmount, serviceType, quoteBreakdown }: BuybackPickupFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [bookingCode, setBookingCode] = useState<string | null>(null);
  const router = useRouter();

  const device = `${deviceDisplayName(brandName, modelName)}${variantLabel ? ` (${variantLabel})` : ""}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");

    try {
      const response = await fetch("/api/buyback/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          brandName,
          modelName,
          variantLabel: variantLabel || null,
          quotedAmount: quoteAmount ?? null,
          quoteBreakdown: quoteBreakdown || null,
          serviceType: serviceType || "mobile",
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim() || null,
          pickupDate: pickupDate || null,
          timeSlot: timeSlot || null,
        }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.ok) {
        const code = typeof result.bookingCode === "string" ? result.bookingCode : null;
        if (mode === "pickup" && code) {
          router.push(`/sell/booked/${code}`);
          return;
        }
        setBookingCode(code);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white shadow-sm">
          <CheckCircle className="size-6 text-emerald-500" />
        </div>
        <h3 className="text-[16px] font-semibold text-gray-900">
          {mode === "pickup" ? "Pickup booked!" : "Quote request received!"}
        </h3>
        {bookingCode ? (
          <p className="mt-1 text-[13px] font-bold tracking-wide text-violet-600">Booking ID: {bookingCode}</p>
        ) : null}
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-gray-600">
          {mode === "pickup"
            ? `Our executive will call ${phone.trim() || "you"} to confirm the visit, verify your ${device} on the spot, and pay instantly via UPI or bank transfer.`
            : `We'll call ${phone.trim() || "you"} within a few hours with the best price for your ${device}.`}
        </p>
      </div>
    );
  }

  const inputClassName =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-medium text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-violet-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Your name *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputClassName} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Phone *</span>
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className={inputClassName} />
        </label>
      </div>

      {mode === "pickup" ? (
        <>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Pickup address *</span>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="House / street / area, Bangalore"
              className={`${inputClassName} resize-none`}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Preferred date</span>
              <input
                type="date"
                value={pickupDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setPickupDate(e.target.value)}
                className={inputClassName}
              />
            </label>
            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Time slot</span>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(timeSlot === slot ? "" : slot)}
                    className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      timeSlot === slot ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 bg-white text-gray-600 hover:border-violet-200"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {status === "error" ? (
        <p className="text-[12px] font-semibold text-rose-500">
          Something went wrong — please try again in a moment.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending...
          </>
        ) : mode === "pickup" ? (
          <>
            <CalendarCheck className="size-4" /> Confirm Free Pickup
          </>
        ) : (
          <>
            Request Best Price <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
