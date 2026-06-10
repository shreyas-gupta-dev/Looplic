import type { Metadata } from "next";
import { Camera, HardDrive, Network, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import Link from "next/link";

import { ServiceJsonLd } from "@/src/components/seo/ServiceJsonLd";
import { CctvChooseServiceSection } from "@/src/components/next/CctvChooseServiceSection";
import { SimpleServiceDetailPage } from "@/src/components/next/SimpleServiceDetailPage";
import { cctvAreaLinks } from "@/src/lib/cctv-area-pages";
import { buildCctvBrandSelectionHref } from "@/src/lib/cctv-booking";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "CCTV Installation in Bangalore | Camera, DVR, NVR and Mobile Viewing Setup",
  description: "Book CCTV installation in Bangalore for camera installation, DVR/NVR setup, mobile viewing, network connection, security system checks, and troubleshooting.",
  pathname: "/service/cctv",
  keywords: ["CCTV installation Bangalore", "security camera setup", "DVR setup", "NVR installation", "CCTV camera installation", "IP camera installation", "CCTV troubleshooting"],
});

export default function CctvServicePage() {
  return (
    <>
      <ServiceJsonLd
        name="CCTV Installation in Bangalore"
        description="CCTV camera installation, DVR/NVR setup, camera placement, mobile viewing, network configuration, security checks, and troubleshooting."
        path="/service/cctv"
        serviceType="CCTV installation"
      />
      <SimpleServiceDetailPage
        eyebrow="CCTV Installation"
        title="CCTV installation and security camera setup for homes, shops, and offices."
        description="Get clean CCTV camera installation in Bangalore with camera placement planning, DVR/NVR setup, mobile viewing, network connection checks, and practical handover support."
        bookingHref={buildCctvBrandSelectionHref()}
        ctaLabel="Book CCTV Installation"
        highlights={["Camera installation", "DVR/NVR setup", "Mobile viewing", "Network and recording checks"]}
        highlightsPosition="afterHeroContent"
        afterHeroContent={<CctvChooseServiceSection />}
        introSections={[
          {
            title: "Planned camera coverage",
            text: "Looplic helps plan CCTV camera installation around entrances, counters, parking spaces, office floors, and blind spots so every camera has a useful purpose.",
          },
          {
            title: "Recorder and storage setup",
            text: "We configure DVR setup or NVR setup basics, channel checks, storage settings, and recording schedules so your security camera system is ready for daily use.",
          },
          {
            title: "Remote viewing ready",
            text: "Mobile viewing, LAN checks, router checks, and WiFi checks are handled during installation to improve live camera viewing and remote monitoring reliability.",
          },
        ]}
        coverageIntro="Our CCTV installation service coverage is designed for clean routing, reliable recording, useful camera angles, and a simple booking-to-handover experience."
        services={[
          { title: "Camera installation", text: "Indoor, outdoor, dome, bullet, and basic IP camera installation with clean routing.", icon: Camera },
          { title: "DVR/NVR setup", text: "Recorder setup, storage configuration, channel checks, and recording schedule basics.", icon: HardDrive },
          { title: "Mobile viewing", text: "App setup for live camera viewing and basic remote monitoring after installation.", icon: Smartphone },
          { title: "Network connection", text: "LAN, router, and WiFi checks for IP camera and remote viewing reliability.", icon: Network },
          { title: "Security system checks", text: "Camera angle, blind spot, playback, power, and cable checks before handover.", icon: ShieldCheck },
          { title: "Troubleshooting", text: "Fix offline cameras, no display, recording errors, and connectivity issues.", icon: Wifi },
        ]}
        workflow={["Select your CCTV service and brand.", "Share site details, address, preferred date, and time slot.", "Technician inspects camera points, cable route, network, and recorder needs.", "Installation, recorder setup, mobile app setup, playback checks, and handover are completed."]}
        closingTitle="Built for clean, reliable execution"
        closingText="Whether you need a new CCTV camera installation, DVR setup, NVR installation, mobile viewing setup, IP camera network connection, or CCTV troubleshooting, the service flow keeps the scope clear before the technician arrives."
        afterContent={
          <section className="container mx-auto max-w-5xl px-4 pb-12">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#0096FF]">Bangalore Areas</div>
              <h2 className="mt-2 text-2xl font-semibold text-[#111827]">CCTV installation areas in Bangalore</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Choose your Bangalore area to view a local CCTV installation page with area-specific planning details and a direct booking CTA.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {cctvAreaLinks.map((area) => (
                  <Link
                    key={area.href}
                    href={area.href}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-[#0096FF]/40 hover:text-[#0096FF]"
                  >
                    {area.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        }
      />
    </>
  );
}
