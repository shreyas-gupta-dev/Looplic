import type { Metadata } from "next";
import { Cloud, Laptop, Network, Printer, Settings, ShieldCheck } from "lucide-react";

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
