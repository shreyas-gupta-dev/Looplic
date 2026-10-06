import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, Shield, ShieldCheck, Wrench, X } from "lucide-react";

import { InfoPageLayout } from "@/src/components/next/InfoPageLayout";
import { supportEmail } from "@/src/lib/company";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Warranty Policy | Looplic Refurbished Phones & Repair Services",
  description: `Looplic Warranty Policy for refurbished phones, laptops and doorstep repair services. Understand what is covered, what is not covered, and how to claim warranty.`,
  pathname: "/warranty-policy",
});

const coveredItems = [
  "Manufacturing defects in hardware components",
  "Screen malfunctions not caused by physical damage",
  "Battery performance issues (significant degradation below rated capacity)",
  "Motherboard / logic board faults",
  "Speaker, microphone or charging port failures from normal use",
  "Camera module faults",
  "Button and connectivity failures (not caused by physical damage)",
];

const notCoveredItems = [
  "Physical damage (cracks, dents, bends) caused after purchase",
  "Liquid damage or water ingress after purchase",
  "Screen cracks or broken glass from drops",
  "Software issues, data loss, or OS reinstallation",
  "Damage caused by third-party repairs or modifications",
  "Damage from improper use, accidents, or misuse",
  "Consumable parts (SIM tray, protective covers, earphones)",
  "Cosmetic wear (minor scratches, paint wear) that do not affect functionality",
];

const faqs = [
  {
    q: "What is the warranty period on refurbished phones?",
    a: "Looplic Assured refurbished devices come with a 6-month warranty from the date of purchase. The warranty covers hardware defects as described in this policy.",
  },
  {
    q: "What is the warranty period on repair services?",
    a: "Warranty on repair services varies by repair type and part. The applicable warranty period will be communicated at the time of service. Warranty on repair covers the specific part or repair performed.",
  },
  {
    q: "Is the 7-day replacement different from the warranty?",
    a: "Yes. The 7-day replacement applies to refurbished device purchases where the device has a significant functional issue or does not match the described condition on arrival. The 6-month warranty covers defects that develop during use after that window.",
  },
  {
    q: "How do I claim warranty?",
    a: "Contact our support team via email or WhatsApp with your order details and a description of the issue. Our team will assess the issue and guide you through the next steps.",
  },
  {
    q: "Is battery health covered under warranty?",
    a: "Battery performance is covered if it degrades significantly below rated capacity during the warranty period under normal usage conditions. Normal battery wear from regular use is not covered.",
  },
  {
    q: "Is liquid damage covered?",
    a: "Liquid damage that occurs after purchase is not covered under warranty. We check for existing liquid damage indicators at the time of sale.",
  },
];

export default function WarrantyPolicyPage() {
  return (
    <InfoPageLayout
      eyebrow="Warranty & Support"
      title="Warranty Policy"
      description="Understand warranty coverage, 7-day replacement, covered hardware issues, and claim process for Looplic devices and repairs."
    >
      <div className="mx-auto max-w-3xl">

        {/* Overview cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <ShieldCheck className="size-6 text-emerald-700 mb-2" />
            <p className="font-bold text-emerald-900">Refurbished Devices</p>
            <p className="mt-1 text-sm text-emerald-800">6-Month warranty from date of purchase</p>
            <p className="mt-1 text-xs text-emerald-700">7-Day replacement on eligible issues</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <Wrench className="size-6 text-blue-700 mb-2" />
            <p className="font-bold text-blue-900">Repair Services</p>
            <p className="mt-1 text-sm text-blue-800">Warranty on eligible repairs</p>
            <p className="mt-1 text-xs text-blue-700">Applicable warranty communicated at time of service</p>
          </div>
        </div>

        {/* What is covered */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-5">What Is Covered</h2>
          <div className="space-y-2">
            {coveredItems.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3 text-sm text-gray-700">
                <ShieldCheck className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* What is not covered */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-5">What Is Not Covered</h2>
          <div className="space-y-2">
            {notCoveredItems.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3 text-sm text-gray-700">
                <X className="size-4 shrink-0 text-red-500 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Procedures */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Warranty, Replacement & Refund Procedure</h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <div>
              <p className="font-semibold text-gray-900">Warranty Claim</p>
              <p className="mt-1">Contact our support team with your order ID and a description of the issue. Our team will assess whether the issue is covered under warranty and arrange for repair, replacement, or refund accordingly.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">7-Day Replacement (Refurbished Devices)</p>
              <p className="mt-1">If your device has a significant functional issue or does not match the described condition, contact us within 7 days of delivery. We will arrange a replacement or refund depending on availability and the nature of the issue.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Refund</p>
              <p className="mt-1">Refunds are processed to the original payment method. Refund timelines depend on your bank or payment provider. We will confirm the refund initiation with you.</p>
            </div>
          </div>
        </section>

        {/* Customer support contact */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Support</h2>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700 space-y-2">
            <p>For warranty claims or support, contact us via:</p>
            <p>📧 <a href={`mailto:${supportEmail}`} className="text-brand-600 hover:underline">{supportEmail}</a></p>
            <p>Our team will respond and guide you through the process.</p>
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
                  <HelpCircle className="size-4 shrink-0 text-gray-400 group-open:text-emerald-600" />
                </summary>
                <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
          <Shield className="size-8 mx-auto mb-3 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900">Need warranty support?</h2>
          <p className="mt-2 text-sm text-gray-500">Contact our team and we&apos;ll help resolve your issue.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/contact-us" className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
              Contact Support
            </Link>
            <Link href="/refund-policy" className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Refund Policy
            </Link>
          </div>
        </section>
      </div>
    </InfoPageLayout>
  );
}
