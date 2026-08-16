"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowRight,
  BadgePercent,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  IndianRupee,
  Monitor,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";

// ─── Slide Data ──────────────────────────────────────────────────────────────

type FeaturePoint = {
  icon: typeof Smartphone;
  text: string;
};

type BannerSlide = {
  id: string;
  tagline: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  bgFrom: string;
  bgVia: string;
  bgTo: string;
  features: FeaturePoint[];
};

const SLIDES: BannerSlide[] = [
  {
    id: "sell",
    tagline: "India's #1 Buyback Platform",
    headline: "Sell Your Old Phone at Best Price",
    description: "Get instant cash at your doorstep. Free pickup, transparent pricing, same-day payment.",
    ctaText: "Get Price Estimate",
    ctaHref: "/sell",
    bgFrom: "from-[#0f766e]",
    bgVia: "via-[#0d9488]",
    bgTo: "to-[#2dd4bf]",
    features: [
      { icon: IndianRupee, text: "Up to ₹45,000" },
      { icon: Truck, text: "Free Pickup" },
      { icon: Clock, text: "30 Min" },
      { icon: Shield, text: "Data Safe" },
    ],
  },
  {
    id: "repair",
    tagline: "Certified Expert Technicians",
    headline: "Doorstep Repair Starting ₹499",
    description: "Screen replacement, battery change & all repairs. 6-month warranty, certified parts.",
    ctaText: "Book Repair Now",
    ctaHref: "/service/mobile-repair",
    bgFrom: "from-[#4c1d95]",
    bgVia: "via-[#6d28d9]",
    bgTo: "to-[#8b5cf6]",
    features: [
      { icon: Wrench, text: "All Brands" },
      { icon: Shield, text: "6 Mo Warranty" },
      { icon: Star, text: "4.8★ Rated" },
      { icon: Zap, text: "Same Day" },
    ],
  },
  {
    id: "buy",
    tagline: "Looplic Assured Quality",
    headline: "Certified Refurbished — Up to 70% Off",
    description: "Like-new devices with 12 months warranty, free delivery & EMI from ₹999/mo.",
    ctaText: "Shop Devices",
    ctaHref: "/buy",
    bgFrom: "from-[#1e40af]",
    bgVia: "via-[#2563eb]",
    bgTo: "to-[#60a5fa]",
    features: [
      { icon: BadgePercent, text: "Up to 70% Off" },
      { icon: Shield, text: "12 Mo Warranty" },
      { icon: CreditCard, text: "Easy EMI" },
      { icon: Sparkles, text: "Like New" },
    ],
  },
  {
    id: "cctv",
    tagline: "Professional Installation",
    headline: "CCTV Installation — Same Day Setup",
    description: "HD cameras, night vision, remote viewing on mobile & professional installation.",
    ctaText: "Book Installation",
    ctaHref: "/service/cctv",
    bgFrom: "from-[#1e293b]",
    bgVia: "via-[#334155]",
    bgTo: "to-[#475569]",
    features: [
      { icon: Camera, text: "HD Cameras" },
      { icon: Monitor, text: "Remote View" },
      { icon: Shield, text: "24/7 Recording" },
      { icon: Zap, text: "Same Day" },
    ],
  },
];

const AUTOPLAY_INTERVAL = 5000;

// ─── Component ───────────────────────────────────────────────────────────────

export function HeroBannerCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const startAutoplay = () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = setInterval(() => {
        if (!isPaused) emblaApi.scrollNext();
      }, AUTOPLAY_INTERVAL);
    };
    startAutoplay();
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [emblaApi, isPaused]);

  return (
    <section
      className="relative w-full overflow-hidden"
      aria-label="Promotional offers"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative container mx-auto max-w-6xl px-4 pt-4">
        <div ref={emblaRef} className="w-full overflow-hidden rounded-2xl">
          <div className="flex">
          {SLIDES.map((slide) => (
            <div key={slide.id} className="min-w-0 flex-[0_0_100%]">
              <div
                className={`relative overflow-hidden bg-gradient-to-br ${slide.bgFrom} ${slide.bgVia} ${slide.bgTo} px-5 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10 lg:px-16 lg:py-12`}
              >
                {/* Background decorative effects (contained within) */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
                  <div className="absolute -left-[10%] -top-[30%] h-[70%] w-[50%] rounded-full bg-white/10 blur-[80px]" />
                  <div className="absolute -bottom-[20%] right-[5%] h-[50%] w-[40%] rounded-full bg-white/8 blur-[60px]" />
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

                {/* Content — constrained width */}
                <div className="relative z-10 max-w-3xl">
                  {/* Tagline badge */}
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 backdrop-blur-sm sm:mb-3 sm:px-3 sm:py-1">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-green-400" />
                    </span>
                    <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-white/90 sm:text-[11px]">
                      {slide.tagline}
                    </span>
                  </div>

                  {/* Headline — stays on one line on desktop, wraps cleanly on mobile */}
                  <h2 className="whitespace-nowrap text-lg font-extrabold leading-tight text-white sm:text-2xl md:text-3xl lg:text-[2.25rem]">
                    {slide.headline}
                  </h2>

                  {/* Description */}
                  <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/75 sm:text-sm md:text-base">
                    {slide.description}
                  </p>

                  {/* Feature chips — single row, no wrap */}
                  <div className="mt-3 flex items-center gap-1.5 sm:gap-2 md:mt-4">
                    {slide.features.map((feature) => {
                      const Icon = feature.icon;
                      return (
                        <span
                          key={feature.text}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/90 sm:px-2.5 sm:py-1 sm:text-[11px] md:text-xs"
                        >
                          <Icon className="size-3" />
                          {feature.text}
                        </span>
                      );
                    })}
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={slide.ctaHref}
                    className="group mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-gray-900 shadow-lg transition-all hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm md:mt-5"
                  >
                    {slide.ctaText}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 sm:size-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows — inside the banner bounds */}
      <button
        onClick={scrollPrev}
        className="absolute left-6 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110 sm:left-7 sm:size-9"
        aria-label="Previous slide"
      >
        <ChevronLeft className="size-4 sm:size-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-6 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110 sm:right-7 sm:size-9"
        aria-label="Next slide"
      >
        <ChevronRight className="size-4 sm:size-5" />
      </button>

      {/* Dot Indicators — compact, inside banner bottom */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4">
        {SLIDES.map((slide, idx) => (
          <button
            key={idx}
            onClick={() => scrollTo(idx)}
            aria-label={`Go to ${slide.id} slide`}
            className={`rounded-full transition-all duration-300 ${
              idx === selectedIndex
                ? "h-2 w-5 bg-white"
                : "size-2 bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
      </div>
    </section>
  );
}
