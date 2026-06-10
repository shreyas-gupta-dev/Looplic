import type { Metadata } from "next";
import { Cable, Cpu, HardDrive, MonitorCheck, Settings, ShieldCheck } from "lucide-react";

import { SimpleServiceDetailPage } from "@/src/components/next/SimpleServiceDetailPage";
import { buildPageMetadata } from "@/src/lib/metadata";
import { ServiceJsonLd } from "@/src/components/seo/ServiceJsonLd";

export const metadata: Metadata = buildPageMetadata({
  title: "Desktop Assembly and Custom PC Build Service",
  description: "Book desktop assembly, custom PC build, component installation, cable management, BIOS setup, Windows installation, and performance testing at your doorstep.",
  pathname: "/service/desktop-assembly",
  keywords: ["desktop assembly", "custom PC build", "PC assembly Bangalore", "gaming PC build", "desktop installation"],
});

export default function DesktopAssemblyPage() {
  return (
    <>
      <ServiceJsonLd
        name="Desktop Assembly"
        description="Custom PC build, desktop assembly, component installation, cable management, operating system setup, and performance testing."
        path="/service/desktop-assembly"
        serviceType="Desktop assembly"
      />
      <SimpleServiceDetailPage
        eyebrow="Desktop Assembly"
        title="Custom PC build and desktop setup at your doorstep."
        description="Get a clean, tested desktop build for gaming, office, design, editing, or workstation use. We handle assembly, cabling, installation, boot checks, and handover."
        bookingHref="/book/desktop-assembly"
        ctaLabel="Book Desktop Assembly"
        highlights={["Component-safe installation", "Clean cable management", "BIOS, OS, and driver setup", "Thermal and boot testing"]}
        services={[
          { title: "Custom PC build", text: "Motherboard, CPU, RAM, SSD, GPU, PSU, cabinet, and cooling assembled with proper fit checks.", icon: Cpu },
          { title: "Cable management", text: "Neat internal routing for airflow, serviceability, and a cleaner final build.", icon: Cable },
          { title: "Storage setup", text: "SSD/HDD mounting, partition planning, Windows-ready configuration, and drive checks.", icon: HardDrive },
          { title: "Display and peripherals", text: "Monitor, keyboard, mouse, printer, and accessory setup after the build is ready.", icon: MonitorCheck },
          { title: "Software setup", text: "Windows, drivers, BIOS basics, productivity software, and essential utilities.", icon: Settings },
          { title: "Final testing", text: "Boot, temperature, ports, display output, and stability checks before handover.", icon: ShieldCheck },
        ]}
        workflow={["Share your parts list or use our pre-check before visit.", "Technician assembles and tests the full desktop setup.", "We install essentials and verify ports, display, network, and boot.", "You receive a clean handover with notes for upgrades or care."]}
      />
    </>
  );
}
