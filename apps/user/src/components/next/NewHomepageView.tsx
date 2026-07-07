"use client";

import { ArrowRight, ArrowUpRight, Camera, CheckCircle, Clock, Cpu, IndianRupee, Laptop, LifeBuoy, ServerCog, Shield, Smartphone } from "lucide-react";
import Link from "next/link";
import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { RepairSellToggle } from "@/src/components/next/RepairSellToggle";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { DeviceSearchBox } from "@/src/components/next/DeviceSearchBox";
import { TrustSignals } from "@/src/components/next/TrustSignals";
import type { CatalogBrand, SearchModel, SearchSeries } from "@/src/lib/data/catalog";

const services = [
  {
    id: "screen-guard",
    title: "Screen Guard",
    description: "Doorstep tempered glass install",
    badge: "FROM ₹99",
    href: "/service/mobile-repair",
    icon: Shield,
    iconColor: "text-teal-500",
    iconBg: "bg-teal-50",
  },
  {
    id: "mobile-repair",
    title: "Mobile Repair",
    description: "Screen, battery & charging fixes",
    badge: "SAME DAY",
    href: "/service/mobile-repair",
    icon: Smartphone,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
  },
  {
    id: "laptop-repair",
    title: "Laptop Repair",
    description: "Hinge, keyboard, SSD & more",
    badge: "PICKUP",
    href: "/service/laptop-repair",
    icon: Laptop,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-50",
  },
  {
    id: "desktop-assembly",
    title: "Desktop Assembly",
    description: "Custom PC build & wiring",
    badge: "CUSTOM",
    href: "/service/desktop-assembly",
    icon: Cpu,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-50",
  },
  {
    id: "cctv",
    title: "CCTV",
    description: "Installation & surveillance setup",
    badge: "INSTALL",
    href: "/service/cctv",
    icon: Camera,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
  },
  {
    id: "it-support",
    title: "IT Support",
    description: "OS, software & network setup",
    badge: "REMOTE",
    href: "/service/it-support",
    icon: LifeBuoy,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
  },
  {
    id: "managed-it-services",
    title: "Managed IT Services",
    description: "Monthly IT care for businesses",
    badge: "B2B",
    href: "/service/managed-it-services",
    icon: ServerCog,
    iconColor: "text-sky-500",
    iconBg: "bg-sky-50",
  },
];

const recommendedMobileServices = [
  {
    title: "Cracked Screen Fix",
    description: "OEM display replacement",
    badge: "POPULAR",
    href: "/service/mobile-repair",
  },
  {
    title: "Battery Replacement",
    description: "Fast battery health restore",
    badge: "FAST",
    href: "/service/mobile-repair",
  },
  {
    title: "Charging Port Repair",
    description: "Fix slow or loose charging",
    badge: "COMMON",
    href: "/service/mobile-repair",
  },
  {
    title: "Water Damage Check",
    description: "Inspection, cleaning & quote",
    badge: "INSPECT",
    href: "/service/mobile-repair",
  },
];

export function NewHomepageView({
  searchBrands,
  searchSeries,
  searchModels,
}: {
  brands: CatalogBrand[];
  searchBrands: CatalogBrand[];
  searchSeries: SearchSeries[];
  searchModels: SearchModel[];
  heroTitle?: string;
  heroDescription?: string;
  heroEyebrow?: string;
  heroBrowseHref?: string;
  heroSearchPlaceholder?: string;
  currentAreaSlug?: string;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <HomepageNavbar />
      
      {/* Hero Section */}
      <section className="bg-[#EEF4F8] pt-6 pb-8 px-4 sm:pt-8 sm:pb-10">
        <div className="container max-w-2xl mx-auto text-center">
          <RepairSellToggle active="repair" />
          <h1 className="mt-7 text-[24px] sm:text-[28px] md:text-[44px] font-semibold text-[#111827] leading-[1.05] tracking-tight max-w-[21rem] sm:max-w-xl mx-auto">
            <span className="block">Doorstep Mobile Repair &</span>
            <span className="block">
              <span className="bg-gradient-to-r from-[#0096FF] to-[#00D28E] bg-clip-text text-transparent">Screen Guard Installation</span> in 30 Minutes
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-gray-500 sm:text-[15px]">
            Tempered glass, screen replacement, battery & laptop repair — at your home. From ₹99.
          </p>
          <div className="max-w-xl mx-auto rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1.5 flex items-center mt-6">
            {/* We use DeviceSearchBox but override its wrapper style if possible, or just wrap it.
                Since DeviceSearchBox renders its own relative div, we might need to modify DeviceSearchBox 
                to support styling, but for now we'll let it render inside this container and adjust its internal styling later if needed. */}
             <div className="w-full search-wrapper">
               <DeviceSearchBox
                placeholder="Search e.g. Mi Note 13 Pro, iPhone 15..."
                browseHref="/service/mobile-repair/brands"
                brands={searchBrands}
                series={searchSeries}
                models={searchModels}
                mode="mobile-repair"
              />
             </div>
          </div>
        </div>
      </section>


      {/* Services Section */}
      <section className="pt-12 pb-6 px-4 container max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-6 bg-[#00B4D8] rounded-full"></div>
            <span className="text-xs font-bold text-[#00B4D8] tracking-widest uppercase">
              Pick a Service
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-[#111827]">
            What do you need help with?
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.id}
                href={service.href}
                className="group relative block rounded-[20px] sm:rounded-3xl border border-gray-200 bg-white p-3 sm:p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
              >
                {/* Grid Pattern Background */}
                <div 
                  className="absolute inset-0 opacity-[0.03] rounded-3xl"
                  style={{
                    backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4 sm:mb-8">
                    <div className={`flex size-10 sm:size-12 items-center justify-center rounded-xl sm:rounded-2xl ${service.iconBg}`}>
                      <Icon className={`size-5 sm:size-6 ${service.iconColor}`} />
                    </div>
                    <ArrowUpRight className="size-4 sm:size-5 text-gray-400 transition-colors group-hover:text-gray-900" />
                  </div>
                  
                  <h3 className="text-[14px] sm:text-[17px] font-semibold text-gray-900 mb-1 leading-tight sm:leading-normal">
                    {service.title}
                  </h3>
                  <p className="text-[11px] sm:text-[13px] text-gray-500 mb-4 sm:mb-6 leading-snug sm:leading-relaxed">
                    {service.description}
                  </p>
                  
                  <div className="inline-block rounded-full bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-100">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                      {service.badge}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recommended Section */}
      <section className="py-6 px-4 container max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-6 bg-[#0096FF] rounded-full"></div>
            <span className="text-xs font-bold text-[#0096FF] tracking-widest uppercase">
              RECOMMENDED
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-[#111827]">
            Popular near you
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {recommendedMobileServices.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className="group relative block rounded-[20px] sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="flex size-10 sm:size-12 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <Smartphone className="size-5 sm:size-6 text-orange-500" />
                  </div>
                  <div className="rounded-full bg-blue-100 px-2 sm:px-3 py-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                      {service.badge}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-[14px] sm:text-[16px] font-semibold text-gray-900 mb-1 leading-tight sm:leading-normal">
                    {service.title}
                  </h3>
                  <p className="text-[11px] sm:text-[13px] text-gray-500 mb-4 sm:mb-6 leading-snug sm:leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    BOOK NOW
                  </span>
                  <ArrowUpRight className="size-4 sm:size-5 text-gray-400 transition-colors group-hover:text-gray-900" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Services Section */}
      <section className="py-12 px-4 container max-w-[1200px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-6 bg-[#00B4D8] rounded-full"></div>
            <span className="text-xs font-bold text-[#0096FF] tracking-widest uppercase">
              TOP SERVICES
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-[#111827]">
            Book your fix in 60 seconds
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Mobile Repair */}
          <div className="rounded-[20px] md:rounded-3xl p-5 md:p-6 flex flex-col bg-gradient-to-br from-orange-50/80 to-red-50/40 border border-orange-100/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <Smartphone className="size-5 text-orange-400" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 tracking-widest uppercase">Mobile Repair</span>
            </div>
            
            <h3 className="text-[18px] sm:text-[20px] font-semibold text-gray-900 mb-2 leading-tight">
              Cracked Screen? Dead Battery? Fixed Today.
            </h3>
            
            <p className="text-[13px] sm:text-[14px] text-gray-500 mb-5 leading-relaxed">
              OEM parts, certified technicians, and a 6-month warranty on every repair.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6 mt-auto">
              <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5 border border-white">
                <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-gray-400" />
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-600">Same-day fix</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5 border border-white">
                <CheckCircle className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-gray-400" />
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-600">6-mo warranty</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5 border border-white">
                <IndianRupee className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-gray-400" />
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-600">Free pickup</span>
              </div>
            </div>
            
            <Link href="/service/mobile-repair" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0096FF] to-[#00D28E] px-5 py-2.5 sm:px-6 sm:py-3 text-[12px] sm:text-[13px] font-bold text-white transition-all hover:opacity-90 self-start shadow-sm shadow-blue-500/20">
              Get Free Quote <ArrowRight className="size-3.5 sm:size-4" />
            </Link>
          </div>

          {/* Card 2: Laptop Repair */}
          <div className="rounded-[20px] md:rounded-3xl p-5 md:p-6 flex flex-col bg-gradient-to-br from-purple-50/80 to-fuchsia-50/40 border border-purple-200/70 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <Laptop className="size-5 text-purple-400" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 tracking-widest uppercase">Laptop Repair</span>
            </div>
            
            <h3 className="text-[18px] sm:text-[20px] font-semibold text-gray-900 mb-2 leading-tight">
              Slow Laptop? Hinge Broken? We Pick & Drop.
            </h3>
            
            <p className="text-[13px] sm:text-[14px] text-gray-500 mb-5 leading-relaxed">
              SSD upgrades, keyboard, motherboard & display repair with no fix-no fee.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6 mt-auto">
              <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5 border border-white">
                <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-gray-400" />
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-600">Free pickup</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5 border border-white">
                <CheckCircle className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-gray-400" />
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-600">No fix, no fee</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5 border border-white">
                <IndianRupee className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-gray-400" />
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-600">All brands</span>
              </div>
            </div>
            
            <Link href="/service/laptop-repair" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0096FF] to-[#00D28E] px-5 py-2.5 sm:px-6 sm:py-3 text-[12px] sm:text-[13px] font-bold text-white transition-all hover:opacity-90 self-start shadow-sm shadow-blue-500/20">
              Schedule Pickup <ArrowRight className="size-3.5 sm:size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Basic styles to override DeviceSearchBox to match rounded pill design */}
      <style dangerouslySetInnerHTML={{ __html: `
        .search-wrapper .relative { margin-top: 0; padding: 0; }
        .search-wrapper form {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          border-radius: 9999px !important;
        }
        .search-wrapper input {
          font-size: 15px;
          padding: 12px 4px;
        }
        .search-wrapper button {
          background: linear-gradient(to right, #0096FF, #00D28E) !important;
          border-radius: 9999px !important;
          padding: 10px !important;
          margin-right: 2px !important;
        }
      `}} />
      <TrustSignals />
      <HomepageFooter />
    </div>
  );
}
