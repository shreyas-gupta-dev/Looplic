"use client";

import { ChevronDown, ChevronRight, Laptop, Smartphone, Shield, Clock, Wrench, Monitor, Battery, Zap, Cpu, Volume2, Camera } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { DeviceSearchBox } from "@/src/components/next/DeviceSearchBox";
import type { CatalogBrand, SearchModel, SearchSeries } from "@/src/lib/data/catalog";

type ServiceLandingPageProps = {
  serviceType: "mobile-repair" | "laptop-repair";
  brands: CatalogBrand[];
  searchSeries: SearchSeries[];
  searchModels: SearchModel[];
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

const repairTypes = [
  { icon: Monitor, label: "Screen Repair", description: "Cracked or broken display" },
  { icon: Battery, label: "Battery Replacement", description: "Weak or dead battery" },
  { icon: Zap, label: "Charging Port", description: "Loose or faulty port" },
  { icon: Cpu, label: "Motherboard", description: "Complex board-level repair" },
  { icon: Volume2, label: "Speaker/Mic", description: "Audio issues fixed" },
  { icon: Camera, label: "Camera Repair", description: "Front or rear camera" },
];

const howItWorksSteps = [
  { step: "1", title: "Select Your Device", description: "Choose your brand & model from our catalog" },
  { step: "2", title: "Pick a Repair", description: "Select the issue you're facing with your device" },
  { step: "3", title: "Book a Slot", description: "Choose a convenient time for doorstep visit" },
  { step: "4", title: "Get It Fixed", description: "Our expert technician repairs it at your location" },
];

const trustSignals = [
  { icon: Shield, title: "6 Month Warranty", description: "On all repairs performed" },
  { icon: Wrench, title: "Expert Technicians", description: "Certified & experienced professionals" },
  { icon: Clock, title: "30 Min Service", description: "Most repairs completed on spot" },
];

export function ServiceLandingPage({
  serviceType,
  brands,
  searchSeries,
  searchModels,
  eyebrow,
  heroTitle,
  heroDescription,
  searchPlaceholder,
}: ServiceLandingPageProps) {
  const config = serviceConfig[serviceType];
  const [showAll, setShowAll] = useState(false);
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

  return (
    <>
      {/* Hero Section */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          {eyebrow && (
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-green-600">
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

      {/* Repair Types */}
      <section className="border-t border-gray-100 bg-gray-50 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900">What needs fixing?</h2>
          <p className="mt-2 text-center text-sm text-gray-500">Select the repair type for your device</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {repairTypes.map((repair) => {
              const Icon = repair.icon;
              return (
                <div
                  key={repair.label}
                  className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-5 text-center transition-shadow hover:shadow-md"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-50">
                    <Icon className="size-6 text-green-600" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-gray-900">{repair.label}</h3>
                  <p className="mt-1 text-xs text-gray-500">{repair.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand Picker */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{config.brandLabel}</h2>
              <p className="mt-1 text-sm text-gray-500">Tap a brand to explore models & repairs</p>
            </div>
            <Link href={config.allHref} className="flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700">
              View All <ChevronRight className="size-4" />
            </Link>
          </div>

          {heroBrands.length > 0 ? (
            <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8">
              {heroBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/service/${serviceType}/brands/${brand.slug}`}
                  className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-green-300 hover:shadow-sm"
                >
                  <BrandLogo
                    name={brand.name}
                    imageUrl={brand.image_url}
                    letter={brand.letter}
                    gradient={brand.gradient}
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
                  className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-green-300 hover:shadow-sm"
                >
                  <BrandLogo
                    name={brand.name}
                    imageUrl={brand.image_url}
                    letter={brand.letter}
                    gradient={brand.gradient}
                    className="size-9 rounded-lg object-contain"
                    fallbackClassName="size-9 rounded-lg"
                  />
                  <span className="text-xs font-medium text-gray-700">{brand.name}</span>
                </Link>
              ))}

              {hasMore && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white p-3 transition-all hover:border-green-400 hover:bg-green-50"
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
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-2 text-center text-sm text-gray-500">Get your device repaired in 4 simple steps</p>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-4 text-sm font-bold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900">Why Choose Looplic?</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {trustSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <div key={signal.title} className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-6 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-green-50">
                    <Icon className="size-7 text-green-600" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900">{signal.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{signal.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
