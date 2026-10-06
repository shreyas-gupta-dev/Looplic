import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CheckCircle2, HelpCircle, IndianRupee, Search, Shield, Smartphone, Truck } from "lucide-react";

import { InfoPageLayout } from "@/src/components/next/InfoPageLayout";
import { companyName, supportEmail, supportPhoneDisplay } from "@/src/lib/company";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Buyback Policy | Looplic Device Resale",
  description: `Looplic's Buyback Policy explains how device valuations work, what affects the final offer, and how payment is made after inspection. Sell your old phone or laptop in Bangalore.`,
  pathname: "/buyback-policy",
});

const inspectionFactors = [
  "Screen condition (cracks, dead pixels, touch issues)",
  "Body condition (scratches, dents, bends)",
  "Battery condition and health",
  "Camera functionality (front and rear)",
  "Speaker and microphone",
  "Charging port and connectivity",
  "Face ID / Touch ID / Fingerprint sensor",
  "Network functionality (calls, data, Wi-Fi)",
  "Water or liquid damage indicators",
  "Missing or replaced components",
  "Device lock or account status (iCloud, Google)",
  "IMEI verification and ownership confirmation",
];

const faqs = [
  {
    q: "Is the online valuation the final amount I will receive?",
    a: "No. The online valuation is an estimate based on the information you provide about your device model, storage and condition. The final offer is determined after our representative physically and functionally inspects the device at your doorstep. The final offer may be higher or lower depending on the actual device condition.",
  },
  {
    q: "Why might the final offer differ from the online estimate?",
    a: "The online estimate assumes the device matches the condition you selected. If the actual device condition differs — for example, there are additional cosmetic or functional issues — the final offer will reflect that. Common factors include undisclosed screen damage, battery issues, or account locks.",
  },
  {
    q: "Do I have to accept the final offer?",
    a: "No. You can decline the final inspected offer. If you decline, your device will be returned to you without any charge.",
  },
  {
    q: "When will I receive payment?",
    a: "Payment is initiated only after the device inspection is completed and you accept the final offer. Payment is typically made via UPI, bank transfer, or cash at the time of pickup.",
  },
  {
    q: "What should I do with my data before selling?",
    a: "We strongly recommend backing up your data and signing out of all personal accounts — including Apple ID / Find My iPhone, Google Account, and Samsung Account — and removing any screen locks or device locks before handing over the device.",
  },
  {
    q: "Can I sell a damaged or non-working device?",
    a: "Eligible damaged and non-working devices may be accepted. The final value depends on the device model, physical condition, functionality and inspection results.",
  },
];

export default function BuybackPolicyPage() {
  return (
    <InfoPageLayout
      eyebrow="Device Buyback"
      title="Buyback Policy"
      description="Understand how online valuations, doorstep inspection, and device payment work at Looplic in Bangalore."
    >
      <div className="mx-auto max-w-3xl">

        {/* Important notice */}
        <div className="mb-10 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Important: Online valuations are estimates</p>
            <p className="mt-1 text-sm text-amber-800">
              The value shown on our website or app is an <strong>estimated resale value</strong> based on the information you provide. The <strong>final offer is determined after physical and functional inspection</strong> of your device at your doorstep. You are not obligated to accept the final offer.
            </p>
          </div>
        </div>

        {/* How valuation works */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How Device Valuation Works</h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              Our online valuation tool provides an <strong>estimated resale value</strong> based on your device model, storage capacity, and the condition category you select. This estimate is intended to give you a general idea of what your device may be worth.
            </p>
            <p>
              A <strong>Looplic representative will visit your location</strong> for a doorstep inspection. The representative will physically and functionally check your device and present a final offer based on the actual condition of the device.
            </p>
            <p>
              You may <strong>accept or decline</strong> the final offer. If you decline, the device is returned to you at no charge.
            </p>
          </div>
        </section>

        {/* Inspection factors */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-2">What Affects the Final Offer</h2>
          <p className="text-sm text-gray-500 mb-5">The following factors are assessed during the physical inspection and may affect the final valuation:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {inspectionFactors.map((factor) => (
              <div key={factor} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-white p-3 text-sm text-gray-700">
                <Search className="size-4 shrink-0 text-brand-600 mt-0.5" />
                {factor}
              </div>
            ))}
          </div>
        </section>

        {/* Payment section */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment</h2>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
              <p><strong>Payment is made only after</strong> the device inspection is completed and you accept the final inspected offer.</p>
            </div>
            <div className="flex items-start gap-3">
              <IndianRupee className="size-5 shrink-0 text-emerald-600 mt-0.5" />
              <p>Payment is typically made via <strong>UPI, bank transfer, or cash</strong> at the time of pickup.</p>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="size-5 shrink-0 text-brand-600 mt-0.5" />
              <p>Doorstep pickup is free of charge within our serviceable areas in Bangalore.</p>
            </div>
          </div>
        </section>

        {/* Data recommendation */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Before Handing Over Your Device</h2>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 space-y-2 text-sm text-blue-900">
            <p className="font-semibold">We strongly recommend the following before handover:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Back up your data (photos, contacts, apps)</li>
              <li>Sign out of your Apple ID / Find My iPhone</li>
              <li>Sign out of your Google Account / Factory Reset Protection</li>
              <li>Sign out of Samsung Account or any OEM account</li>
              <li>Remove all screen locks, PINs, and biometrics</li>
              <li>Remove any SIM cards or memory cards</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-2xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <HelpCircle className="size-4 shrink-0 text-gray-400 group-open:text-brand-600" />
                </summary>
                <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
          <Shield className="size-8 mx-auto mb-3 text-brand-600" />
          <h2 className="text-lg font-bold text-gray-900">Questions about your buyback?</h2>
          <p className="mt-2 text-sm text-gray-500">Contact our team and we&apos;ll be happy to help.</p>
          <div className="mt-4 flex flex-col items-center gap-2 text-sm font-medium">
            <a href={`mailto:${supportEmail}`} className="text-brand-600 hover:underline">
              ✉️ {supportEmail}
            </a>
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/sell" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
              Check Device Value
            </Link>
            <Link href="/faq" className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              View FAQ
            </Link>
          </div>
        </section>
      </div>
    </InfoPageLayout>
  );
}
