import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, ClipboardCheck, ShieldCheck, Truck } from "lucide-react";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CorporateBuybackForm } from "@/src/components/next/CorporateBuybackForm";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Bulk & Corporate IT Asset Buy-Back in Bangalore",
  description:
    "Sell your company's used laptops, desktops, phones and IT assets in bulk. Certified data wipe, doorstep collection, and same-day corporate payment in Bangalore.",
  pathname: "/sell/corporate",
  keywords: [
    "corporate IT asset buy-back",
    "bulk laptop selling",
    "IT asset disposition Bangalore",
    "sell company laptops",
    "e-waste buy-back",
    "Looplic",
  ],
});

const benefits = [
  {
    icon: ClipboardCheck,
    title: "Per-device valuation",
    description: "Every unit is graded and priced individually — you get an itemised quote sheet, not a lump-sum lowball.",
  },
  {
    icon: ShieldCheck,
    title: "Certified data destruction",
    description: "Documented wipe or disk destruction for every device, with a compliance certificate for your records.",
  },
  {
    icon: Truck,
    title: "On-site collection",
    description: "Our team packs and collects from your office — no logistics for your staff to manage.",
  },
  {
    icon: Banknote,
    title: "Fast corporate payment",
    description: "Bank transfer with GST invoice as soon as the audit is confirmed — usually the same week.",
  },
];

export default function CorporateBuybackPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-[12px] text-gray-500">
          <Link href="/sell" className="font-semibold text-violet-600 hover:underline">Sell</Link>
          <span className="mx-1.5">/</span>
          <span>Bulk / Corporate</span>
        </nav>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#00D28E]"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#00B47D]">Bulk / Corporate · B2B</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#111827]">Company IT asset buy-back</h1>
          <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-gray-500">
            Refreshing your fleet? We buy used laptops, desktops, phones, tablets and networking gear in bulk —
            with certified data wiping and doorstep collection across Bangalore.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
          <div className="md:col-span-3">
            <CorporateBuybackForm />
          </div>

          <div className="space-y-3 md:col-span-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-50">
                    <Icon className="size-4 text-emerald-500" />
                  </div>
                  <h3 className="mb-1 text-[13px] font-semibold text-gray-900">{benefit.title}</h3>
                  <p className="text-[11px] leading-snug text-gray-500">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
