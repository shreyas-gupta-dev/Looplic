"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  MessageSquare,
  ArrowRight,
  Loader2,
  AlertCircle,
  Truck,
  HardDrive,
  Cpu,
  Laptop,
  Server,
  Usb,
  Smartphone,
  X,
} from "lucide-react";
import { STORAGE_CATEGORIES, LAB_CONTACT } from "./recovery-data";

type RecoveryBookingFormProps = {
  selectedCategory?: string;
  selectedPriority?: "standard" | "priority" | "emergency";
  onBookingSuccess?: (bookingCode: string) => void;
};

export function RecoveryBookingForm({
  selectedCategory,
  selectedPriority = "standard",
  onBookingSuccess,
}: RecoveryBookingFormProps) {
  const [deviceType, setDeviceType] = useState(selectedCategory || "hdd");
  const [deviceModel, setDeviceModel] = useState("");
  const [failureType, setFailureType] = useState("not_detected");
  const [priority, setPriority] = useState<"standard" | "priority" | "emergency">(selectedPriority);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [websiteHoneypot, setWebsiteHoneypot] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdCaseCode, setCreatedCaseCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const utms: Record<string, string> = {};
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid"].forEach((key) => {
        const val = sp.get(key);
        if (val) {
          utms[key] = val;
          try {
            sessionStorage.setItem(`looplic_${key}`, val);
          } catch (e) {}
        } else {
          try {
            const saved = sessionStorage.getItem(`looplic_${key}`);
            if (saved) utms[key] = saved;
          } catch (e) {}
        }
      });
      setUtmParams(utms);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setDeviceType(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedPriority) {
      setPriority(selectedPriority);
    }
  }, [selectedPriority]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/data-recovery/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          city,
          pincode,
          address,
          deviceType,
          deviceModel,
          failureType,
          priority,
          details,
          website: websiteHoneypot,
          utmSource: utmParams["utm_source"] || "",
          utmMedium: utmParams["utm_medium"] || "",
          utmCampaign: utmParams["utm_campaign"] || "",
          utmContent: utmParams["utm_content"] || "",
          utmTerm: utmParams["utm_term"] || "",
          gclid: utmParams["gclid"] || "",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit recovery request.");
      }

      setCreatedCaseCode(result.bookingCode);
      if (onBookingSuccess) {
        onBookingSuccess(result.bookingCode);
      }

      // Track Analytics & Google Ads Conversion (privacy-safe, zero PII)
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "generate_lead", {
          event_category: "Data Recovery",
          event_label: deviceType,
          value: 0,
          currency: "INR",
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdCaseCode) return;
    try {
      await navigator.clipboard.writeText(createdCaseCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <section id="book" className="scroll-mt-16 bg-slate-50 py-16 md:py-24">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Initial Evaluation & Doorstep Collection
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Request Your Free Lab Diagnosis
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Tell us about your storage device and symptoms. Receive an instant Case ID, safe packaging instructions, and doorstep pickup.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot field (hidden from legitimate users) */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="website"
                value={websiteHoneypot}
                onChange={(e) => setWebsiteHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
                <AlertCircle className="size-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Storage Device Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                1. Select Storage Type *
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {STORAGE_CATEGORIES.map((cat) => {
                  const isSelected = deviceType === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDeviceType(cat.id)}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <Icon className={`size-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className="text-xs truncate">{cat.shortTitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Device Model & Failure Symptom */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Device Brand / Capacity (Optional)
                </label>
                <input
                  type="text"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="e.g. Seagate BarraCuda 2TB, MacBook Pro M1 2021"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="recovery-failure-type" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Primary Failure Issue *
                </label>
                <select
                  id="recovery-failure-type"
                  name="failureType"
                  aria-label="Primary Failure Issue"
                  value={failureType}
                  onChange={(e) => setFailureType(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="not_detected">Not detected or inaccessible</option>
                  <option value="clicking_noise">Clicking, knocking or buzzing sound</option>
                  <option value="deleted_formatted">Accidental format or deleted files</option>
                  <option value="corrupt_firmware">Corrupted partition / firmware error</option>
                  <option value="liquid_physical_damage">Water, fire or physical impact</option>
                  <option value="mac_wont_boot">MacBook won't turn on / logic board dead</option>
                  <option value="raid_failure">RAID volume degraded / server failure</option>
                  <option value="other">Other / not sure</option>
                </select>
              </div>
            </div>

            {/* 3. Priority Turnaround Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                2. Select Priority Speed *
              </label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {[
                  { id: "standard", name: "Standard", time: "3–5 Days", desc: "Best value" },
                  { id: "priority", name: "Priority", time: "24–48 Hours", desc: "Front of queue" },
                  { id: "emergency", name: "Emergency 24/7", time: "Same Day", desc: "Critical shift" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setPriority(tier.id as any)}
                    className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
                      priority === tier.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{tier.name}</span>
                      <span className="text-[11px] font-semibold text-emerald-700">{tier.time}</span>
                    </div>
                    <span className="mt-1 text-[11px] text-slate-500">{tier.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Customer Contact Details */}
            <div className="border-t border-slate-100 pt-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                3. Contact & Pickup Address
              </label>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City (e.g. Bengaluru)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doorstep Pickup Address / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Apartment, Street, Area for doorstep collection"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Critical Folders / Files Needed Most (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="e.g. Tally company data, Family photos folder, Tax documents, MySQL database"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Registering Case...</span>
                  </>
                ) : (
                  <>
                    <span>Create Recovery Case</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>

            {/* Privacy notice */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Your contact information and diagnostic data are protected by strict privacy policies.</span>
            </div>
          </form>
        </div>
      </div>

      {/* ─── Case Registration Success Modal ───────────────────────────────── */}
      {createdCaseCode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-registered-heading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setCreatedCaseCode(null)}
              aria-label="Close case confirmation dialog"
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-5" />
            </button>

            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="mt-4 text-center">
              <h3 id="case-registered-heading" className="text-xl font-bold text-slate-900">Your Case is Registered!</h3>
              <p className="mt-1 text-xs text-slate-600">
                Please save your unique recovery case number:
              </p>

              {/* Case ID Box */}
              <div className="my-5 flex items-center justify-between rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-50/70 p-3.5">
                <span className="font-mono text-lg font-black tracking-wider text-emerald-950">
                  {createdCaseCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm border border-emerald-200 hover:bg-emerald-100"
                >
                  <Copy className="size-3.5" />
                  <span>{copySuccess ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Our recovery desk has received your request. An engineer will contact you shortly to coordinate doorstep collection.
              </p>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5">
                <a
                  href={`https://wa.me/${LAB_CONTACT.whatsapp}?text=${encodeURIComponent(
                    `Hi Looplic Data Recovery, I just registered recovery case ${createdCaseCode}. Please confirm the next steps.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
                >
                  <MessageSquare className="size-4" />
                  <span>Send Case to WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const code = createdCaseCode;
                    setCreatedCaseCode(null);
                    const trackInput = document.getElementById("track-code-input") as HTMLInputElement;
                    if (trackInput) trackInput.value = code;
                    const trackSection = document.getElementById("track");
                    if (trackSection) trackSection.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  View Case Status Online
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
