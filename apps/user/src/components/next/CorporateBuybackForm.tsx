"use client";

import { ArrowRight, Building2, CheckCircle, Loader2, MessageCircle } from "lucide-react";
import { useState } from "react";

import { notifyLeadSubmission } from "@/src/lib/leads/client";
import { whatsappPhone } from "@/src/lib/company";

const DEVICE_TYPES = ["Laptops", "Desktops", "Phones", "Tablets", "Monitors", "Servers / Networking", "Other"];

const QUANTITY_RANGES = ["5 – 20 devices", "20 – 50 devices", "50 – 200 devices", "200+ devices"];

export function CorporateBuybackForm() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  function toggleDeviceType(type: string) {
    setDeviceTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");

    const ok = await notifyLeadSubmission({
      source: "corporate-buyback",
      title: `Corporate buy-back enquiry — ${companyName.trim() || "Unknown company"}`,
      customer: { name: contactName.trim() || null, phone: phone.trim() || null, email: email.trim() || null },
      notes: notes.trim() || null,
      metadata: {
        company: companyName.trim() || null,
        deviceTypes: deviceTypes.join(", ") || null,
        quantity: quantity || null,
      },
    });

    setStatus(ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="size-7 text-emerald-500" />
        </div>
        <h2 className="text-[18px] font-semibold text-gray-900">Enquiry received!</h2>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-gray-500">
          Our corporate buy-back team will reach out within one business day with a valuation plan for your devices.
        </p>
        <a
          href={`https://wa.me/91${whatsappPhone}?text=${encodeURIComponent(`Hi! I just submitted a corporate buy-back enquiry for ${companyName.trim() || "my company"}. I'd like to discuss it.`)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-[13px] font-bold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <MessageCircle className="size-4" /> Chat with us now instead
        </a>
      </div>
    );
  }

  const inputClassName =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-medium text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-violet-400";

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50">
          <Building2 className="size-5 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Tell us about your devices</h2>
          <p className="text-[11px] text-gray-500">We&apos;ll respond within one business day</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Company name *</span>
          <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Pvt Ltd" className={inputClassName} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Contact person *</span>
          <input required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" className={inputClassName} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Work email *</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputClassName} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Phone *</span>
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className={inputClassName} />
        </label>
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">What are you selling?</span>
        <div className="flex flex-wrap gap-2">
          {DEVICE_TYPES.map((type) => {
            const isSelected = deviceTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleDeviceType(type)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  isSelected ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 bg-white text-gray-600 hover:border-violet-200"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Approximate quantity</span>
        <div className="flex flex-wrap gap-2">
          {QUANTITY_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setQuantity(quantity === range ? "" : range)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                quantity === range ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 bg-white text-gray-600 hover:border-violet-200"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Anything else?</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Device models, age, preferred pickup timeline..."
          className={`${inputClassName} resize-none`}
        />
      </label>

      {status === "error" ? (
        <p className="mt-3 text-[12px] font-semibold text-rose-500">
          Something went wrong sending your enquiry — please try again or WhatsApp us at +91 {whatsappPhone}.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending...
          </>
        ) : (
          <>
            Get Corporate Valuation <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
