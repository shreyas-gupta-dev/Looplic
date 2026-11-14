"use client";

import { useState, useEffect } from "react";
import {
  PackageSearch,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Layers,
} from "lucide-react";
import { LAB_CONTACT } from "./recovery-data";

type RecoveryTrackingSectionProps = {
  initialCode?: string;
};

export function RecoveryTrackingSection({ initialCode = "" }: RecoveryTrackingSectionProps) {
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanPhone = phone.trim().replace(/\D/g, "").slice(-10);

    if (!cleanCode) {
      setError("Please enter your Booking Case ID (e.g. REC-261114-XXXXXX).");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter the 10-digit mobile number associated with this case.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch(`/api/track/${encodeURIComponent(cleanCode)}?phone=${encodeURIComponent(cleanPhone)}`);
      if (!res.ok) {
        throw new Error("Case not found. Please verify the Case ID and phone number, or contact the lab directly.");
      }
      const data = await res.json();
      setBookingData(data);
    } catch (err: any) {
      setBookingData(null);
      setError(err.message || "Failed to look up case status.");
    } finally {
      setLoading(false);
    }
  };

  const STAGES = [
    { label: "Request Received", key: "pending" },
    { label: "Device in Transit", key: "picked_up" },
    { label: "Lab Diagnosis", key: "in_progress" },
    { label: "Quote & Approval", key: "ready" },
    { label: "Recovery & Return", key: "completed" },
  ];

  return (
    <section id="track" className="scroll-mt-16 bg-slate-100/70 py-16 md:py-24">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto max-w-2xl sm:max-w-3xl text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <PackageSearch className="size-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Live Order Status
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Know Exactly Where Your Recovery Stands
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Track diagnostic results, quote approvals, and cleanroom progress in real time using your Case ID and phone number.
          </p>
        </div>

        {/* Tracking Search Card */}
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <form onSubmit={handleTrack} className="grid grid-cols-1 gap-3.5 sm:grid-cols-12 sm:items-end">
            <div className="sm:col-span-5">
              <label htmlFor="track-code-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                Case ID *
              </label>
              <input
                id="track-code-input"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. REC-261114-AB12CD"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="track-phone-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                Registered Mobile Number *
              </label>
              <input
                id="track-phone-input"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    <span>Track Status</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{error}</p>
                  <p className="text-red-700">
                    Need immediate assistance? Call our lab at{" "}
                    <a href={`tel:${LAB_CONTACT.phoneClean}`} className="font-bold underline">
                      {LAB_CONTACT.phoneFormatted}
                    </a>{" "}
                    or{" "}
                    <a
                      href={`https://wa.me/${LAB_CONTACT.whatsapp}?text=${encodeURIComponent(`Hi, I'm checking case ${code}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline"
                    >
                      WhatsApp us
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Result View */}
          {bookingData && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
              {/* Header Info */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-base font-extrabold text-slate-900">
                      {bookingData.bookingCode}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      {bookingData.serviceLabel || "Data Recovery"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Order registered on {new Date(bookingData.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{bookingData.statusLabel || bookingData.status}</span>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="mt-6">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Recovery Progress:
                </div>
                <div className="relative flex items-center justify-between">
                  {/* Timeline track line */}
                  <div className="absolute left-0 top-3 h-0.5 w-full bg-slate-200 -z-0" />

                  {STAGES.map((stg, idx) => {
                    const currentIndex = bookingData.timelineIndex ?? 0;
                    const isDone = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                      <div key={stg.key} className="relative z-10 flex flex-col items-center text-center">
                        <div
                          className={`flex size-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                            isDone
                              ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                              : "bg-white border-2 border-slate-300 text-slate-400"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="size-3.5" /> : idx + 1}
                        </div>
                        <span
                          className={`mt-2 text-[10px] sm:text-xs font-medium max-w-[70px] sm:max-w-[100px] leading-tight ${
                            isCurrent
                              ? "font-bold text-emerald-700"
                              : isDone
                              ? "text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {stg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Description & Latest Note */}
              <div className="mt-8 rounded-xl bg-white p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-800">Status Update:</div>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {bookingData.statusDescription || "Your recovery case is active in our system."}
                </p>

                {bookingData.history && bookingData.history.length > 0 && bookingData.history[0]?.note && (
                  <div className="mt-3 rounded-lg bg-emerald-50/70 p-3 border border-emerald-200/60 text-xs text-emerald-950">
                    <strong className="block text-emerald-900 font-bold mb-0.5">Latest Engineer Note:</strong>
                    <span>{bookingData.history[0].note}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
