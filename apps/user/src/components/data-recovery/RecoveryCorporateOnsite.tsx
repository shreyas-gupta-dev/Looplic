"use client";

import { useState } from "react";
import {
  Building2,
  Server,
  FileKey,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Copy,
  MessageSquare,
  X,
} from "lucide-react";
import { LAB_CONTACT } from "./recovery-data";

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

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit enterprise request.");
      }

      setCreatedCaseCode(result.bookingCode);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="onsite" className="scroll-mt-16 bg-white py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Explainer */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              <Building2 className="size-3.5" />
              <span>Enterprise & On-Premise Recovery</span>
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              On-Site Data Recovery at Your Company Premises
            </h2>

            <p className="mt-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
              For corporate enterprises, healthcare organizations, and financial institutions where data compliance policies prevent storage media from leaving your facility, Looplic dispatches senior data recovery engineers directly to your server room.
            </p>

            <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-6 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <FileKey className="mt-0.5 size-4 text-blue-600 shrink-0" />
                <div>
                  <strong className="block text-slate-900 font-bold">Strict Corporate NDA Execution</strong>
                  <span>Bilateral NDA signed before engineer enters your facility or examines any drive.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Server className="mt-0.5 size-4 text-blue-600 shrink-0" />
                <div>
                  <strong className="block text-slate-900 font-bold">Data Never Leaves Your Facility</strong>
                  <span>Portable hardware write-blockers and cloning equipment deployed in your server room.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 text-blue-600 shrink-0" />
                <div>
                  <strong className="block text-slate-900 font-bold">Minimal Business Downtime</strong>
                  <span>Emergency 24/7 round-the-clock shift support to restore business operations.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Corporate Request Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-lg sm:p-9">
              <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                Request On-Site Recovery Consultation
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

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Technologies Pvt Ltd"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="29ABCDE1234F1Z5"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">IT Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. IT Manager, CTO, Sysadmin"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="it@company.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Phone *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="corporate-environment" className="block text-xs font-semibold text-slate-700 mb-1">Environment / Systems *</label>
                    <select
                      id="corporate-environment"
                      name="environment"
                      aria-label="Environment or Systems"
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    >
                      <option value="RAID / Server">RAID / Server (Dell, HP, Supermicro)</option>
                      <option value="NAS / SAN Storage">NAS / SAN Storage (Synology, QNAP, NetApp)</option>
                      <option value="Virtual Machines">Virtual Machines (VMware, Hyper-V, Proxmox)</option>
                      <option value="Database Server">Database Server (Oracle, SQL, MySQL, Postgres)</option>
                      <option value="High-Density Storage">High-Density Storage (SAS / Fiber Channel)</option>
                      <option value="Workstations / Desktops">Workstations / Desktops</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="corporate-urgency" className="block text-xs font-semibold text-slate-700 mb-1">Urgency Level *</label>
                    <select
                      id="corporate-urgency"
                      name="urgency"
                      aria-label="Urgency Level"
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    >
                      <option value="emergency">Critical · Business is Down (Immediate)</option>
                      <option value="priority">High · Within 24–48 Hours</option>
                      <option value="standard">Planned · Schedule Site Visit</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Address & City *</label>
                    <input
                      type="text"
                      required
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                      placeholder="Tech Park, Building, City (e.g. Electronic City, Bengaluru)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Configuration Details</label>
                    <textarea
                      rows={2}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="e.g. 8x 4TB SAS drives in RAID 6, 2 failed disks, VMFS corrupted"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="nda-checkbox"
                    checked={ndaRequired}
                    onChange={(e) => setNdaRequired(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="nda-checkbox" className="text-xs text-slate-700 cursor-pointer">
                    We require a signed Non-Disclosure Agreement (NDA) before site visit.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Submitting Enterprise Scoping...</span>
                    </>
                  ) : (
                    <>
                      <span>Dispatch Enterprise Scoping Request</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Success Modal */}
      {createdCaseCode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="corporate-onsite-heading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setCreatedCaseCode(null)}
              aria-label="Close dialog"
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-5" />
            </button>
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="mt-4 text-center">
              <h3 id="corporate-onsite-heading" className="text-xl font-bold text-slate-900">On-Site Request Received</h3>
              <p className="mt-1 text-xs text-slate-600">
                Reference Request ID:
              </p>
              <div className="my-4 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/70 p-3">
                <span className="font-mono text-lg font-bold text-blue-950">{createdCaseCode}</span>
              </div>
              <p className="text-xs text-slate-500">
                Our enterprise coordinator is reviewing your storage configuration and will contact the designated IT manager immediately.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setCreatedCaseCode(null)}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
