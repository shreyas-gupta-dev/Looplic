"use client";

import { useState } from "react";
import {
  Building2,
  Server,
  FileKey,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Copy,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { LAB_CONTACT } from "./recovery-data";
import { RecoveryButton } from "./RecoveryButton";

export function RecoveryCorporateOnsite() {
  const [company, setCompany] = useState("");
  const [gstin, setGstin] = useState("");
  const [contactName, setContactName] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [environment, setEnvironment] = useState("RAID / Server");
  const [urgency, setUrgency] = useState<"standard" | "priority" | "emergency">("priority");
  const [details, setDetails] = useState("");
  const [ndaRequired, setNdaRequired] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdCaseCode, setCreatedCaseCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/data-recovery/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          phone,
          email,
          city,
          address: siteAddress,
          deviceType: environment,
          failureType: "enterprise_onsite",
          priority: urgency,
          details: `[Corporate On-Site] Company: ${company} (${designation}) | GSTIN: ${gstin || "N/A"} | Environment: ${environment} | Details: ${details}`,
          isBusinessOnsite: true,
          companyName: company,
          designation,
          gstin,
          ndaRequired,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to submit corporate inquiry");
      }

      setCreatedCaseCode(data.bookingCode);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="corporate" className="scroll-mt-16 bg-white py-16 text-slate-900 sm:py-24 border-t border-slate-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Explainer */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <Building2 className="size-3.5 text-emerald-700" />
              <span>Enterprise & On-Premise Labs</span>
            </div>

            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              On-Site Recovery at Your Company Facility
            </h2>

            <p className="mt-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
              For enterprises with strict data sovereignty policies where drives cannot leave the building, Looplic dispatches recovery engineers with portable write-blockers directly to your server room.
            </p>

            <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-6 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <FileKey className="mt-0.5 size-4 text-emerald-700 shrink-0" />
                <div>
                  <strong className="block text-slate-900 font-bold">Bilateral Corporate NDA</strong>
                  <span className="text-slate-600">Signed before engineer enters your facility or inspects drives.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Server className="mt-0.5 size-4 text-emerald-700 shrink-0" />
                <div>
                  <strong className="block text-slate-900 font-bold">Data Never Leaves Your Premise</strong>
                  <span className="text-slate-600">Hardware write-blockers and imagers operate in your server room.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 text-emerald-700 shrink-0" />
                <div>
                  <strong className="block text-slate-900 font-bold">24/7 Shift Recovery</strong>
                  <span className="text-slate-600">Continuous overnight work to restore business operations.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Corporate Request Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm sm:p-8">
              <h3 className="font-display text-lg font-bold text-slate-900 sm:text-xl">
                Request On-Site Engineering Team
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Submit this scoping form and our enterprise team will connect within 15 minutes.
              </p>

              {errorMessage && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                  <AlertCircle className="size-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {createdCaseCode ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <h4 className="mt-3 font-display text-lg font-bold text-slate-900">
                    Corporate Case Registered
                  </h4>
                  <p className="mt-1 text-xs text-slate-600">
                    Your on-site enterprise case reference has been minted:
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 font-mono text-sm font-extrabold text-emerald-700">
                    <span>{createdCaseCode}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(createdCaseCode)}
                      className="text-slate-400 hover:text-slate-700"
                      title="Copy Case ID"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-600">
                    A dedicated enterprise case manager is reviewing your requirements and will call your designated contact.
                  </p>
                  <div className="mt-5">
                    <a
                      href={`https://wa.me/${LAB_CONTACT.whatsapp}?text=${encodeURIComponent(`Hi Looplic, I registered corporate case ${createdCaseCode}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
                    >
                      <MessageSquare className="size-4" />
                      <span>WhatsApp Enterprise Dispatch</span>
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Acme Tech Pvt Ltd"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Company GSTIN (Optional)</label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        placeholder="29AAAAA0000A1Z5"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person Name *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="IT Head / Director"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
                      <input
                        type="text"
                        required
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="CTO / IT Lead"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Phone / Mobile *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98000 00000"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Facility / Data Center Address in Bengaluru *</label>
                    <input
                      type="text"
                      required
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                      placeholder="Tech Park, Tower B, Electronic City / Whitefield"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Environment *</label>
                      <select
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="RAID 5 / 6 Array">RAID 5 / 6 Server Array</option>
                        <option value="Dell / HPE Server">Dell PowerEdge / HPE ProLiant</option>
                        <option value="Synology / QNAP NAS">Synology / QNAP Enterprise NAS</option>
                        <option value="SAN / Virtualized VMFS">SAN / VMware ESXi / Hyper-V</option>
                        <option value="Multiple NVMe / SSDs">Corporate SSD / NVMe Storage</option>
                        <option value="Other Enterprise">Other Custom Architecture</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Target Response Speed</label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="priority">Priority On-Site (Same-Day Dispatch)</option>
                        <option value="emergency">24/7 Critical Outage (Within 2 Hours)</option>
                        <option value="standard">Standard Next-Business-Day</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Failure Symptoms & RAID Config Details</label>
                    <textarea
                      rows={2}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="e.g. 2 drives amber flashing in RAID 6 array; VMware datastore offline"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="nda"
                      checked={ndaRequired}
                      onChange={(e) => setNdaRequired(e.target.checked)}
                      className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="nda" className="text-xs text-slate-700 font-medium">
                      Company requires bilateral Non-Disclosure Agreement (NDA) before site inspection
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Registering Case...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Corporate On-Site Dispatch</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
