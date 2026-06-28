import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Cloud, HardDrive, Laptop, Network, Printer, ServerCog, ShieldCheck, Video, Wifi, Wrench } from "lucide-react";
import Link from "next/link";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { ServiceJsonLd } from "@/src/components/seo/ServiceJsonLd";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Managed IT Services for Businesses",
  description: "Book recurring managed IT services, AMC contracts, employee system maintenance, network support, CCTV, cloud setup, backup, and cybersecurity basics.",
  pathname: "/service/managed-it-services",
  keywords: ["managed IT services", "MSP Bangalore", "AMC IT support", "business IT support", "network management"],
});

const serviceItems = [
  { title: "Laptop/Desktop repair", icon: Laptop },
  { title: "Network setup & management", icon: Network },
  { title: "WiFi troubleshooting", icon: Wifi },
  { title: "Server management", icon: ServerCog },
  { title: "CCTV & security systems", icon: Video },
  { title: "Printer setup", icon: Printer },
  { title: "Employee system maintenance", icon: Wrench },
  { title: "Data backup", icon: HardDrive },
  { title: "Cloud setup", icon: Cloud },
  { title: "IT support", icon: CheckCircle2 },
  { title: "Cybersecurity basics", icon: ShieldCheck },
  { title: "Software installation", icon: Wrench },
  { title: "AMC contracts", icon: ServerCog },
];

export default function ManagedItServicesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ServiceJsonLd
        name="Managed IT Services"
        description="Recurring managed IT support, AMC contracts, employee system maintenance, network setup, cloud support, backup, CCTV, and cybersecurity basics."
        path="/service/managed-it-services"
        serviceType="Managed IT services"
      />
      <CatalogNavbar />

      <main>
        <section className="border-b border-slate-200 bg-[#EEF4F8] px-4 py-10 sm:py-14">
          <div className="container mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0096FF] shadow-sm">
                Managed IT Services
              </div>
              <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[#111827] sm:text-5xl">
                Day-to-day IT operations for growing teams.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Looplic MSP handles a company&apos;s daily IT needs: devices, networks, printers, CCTV, backups, cloud setup, support tickets, and AMC contracts.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/book/managed-it-services" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0096FF] to-[#00D28E] px-6 py-3 text-sm font-extrabold text-white shadow-sm shadow-blue-500/20">
                  Book MSP Consultation <ArrowRight className="size-4" />
                </Link>
                <Link href="/book/it-support" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700">
                  Need one-time IT support?
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-50">
                  <ServerCog className="size-6 text-[#0096FF]" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">Recurring B2B Revenue Model</div>
                  <div className="text-xs text-slate-500">Stable monthly IT care through AMC and support plans.</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {["Monthly care", "Office visits", "Remote support", "AMC ready"].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-4 py-10">
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1 w-6 rounded-full bg-[#00B4D8]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#0096FF]">Services include</span>
            </div>
            <h2 className="text-2xl font-semibold text-[#111827]">Everything an office needs to stay running</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {serviceItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50">
                    <Icon className="size-5 text-[#0096FF]" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">{item.title}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-4 pb-12">
          <div className="rounded-[28px] bg-[#111827] p-6 text-white sm:p-8">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-semibold">Ready to set up an AMC or monthly IT plan?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Book the same quick flow used for CCTV and IT support. The operations team can then assign a technician and track the order from admin.
                </p>
              </div>
              <Link href="/book/managed-it-services" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-[#111827]">
                Start Booking <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <HomepageFooter />
    </div>
  );
}
