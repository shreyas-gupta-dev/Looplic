"use client";

import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  FileText,
  IndianRupee,
  Phone,
  Search,
  Shield,
  Star,
  Truck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useMemo } from "react";

import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { buildWhatsappLink } from "@/src/lib/whatsapp-links";
import type { CatalogBrand, SearchModel, SearchSeries } from "@/src/lib/data/catalog";
import type { FeaturedProduct } from "@/src/lib/data/products";

import { HeroBannerCarousel } from "@/src/components/next/HeroBannerCarousel";
import { DeviceSearchBox } from "@/src/components/next/DeviceSearchBox";
import { QuickBuybackCalculator } from "@/src/components/next/QuickBuybackCalculator";

// ─── Data (imported from separate module for better tree-shaking) ────────────
import {
  ourServices,
  sellCategories,
  refurbishedProducts,
  popularDevices,
  howItWorks,
  testimonials,
  trustStats,
} from "./homepage-data";
import type { HowItWorksIconKey } from "./homepage-data";

// Image slots live in the registry, not in the data module — see
// src/lib/images/registry.ts.
import {
  getSellCategoryImage,
  getServiceImage,
  productFallbackImage,
  renderableImageUrl,
} from "@/src/lib/images/registry";

// Icon map for howItWorks steps (keeps lucide dependency in the component only)
const howItWorksIconMap: Record<HowItWorksIconKey, typeof Search> = {
  search: Search,
  rupee: IndianRupee,
  truck: Truck,
  "credit-card": CreditCard,
};
// ─── Component ───────────────────────────────────────────────────────────────

export function NewHomepageView({
  brands,
  searchBrands,
  searchSeries,
  searchModels,
  featuredProducts = [],
}: {
  brands: CatalogBrand[];
  searchBrands: CatalogBrand[];
  searchSeries: SearchSeries[];
  searchModels: SearchModel[];
  featuredProducts?: FeaturedProduct[];
}) {
  const sellScrollRef = useRef<HTMLDivElement>(null);
  const buyScrollRef = useRef<HTMLDivElement>(null);
  const testimonialScrollRef = useRef<HTMLDivElement>(null);
  const [activeBrandTab, setActiveBrandTab] = useState<string>("all");

  const brandTabs = [
    { id: "all", label: "All Phones" },
    { id: "apple", label: "Apple" },
    { id: "samsung", label: "Samsung" },
    { id: "oneplus", label: "OnePlus" },
    { id: "google", label: "Google Pixel" },
    { id: "xiaomi", label: "Xiaomi" },
  ];

  const displayedRefurbished = useMemo(() => {
    if (!featuredProducts || featuredProducts.length === 0) return [];
    if (activeBrandTab === "all") return featuredProducts;
    return featuredProducts.filter((p) => p.brand.toLowerCase().includes(activeBrandTab));
  }, [featuredProducts, activeBrandTab]);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction === "right" ? 280 : -280, behavior: "smooth" });
    }
  };

  // Auto-scroll testimonials carousel
  useEffect(() => {
    const container = testimonialScrollRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScrollLeft - 10) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: 350, behavior: "smooth" });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbar />

      {/* ─── Hero Banner Carousel ──────────────────────────────────── */}
      <HeroBannerCarousel />

      {/* ─── Quick Search Bar ──────────────────────────────────────── */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 -mt-2 sm:-mt-3 mb-2 sm:mb-4">
        <div className="container mx-auto max-w-4xl lg:max-w-5xl">
          <div className="rounded-2xl border border-gray-200/90 bg-white/95 p-2 sm:p-2.5 shadow-lg backdrop-blur-md transition-shadow hover:shadow-xl">
            <DeviceSearchBox
              placeholder="Search your device e.g. iPhone 15, Galaxy S24, MacBook Air..."
              browseHref="/sell"
              brands={searchBrands}
              series={searchSeries}
              models={searchModels}
              mode="mobile-repair"
              className="mt-0 px-0"
            />
          </div>
        </div>
      </section>

      {/* ─── Instant Buyback Price Calculator (Cashify-style) ────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
        <div className="container mx-auto max-w-7xl">
          <QuickBuybackCalculator brands={brands} models={searchModels} />
        </div>
      </section>

      {/* ─── Our Services Grid (Icon-based, always renders) ────────── */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
              Our Services
            </h2>
            <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 sm:gap-5">
              {ourServices.map((svc) => {
                const image = getServiceImage(svc.id);
                return (
                  <div key={svc.id}>
                    <Link
                      href={svc.href}
                      className="group flex flex-col items-center gap-2.5 text-center"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-md">
                        {image ? (
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            className="object-contain p-2 transition-transform duration-200 group-hover:scale-110"
                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                          />
                        ) : null}
                      </div>
                      <span className="text-xs font-semibold text-gray-800 transition-colors group-hover:text-primary sm:text-sm">
                        {svc.label}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Sell Your Old Device (Icon-based horizontal scroll) ───── */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Sell Your Old Device Now</h2>
              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={() => scrollContainer(sellScrollRef, "left")}
                  className="flex size-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100"
                  aria-label="Scroll left"
                >
                  <ChevronRight className="size-4 rotate-180" />
                </button>
                <button
                  onClick={() => scrollContainer(sellScrollRef, "right")}
                  className="flex size-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div
              ref={sellScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-7 md:gap-4 md:overflow-visible md:pb-0"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {sellCategories.map((cat) => {
                const image = getSellCategoryImage(cat.id);
                return (
                  <Link
                    key={cat.id}
                    href={cat.href}
                    className="group flex w-[130px] shrink-0 flex-col items-center gap-2.5 sm:w-[150px] md:w-full"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-md">
                      {image ? (
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          className="object-contain p-2 transition-transform duration-200 group-hover:scale-110"
                          sizes="(max-width: 768px) 150px, 14vw"
                        />
                      ) : null}
                    </div>
                    <span className="text-center text-xs font-semibold text-gray-800 transition-colors group-hover:text-primary sm:text-sm">
                      {cat.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* ─── Buy Refurbished Devices (Interactive Brand Carousel) ── */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Buy Refurbished Devices</h2>
                <p className="mt-1 text-sm text-gray-500">Certified pre-owned phones with 32-point inspection & 6-month warranty</p>
              </div>
              <Link href="/buy" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View All {featuredProducts.length > 0 ? `(${featuredProducts.length}+)` : ""} <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* Brand Filter Tabs */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {brandTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveBrandTab(tab.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    activeBrandTab === tab.id
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              {/* Scroll arrow Left */}
              <button
                onClick={() => scrollContainer(buyScrollRef, "left")}
                className="absolute -left-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg sm:flex"
                aria-label="Scroll left"
              >
                <ArrowRight className="size-5 rotate-180 text-gray-600" />
              </button>

              <div
                ref={buyScrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {displayedRefurbished.length > 0 ? (
                  displayedRefurbished.map((product) => {
                    const discount = product.originalPrice > product.price
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : 0;

                    return (
                      <div key={product.id} className="w-[220px] shrink-0 sm:w-[240px]">
                        <Link
                          href={`/buy/${product.slug}`}
                          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
                        >
                          {/* Badges */}
                          <div className="flex items-center justify-between p-3 pb-0">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Shield className="size-3 text-emerald-600" /> ASSURED
                            </span>
                            {discount > 0 && (
                              <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {discount}% OFF
                              </span>
                            )}
                          </div>

                          {/* Product Image */}
                          <div className="relative mx-auto flex h-40 w-full items-center justify-center p-3">
                            {product.coverImageUrl ? (
                              <Image
                                src={product.coverImageUrl}
                                alt={product.name}
                                width={140}
                                height={140}
                                unoptimized={true}
                                className="size-32 object-contain transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="size-24 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                                Phone
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="mt-auto border-t border-gray-100 p-3.5">
                            <h3 className="line-clamp-2 text-xs font-semibold text-gray-900 group-hover:text-brand-600">
                              {product.name}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-gray-500">
                              {[product.storage, product.color].filter(Boolean).join(" • ")}
                            </p>
                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="text-base font-bold text-gray-900">
                                ₹{product.price.toLocaleString("en-IN")}
                              </span>
                              {product.originalPrice > product.price && (
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{product.originalPrice.toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                              <span className="capitalize font-medium text-emerald-600">{product.condition}</span>
                              <span>{product.warrantyMonths}mo Warranty</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  refurbishedProducts.map((product) => {
                    const image = productFallbackImage[product.deviceType];
                    return (
                      <div key={product.name} className="w-[200px] shrink-0 sm:w-[220px]">
                        <Link
                          href={product.href}
                          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
                        >
                          <div className="relative px-3 pt-3">
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              <Shield className="size-3" /> LOOPLIC ASSURED
                            </span>
                          </div>
                          <div className="relative mx-auto h-40 w-full p-4">
                            <Image
                              src={image.src}
                              alt={product.name}
                              fill
                              unoptimized={image.unoptimized}
                              className="object-contain transition-transform group-hover:scale-110"
                              sizes="240px"
                            />
                          </div>
                          <div className="border-t border-gray-100 px-4 py-3">
                            <p className="text-xs font-bold text-brand-600">{product.discount}</p>
                            <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900">
                              {product.name} - Refurbished
                            </h3>
                          </div>
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Scroll arrow Right */}
              <button
                onClick={() => scrollContainer(buyScrollRef, "right")}
                className="absolute -right-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg sm:flex"
                aria-label="Scroll right"
              >
                <ArrowRight className="size-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Top Brands (Using database brand images) ─────────────── */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Top Brands</h2>
              <p className="mt-2 text-gray-500">Get the best value for these popular brands</p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {brands.slice(0, 12).map((brand) => {
                // Only render logos from hosts we allow; the rest fall back to the
                // initial rather than throwing on an unconfigured next/image host.
                const logo = renderableImageUrl(brand.image_url);
                return (
                <div key={brand.id}>
                  <Link
                    href={`/sell/phone/${brand.slug}`}
                    className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40"
                  >
                    <div className="relative flex size-12 items-center justify-center overflow-hidden">
                      {logo ? (
                        <Image
                          src={logo}
                          alt={brand.name}
                          width={48}
                          height={48}
                          className="object-contain"
                          sizes="48px"
                          loading="lazy"
                          placeholder="empty"
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-400">{brand.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                      {brand.name}
                    </span>
                  </Link>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* ─── How It Works ─────────────────────────────────────────── */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">How It Works</h2>
              <p className="mt-2 text-gray-500">Sell your device in 4 simple steps</p>
            </div>

            <div className="relative grid gap-8 overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((step, idx) => {
                const Icon = howItWorksIconMap[step.icon];
                return (
                  <div key={step.step} className="relative">
                    {idx < howItWorks.length - 1 && (
                      <div className="absolute right-0 top-8 hidden h-0.5 w-[calc(100%-4rem)] translate-x-1/2 bg-gray-200 lg:block" />
                    )}
                    <div className={`relative mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl ${step.color} text-white shadow-lg`}>
                      <Icon className="size-7" />
                      <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900 shadow">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-gray-500">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Stats Bar ──────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-brand-50/50 py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {trustStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-primary sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Popular Devices (Brand image cards) ──────────────────── */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Popular Devices</h2>
                <p className="mt-1 text-gray-500">Top devices with best resale value</p>
              </div>
              <Link href="/sell" className="hidden items-center gap-1 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 sm:flex">
                View All <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {popularDevices.map((device) => {
                const image = productFallbackImage[device.deviceType];
                return (
                  <div key={device.name}>
                    <Link
                      href={device.href}
                      className="group flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
                    >
                      <div className="relative mb-3 h-24 w-full">
                        <Image
                          src={image.src}
                          alt={device.name}
                          fill
                          unoptimized={image.unoptimized}
                          className="object-contain transition-transform group-hover:scale-110"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      </div>
                      <h3 className="text-center text-sm font-semibold text-gray-900">{device.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">Get up to</p>
                      <span className="mt-0.5 text-lg font-bold text-primary">{device.price}</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center sm:hidden">
              <Link href="/sell" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                View All Devices <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ─── Testimonials (Horizontal Carousel) ─────────────────── */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Customer Stories</h2>
              <p className="mt-2 text-gray-500">Join thousands of satisfied customers in Bangalore</p>
            </div>

            <div
              ref={testimonialScrollRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="w-[300px] shrink-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:w-[340px]"
                >
                  <div className="mb-3 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Book on WhatsApp CTA ─────────────────────────────── */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Book a Service on WhatsApp
              </h2>
              <p className="mt-3 max-w-md text-base text-white/80">
                Mobile repair, laptop repair, CCTV installation, or sell your old device — chat with us on WhatsApp for instant booking. No app needed.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                <a
                  href={buildWhatsappLink({ service: "support" })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-gray-900 shadow transition-transform hover:scale-105"
                >
                  <svg viewBox="0 0 24 24" className="size-5 fill-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
                <a
                  href="tel:+918884445924"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  <Phone className="size-4" />
                  Call Us
                </a>
              </div>
            </div>
            <div className="relative size-48 md:size-56">
              <Image
                src="/looplic-logo.webp"
                alt="Looplic"
                fill
                className="rounded-3xl object-contain"
                sizes="224px"
                loading="lazy"
                placeholder="empty"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Choose Looplic (6 Trust Badges) ─────────────────── */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Why Choose Looplic?
          </h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-brand-50">
                <IndianRupee className="size-7 text-brand-600" />
              </div>
              <h3 className="font-bold text-gray-900">Best Prices</h3>
              <p className="mt-2 text-sm text-gray-500">AI-powered pricing ensures you get the maximum value for your device</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-blue-50">
                <CreditCard className="size-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Instant Payment</h3>
              <p className="mt-2 text-sm text-gray-500">Get paid instantly via UPI, bank transfer or cash at the time of pickup</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-purple-50">
                <Search className="size-7 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900">Simple & Convenient</h3>
              <p className="mt-2 text-sm text-gray-500">Check price, schedule pickup & get paid — all from your home</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-orange-50">
                <Truck className="size-7 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900">Free Doorstep Pickup</h3>
              <p className="mt-2 text-sm text-gray-500">No fees for pickup. Our executive comes to your doorstep</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-red-50">
                <Shield className="size-7 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">Factory Grade Data Wipe</h3>
              <p className="mt-2 text-sm text-gray-500">100% certified data wipe. Your personal data is completely safe</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-brandteal-50">
                <FileText className="size-7 text-brandteal-600" />
              </div>
              <h3 className="font-bold text-gray-900">Valid Purchase Invoice</h3>
              <p className="mt-2 text-sm text-gray-500">Get a genuine bill of sale for every transaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQs ───────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {[
              { q: "How do I sell my old phone on Looplic?", a: "Simply select your phone's brand and model, answer a few condition-related questions, confirm the quote, and book a free doorstep pickup. Your phone will be picked up and payment will be made instantly." },
              { q: "Is doorstep pickup really free?", a: "Yes! Looplic offers 100% free doorstep pickup in Bangalore. There are no hidden charges for pickup or inspection." },
              { q: "How quickly will I get paid?", a: "You get paid instantly at the time of pickup via UPI, bank transfer, or cash. No delays, no waiting." },
              { q: "Can I sell a phone with a broken screen or damage?", a: "Yes, we accept phones in all conditions — working, not working, broken screen, water damage, or any other issue. You'll still get a fair price based on the condition." },
              { q: "Is my data safe when I sell my phone?", a: "Absolutely. We perform a factory-grade certified data wipe on every device. Your personal data is completely erased and cannot be recovered." },
              { q: "What documents do I need to sell my phone?", a: "Just a valid government ID for verification. Original purchase bill is optional but may help you get a better price." },
              { q: "Which brands and models do you accept?", a: "We accept all major brands — Apple, Samsung, OnePlus, Xiaomi, Vivo, Oppo, Realme, Google Pixel, and many more. Both old and new models are accepted." },
              { q: "Do you also offer phone repair services?", a: "Yes! Looplic offers doorstep mobile repair, laptop repair, screen guard installation, CCTV installation, desktop assembly, and IT support services — all at your doorstep in Bangalore." },
            ].map((faq, i) => (
              <details key={i} className="group rounded-2xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronRight className="size-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-600">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <HomepageFooter />
    </div>
  );
}
