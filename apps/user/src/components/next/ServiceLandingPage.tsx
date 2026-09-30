"use client";

import { ChevronDown, ChevronRight, Laptop, Smartphone, Shield, Clock, Wrench, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { DeviceSearchBox } from "@/src/components/next/DeviceSearchBox";
import type { CatalogBrand, RepairCategory, SearchModel, SearchSeries } from "@/src/lib/data/catalog";
import { repairCategoryHint, repairCategoryIcon, withRepairSelection } from "@/src/lib/repair-selection";

type ServiceLandingPageProps = {
  serviceType: "mobile-repair" | "laptop-repair";
  brands: CatalogBrand[];
  searchSeries: SearchSeries[];
  searchModels: SearchModel[];
  /**
   * Real repair categories for this service type. Drives the "What needs fixing?"
   * tiles, so they always match what the booking flow can actually offer.
   */
  repairCategories?: RepairCategory[];
  eyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  searchPlaceholder?: string;
};

const serviceConfig = {
  "mobile-repair": {
    title: "Mobile Phone Repair at Your Doorstep",
    subtitle: "Expert mobile repair service at your location",
    searchPlaceholder: "Search your phone model...",
    brandLabel: "Select Your Brand",
    allHref: "/service/mobile-repair/brands",
    icon: Smartphone,
  },
  "laptop-repair": {
    title: "Laptop Repair at Your Doorstep",
    subtitle: "Professional laptop repair at your doorstep",
    searchPlaceholder: "Search your laptop model...",
    brandLabel: "Select Your Brand",
    allHref: "/service/laptop-repair/brands",
    icon: Laptop,
  },
} as const;

// How many repair tiles to show before "View all repairs".
const VISIBLE_REPAIR_TILES = 6;

const howItWorksSteps = [
  { step: "1", title: "Select Your Device", description: "Choose your brand & model from our catalog" },
  { step: "2", title: "Pick a Repair", description: "Select the issue you're facing with your device" },
  { step: "3", title: "Book a Slot", description: "Choose a convenient time for doorstep visit" },
  { step: "4", title: "Get It Fixed", description: "Our expert technician repairs it at your location" },
];

const trustSignals = [
  { icon: Video, title: "Live CCTV Repair Stream", description: "Watch your device repair live in real time via secure shop camera access" },
  { icon: Shield, title: "6 Month Warranty", description: "On all genuine parts & repairs performed" },
  { icon: Wrench, title: "Expert Technicians", description: "Certified & background-verified professionals" },
  { icon: Clock, title: "Doorstep & Workshop", description: "Fast turnaround with live tracking at every step" },
];

export function ServiceLandingPage({
  serviceType,
  brands,
  searchSeries,
  searchModels,
  repairCategories = [],
  eyebrow,
  heroTitle,
  heroDescription,
  searchPlaceholder,
}: ServiceLandingPageProps) {
  const config = serviceConfig[serviceType];
  const [showAll, setShowAll] = useState(false);
  const [showAllRepairs, setShowAllRepairs] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth >= 768) {
        setVisibleCount(15);
        return;
      }
      if (window.innerWidth >= 640) {
        setVisibleCount(12);
        return;
      }
      setVisibleCount(9);
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const heroBrands = brands.slice(0, 8);
  const moreBrandsData = brands.slice(8);
  const hasMore = moreBrandsData.length > visibleCount;
  const displayedBrands = showAll ? moreBrandsData : moreBrandsData.slice(0, hasMore ? visibleCount - 1 : visibleCount);

  const visibleRepairs = showAllRepairs ? repairCategories : repairCategories.slice(0, VISIBLE_REPAIR_TILES);
  const hasMoreRepairs = repairCategories.length > VISIBLE_REPAIR_TILES;

  return (
    <>
      {/* Hero Section */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          {eyebrow && (
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-600">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl lg:text-5xl">
            {heroTitle ?? config.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
            {heroDescription ?? config.subtitle}
          </p>

          <div className="mx-auto mt-8 max-w-lg">
            <DeviceSearchBox
              placeholder={searchPlaceholder ?? config.searchPlaceholder}
              browseHref={config.allHref}
              brands={brands}
              series={searchSeries}
              models={searchModels}
              mode={serviceType}
            />
          </div>
        </div>
      </section>

      {/* Repair Types — real repair categories, each a link that carries the
          selection into the booking flow. */}
      {repairCategories.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50 py-12 md:py-16">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-gray-900">What needs fixing?</h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Pick the issue and we will take you straight to your device
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {visibleRepairs.map((category) => {
                const Icon = repairCategoryIcon(category.name);
                return (
                  <li key={category.id}>
                    <Link
                      href={withRepairSelection(config.allHref, category.id)}
                      aria-label={`${category.name} — choose your device`}
                      className="flex h-full flex-col items-center rounded-lg border border-gray-200 bg-white p-5 text-center transition-shadow hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                    >
                      <div className="flex size-12 items-center justify-center rounded-full bg-brand-50">
                        <Icon className="size-6 text-brand-600" aria-hidden="true" />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-gray-900">{category.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">{repairCategoryHint(category.name)}</p>
                    </Link>
                  </li>
                );
              })}

              {hasMoreRepairs && !showAllRepairs && (
                <li>
                  <button
                    type="button"
                    onClick={() => setShowAllRepairs(true)}
                    className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-5 text-center transition-colors hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-gray-100">
                      <ChevronDown className="size-6 text-gray-500" aria-hidden="true" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900">
                      {repairCategories.length - VISIBLE_REPAIR_TILES} more
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">Show all repair types</p>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </section>
      )}

      {/* Brand Picker */}
      <section className="bg-white py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{config.brandLabel}</h2>
              <p className="mt-1 text-sm text-gray-500">Tap a brand to explore models & repairs</p>
            </div>
            <Link href={config.allHref} className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              View All <ChevronRight className="size-4" />
            </Link>
          </div>

          {heroBrands.length > 0 ? (
            <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8">
              {heroBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/service/${serviceType}/brands/${brand.slug}`}
                  className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-sm"
                >
                  <BrandLogo
                    name={brand.name}
                    imageUrl={brand.image_url}
                    letter={brand.letter}
                    gradient={brand.gradient}
                    slug={brand.slug}
                    className="size-10 rounded-lg object-contain"
                    fallbackClassName="size-10 rounded-lg"
                  />
                  <span className="text-xs font-semibold text-gray-700">{brand.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 py-4 text-center text-sm text-gray-500">No brands available yet</p>
          )}

          {/* More Brands */}
          {moreBrandsData.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {displayedBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/service/${serviceType}/brands/${brand.slug}`}
                  className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-brand-300 hover:shadow-sm"
                >
                  <BrandLogo
                    name={brand.name}
                    imageUrl={brand.image_url}
                    letter={brand.letter}
                    gradient={brand.gradient}
                    slug={brand.slug}
                    className="size-9 rounded-lg object-contain"
                    fallbackClassName="size-9 rounded-lg"
                  />
                  <span className="text-xs font-medium text-gray-700">{brand.name}</span>
                </Link>
              ))}

              {hasMore && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white p-3 transition-all hover:border-brand-400 hover:bg-brand-50"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-gray-100">
                    <ChevronDown className="size-5 text-gray-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">Show More</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="border-t border-gray-100 bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-2 text-center text-sm text-gray-500">Get your device repaired in 4 simple steps</p>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-4 text-sm font-bold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live CCTV Feature Spotlight */}
      <section className="border-t border-gray-100 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-12 text-white md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-400">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                </span>
                Industry-First Live CCTV Streaming
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                100% Repair Transparency. <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Watch It Live.</span>
              </h2>
              <p className="mt-3 text-sm text-gray-300 sm:text-base">
                Never worry about your device data, privacy, or parts authenticity. While our technicians service your phone or laptop in the workshop, stream live CCTV footage directly on your mobile screen in real time.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <Link
                  href="/track"
                  className="inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
                >
                  <Video className="size-4" /> Track Order & Watch Live
                </Link>
                <Link
                  href="/about-us"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  How Live Stream Works
                </Link>
              </div>
            </div>
            <div className="relative flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl">
              <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
                <img src="/images/services/cctv.webp" alt="Live CCTV camera preview" className="size-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-md bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <span className="size-1.5 rounded-full bg-white animate-pulse" /> LIVE CCTV
                </div>
                <div className="absolute bottom-2.5 left-2.5 text-left">
                  <p className="text-xs font-bold text-white">Workshop Bay #3 — Precision Workstation</p>
                  <p className="text-[10px] text-gray-300">Customer device: Active Repair Stream</p>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">
                Encrypted end-to-end stream accessible only by the order owner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals — informational only, so deliberately no hover affordance:
          nothing here is clickable and it must not look like it is. */}
      <section className="bg-white py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-gray-900">Why Choose Looplic?</h2>
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <li key={signal.title} className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-6 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-brand-50">
                    <Icon className="size-7 text-brand-600" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900">{signal.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{signal.description}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
