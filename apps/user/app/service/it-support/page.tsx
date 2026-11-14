import type { Metadata } from "next";
import { Cloud, Laptop, Network, Printer, Settings, ShieldCheck, Database, ArrowRight } from "lucide-react";
import Link from "next/link";

import { ServiceJsonLd } from "@/src/components/seo/ServiceJsonLd";
import { SimpleServiceDetailPage } from "@/src/components/next/SimpleServiceDetailPage";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "IT Support for Home and Office",
  description: "Book IT support for Windows setup, software installation, printer setup, WiFi troubleshooting, network configuration, cloud setup, and system maintenance.",
  pathname: "/service/it-support",
  keywords: ["IT support", "computer support Bangalore", "software installation", "WiFi troubleshooting", "printer setup"],
});

export default function ItSupportPage() {
  return (
    <>
      <ServiceJsonLd
        name="IT Support"
        description="Doorstep IT support for system setup, software installation, WiFi troubleshooting, printer setup, cloud setup, and maintenance."
        path="/service/it-support"
        serviceType="IT support"
      />
      <SimpleServiceDetailPage
        eyebrow="IT Support"
        title="Fast IT help for devices, software, printers, and networks."
        description="Get practical support for home users, freelancers, and small offices: setup, troubleshooting, maintenance, and handover without confusing technical back-and-forth."
        bookingHref="/book/it-support"
        ctaLabel="Book IT Support"
        afterHeroContent={
          <section className="container mx-auto max-w-5xl px-4 pt-6">
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 sm:flex-row sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
                  <Database className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 sm:text-base">
                    Looking for Hard Drive or SSD Data Recovery?
                  </div>
                  <p className="text-xs text-slate-600 sm:text-sm">
                    Visit our dedicated ISO-standard lab portal for cleanroom recovery, clicking drive triage, and free doorstep pickup.
                  </p>
                </div>
              </div>
              <Link
                href="/data-recovery"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 sm:text-sm"
              >
                Go to Data Recovery Lab <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>
        }
        highlights={["On-site setup and troubleshooting", "WiFi, printer, and software support", "Cloud and backup basics", "Maintenance for office systems"]}
        services={[
          { title: "Laptop/Desktop support", text: "Performance checks, OS issues, driver problems, startup errors, and basic maintenance.", icon: Laptop },
          { title: "Software installation", text: "Install productivity tools, utilities, antivirus, drivers, and required office apps.", icon: Settings },
          { title: "WiFi troubleshooting", text: "Router, signal, speed, device connection, and basic network configuration support.", icon: Network },
          { title: "Printer setup", text: "USB, WiFi, shared printer setup, driver installation, and print test checks.", icon: Printer },
          { title: "Cloud and backup", text: "Basic Google Drive, OneDrive, data backup, account sync, and recovery planning.", icon: Cloud },
          { title: "Security basics", text: "Antivirus, updates, account hygiene, browser cleanup, and basic cybersecurity guidance.", icon: ShieldCheck },
        ]}
        workflow={["Book the issue and preferred time slot.", "Technician checks the system, network, or software problem.", "The fix is completed with setup and functional testing.", "You receive simple next-step guidance for avoiding repeat issues."]}
      />
    </>
  );
}
