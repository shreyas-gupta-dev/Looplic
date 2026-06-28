import { ArrowUpRight, Camera, HardDrive, Network, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import Link from "next/link";

import { buildCctvBrandSelectionHref } from "@/src/lib/cctv-booking";

const cctvServiceChoices = [
  {
    title: "New CCTV Installation",
    description: "For homes, shops, offices, apartments, and commercial spaces.",
    badge: "INSTALL",
    href: buildCctvBrandSelectionHref("new_installation"),
    icon: Camera,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
  },
  {
    title: "CCTV Repair & Service",
    description: "Camera not working, DVR issue, wiring issue, or display problem.",
    badge: "REPAIR",
    href: buildCctvBrandSelectionHref("repair_service"),
    icon: Wifi,
    iconColor: "text-sky-500",
    iconBg: "bg-sky-50",
  },
  {
    title: "CCTV Upgrade",
    description: "Upgrade old cameras to HD/IP cameras with better clarity.",
    badge: "UPGRADE",
    href: buildCctvBrandSelectionHref("upgrade"),
    icon: HardDrive,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-50",
  },
  {
    title: "CCTV Relocation",
    description: "Shift existing CCTV setup to a new place or better angle.",
    badge: "RELOCATE",
    href: buildCctvBrandSelectionHref("relocation"),
    icon: Network,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
  },
  {
    title: "CCTV AMC / Maintenance",
    description: "Regular checkup and support for businesses and apartments.",
    badge: "AMC",
    href: buildCctvBrandSelectionHref("amc_maintenance"),
    icon: ShieldCheck,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-50",
  },
  {
    title: "CCTV Brand Support",
    description: "Choose Hikvision, CP Plus, Dahua, Godrej, EZVIZ, TP-Link Tapo, or not sure.",
    badge: "BRAND",
    href: buildCctvBrandSelectionHref(),
    icon: Smartphone,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-50",
  },
] as const;

export function CctvChooseServiceSection({ className = "container mx-auto max-w-3xl px-4 pb-6 pt-12" }: { className?: string }) {
  return (
    <section className={className}>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-1 w-6 rounded-full bg-[#00B4D8]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#00B4D8]">Choose Service</span>
        </div>
        <h2 className="text-2xl font-semibold text-[#111827]">What CCTV service do you need?</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {cctvServiceChoices.map((service) => {
          const Icon = service.icon;

          return (
            <Link
              key={service.title}
              href={service.href}
              className="group relative block rounded-[20px] border border-gray-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:rounded-3xl sm:p-5"
            >
              <div
                className="absolute inset-0 rounded-3xl opacity-[0.03]"
                style={{
                  backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <div className="relative z-10">
                <div className="mb-4 flex items-start justify-between sm:mb-8">
                  <div className={`flex size-10 items-center justify-center rounded-xl sm:size-12 sm:rounded-2xl ${service.iconBg}`}>
                    <Icon className={`size-5 sm:size-6 ${service.iconColor}`} />
                  </div>
                  <ArrowUpRight className="size-4 text-gray-400 transition-colors group-hover:text-gray-900 sm:size-5" />
                </div>

                <h3 className="mb-1 text-[14px] font-semibold leading-tight text-gray-900 sm:text-[17px] sm:leading-normal">{service.title}</h3>
                <p className="mb-4 text-[11px] leading-snug text-gray-500 sm:mb-6 sm:text-[13px] sm:leading-relaxed">{service.description}</p>

                <div className="inline-block rounded-full border border-gray-100 bg-gray-50 px-2 py-1 sm:px-3 sm:py-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-gray-600 sm:text-[10px]">{service.badge}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
