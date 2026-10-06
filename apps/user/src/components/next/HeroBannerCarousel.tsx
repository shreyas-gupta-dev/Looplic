"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  IndianRupee,
  Laptop,
  RotateCcw,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Truck,
  Video,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";

// ─── Slide Types ─────────────────────────────────────────────────────────────

type FeaturePoint = {
  icon: typeof Smartphone;
  text: string;
};

type BannerSlide = {
  id: string;
  tagline: string;
  taglineIcon: typeof Zap;
  taglineStyle: string;
  headlinePrefix: string;
  headlineHighlight: string;
  headlineHighlightColor: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  ctaBg: string;
  bgGradient: string;
  borderColor: string;
  features: FeaturePoint[];
  trustNote: string;
  renderVisual: () => React.ReactNode;
};

// ─── Visual Cards for Right Column ───────────────────────────────────────────

function SellPhoneVisual() {
  return (
    <div className="relative mx-auto flex w-full max-w-[340px] flex-col items-center justify-center p-2 sm:max-w-[380px]">
      {/* Outer Glow */}
      <div className="absolute -inset-2 rounded-3xl bg-brand-400/10 blur-xl" />

      {/* Main Valuation Card */}
      <div className="relative w-full rounded-2xl border border-brand-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-sm transition-all sm:p-5">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Smartphone className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500">Device Valuation</p>
              <p className="text-xs font-bold text-gray-900 sm:text-sm">iPhone 15 Pro (128GB)</p>
            </div>
          </div>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
            Top Value
          </span>
        </div>

        {/* Estimated Cash Value */}
        <div className="my-3 rounded-xl bg-gradient-to-r from-brand-500/10 via-brandteal-500/5 to-transparent p-3 sm:my-4 sm:p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-gray-600">Estimated Resale Value</span>
            <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              After Inspection
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-brand-700 sm:text-3xl">
              ₹52,800
            </span>
            <span className="text-[11px] text-gray-500">estimated</span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-brand-800">
            <CheckCircle2 className="size-3 text-brand-600" />
            Payment via UPI / Bank after inspection & acceptance
          </p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 text-gray-700">
            <Truck className="size-3.5 text-brand-600" />
            <span>Free Doorstep Pickup</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 text-gray-700">
            <ShieldCheck className="size-3.5 text-brand-600" />
            <span>Secure Data Erasure</span>
          </div>
        </div>
      </div>

      {/* Floating Price Match Pill */}
      <div className="absolute -bottom-2 -left-2 z-10 hidden items-center gap-1.5 rounded-full border border-brand-200 bg-brand-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg sm:flex">
        <Sparkles className="size-3.5 text-brand-200" />
        <span>Free Doorstep Pickup in Bangalore</span>
      </div>
    </div>
  );
}

function RepairPhoneVisual() {
  return (
    <div className="relative mx-auto flex w-full max-w-[340px] flex-col items-center justify-center p-2 sm:max-w-[380px]">
      <div className="absolute -inset-2 rounded-3xl bg-blue-400/10 blur-xl" />

      {/* Main Repair Card */}
      <div className="relative w-full rounded-2xl border border-blue-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:p-5">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Wrench className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500">Doorstep Mobile Service</p>
              <p className="text-xs font-bold text-gray-900 sm:text-sm">Screen & Battery Replacement</p>
            </div>
          </div>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
            At Doorstep
          </span>
        </div>

        {/* Pricing Box */}
        <div className="my-3 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-3 sm:my-4 sm:p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-gray-600">Starting Price</span>
            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Flat 50% OFF
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-blue-700 sm:text-3xl">
              ₹499
            </span>
            <span className="text-xs text-gray-500 line-through">₹999</span>
            <span className="text-[11px] font-semibold text-brand-600">Save ₹500</span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-blue-900">
            <Shield className="size-3 text-blue-600" />
            6 Months Warranty + Free Replacement
          </p>
        </div>

        {/* Perks Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 text-gray-700">
            <Clock className="size-3.5 text-blue-600" />
            <span>At Your Doorstep</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 text-gray-700">
            <BadgeCheck className="size-3.5 text-blue-600" />
            <span>Quality Parts</span>
          </div>
        </div>
      </div>

      {/* Floating Trust Pill */}
      <div className="absolute -bottom-2 -right-2 z-10 hidden items-center gap-1.5 rounded-full border border-blue-200 bg-slate-900 px-3 py-1 text-[11px] font-bold text-white shadow-lg sm:flex">
        <Star className="size-3.5 fill-amber-400 text-amber-400" />
        <span>Warranty on Eligible Repairs</span>
      </div>
    </div>
  );
}

function LaptopRepairVisual() {
  return (
    <div className="relative mx-auto flex w-full max-w-[340px] flex-col items-center justify-center p-2 sm:max-w-[380px]">
      <div className="absolute -inset-2 rounded-3xl bg-indigo-400/10 blur-xl" />

      {/* Main Laptop Repair Card */}
      <div className="relative w-full rounded-2xl border border-indigo-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:p-5">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Laptop className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500">Doorstep Laptop & Mac Care</p>
              <p className="text-xs font-bold text-gray-900 sm:text-sm">Screen, Keyboard & SSD Upgrade</p>
            </div>
          </div>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
            Free Visit
          </span>
        </div>

        {/* Pricing & Offer */}
        <div className="my-3 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-3 sm:my-4 sm:p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-gray-600">Diagnosis & Service</span>
            <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Mac & Windows
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-indigo-900 sm:text-3xl">
              ₹0 Free Inspection
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-indigo-900">
            <CheckCircle2 className="size-3 text-indigo-600" />
            Pay only when repair is approved
          </p>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 text-gray-700">
            <Shield className="size-3.5 text-indigo-600" />
            <span>Warranty on Eligible Repairs</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 text-gray-700">
            <BadgeCheck className="size-3.5 text-indigo-600" />
            <span>Quality Parts</span>
          </div>
        </div>
      </div>

      {/* Floating Pill */}
      <div className="absolute -bottom-2 -left-2 z-10 hidden items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg sm:flex">
        <Sparkles className="size-3.5 text-indigo-200" />
        <span>MacBook & Windows Experts</span>
      </div>
    </div>
  );
}

function RefurbishedPhoneVisual() {
  return (
    <div className="relative mx-auto flex w-full max-w-[340px] flex-col items-center justify-center p-2 sm:max-w-[380px]">
      <div className="absolute -inset-2 rounded-3xl bg-amber-400/10 blur-xl" />

      {/* Main Refurbished Card */}
      <div className="relative w-full rounded-2xl border border-amber-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:p-5">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500">Looplic Assured Flagships</p>
              <p className="text-xs font-bold text-gray-900 sm:text-sm">Certified Refurbished Phones</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            Like New
          </span>
        </div>

        {/* Price & Savings */}
        <div className="my-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-3 sm:my-4 sm:p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-gray-600">Starting From</span>
            <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Up to 70% Off
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-amber-800 sm:text-3xl">
              ₹9,999
            </span>
            <span className="text-xs text-gray-500 line-through">₹29,999</span>
            <span className="text-[11px] font-semibold text-brand-600">Save Big</span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-900">
            <CreditCard className="size-3 text-amber-600" />
            No Cost EMI from ₹999/month
          </p>
        </div>

        {/* Quality Points */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 text-gray-700">
            <ShieldCheck className="size-3.5 text-amber-600" />
            <span>6-Month Warranty</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 text-gray-700">
            <RotateCcw className="size-3.5 text-amber-600" />
            <span>7-Day Replacement</span>
          </div>
        </div>
      </div>

      {/* Floating 32-Point Badge */}
      <div className="absolute -bottom-2 -left-2 z-10 hidden items-center gap-1.5 rounded-full border border-amber-300 bg-amber-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg sm:flex">
        <BadgeCheck className="size-3.5 text-amber-100" />
        <span>32-Point Quality Inspected</span>
      </div>
    </div>
  );
}

function CctvVisual() {
  return (
    <div className="relative mx-auto flex w-full max-w-[340px] flex-col items-center justify-center p-2 sm:max-w-[380px]">
      <div className="absolute -inset-2 rounded-3xl bg-slate-400/10 blur-xl" />

      {/* Main CCTV Card */}
      <div className="relative w-full rounded-2xl border border-slate-300/80 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:p-5">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Camera className="size-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500">Smart Security Solution</p>
              <p className="text-xs font-bold text-gray-900 sm:text-sm">4K CCTV Home & Shop Setup</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
            <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" />
            LIVE FEED
          </div>
        </div>

        {/* Feature Box */}
        <div className="my-3 rounded-xl bg-gradient-to-r from-slate-500/10 via-slate-500/5 to-transparent p-3 sm:my-4 sm:p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-gray-600">Professional Setup</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Same Day
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Free Site Survey
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-700">
            <Eye className="size-3 text-brand-600" />
            Live Remote Mobile View on iOS & Android
          </p>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 text-gray-700">
            <Video className="size-3.5 text-slate-700" />
            <span>HD Night Vision</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 text-gray-700">
            <ShieldCheck className="size-3.5 text-slate-700" />
            <span>2-Year Warranty</span>
          </div>
        </div>
      </div>

      {/* Floating Free Survey Badge */}
      <div className="absolute -bottom-2 -right-2 z-10 hidden items-center gap-1.5 rounded-full border border-slate-300 bg-slate-900 px-3 py-1 text-[11px] font-bold text-white shadow-lg sm:flex">
        <Zap className="size-3.5 text-amber-400" />
        <span>Installation in 24 Hours</span>
      </div>
    </div>
  );
}

// ─── Banner Slides Definition ────────────────────────────────────────────────

const SLIDES: BannerSlide[] = [
  {
    id: "sell",
    tagline: "DOORSTEP DEVICE RESALE IN BANGALORE",
    taglineIcon: Zap,
    taglineStyle: "bg-brand-100 text-brand-800 border-brand-200",
    headlinePrefix: "Sell Your Old Phone for ",
    headlineHighlight: "Instant Payment",
    headlineHighlightColor: "text-brand-600",
    description:
      "Get an estimated resale value in as little as 60 seconds. Free doorstep pickup in Bangalore — payment after device inspection and acceptance.",
    ctaText: "Check Phone Value",
    ctaHref: "/sell",
    ctaBg: "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20",
    bgGradient: "bg-gradient-to-br from-[#EBF3FE] via-[#F8FAFC] to-[#E6FFF7]",
    borderColor: "border-brand-100",
    trustNote: "Free doorstep pickup • Payment after inspection & acceptance",
    features: [
      { icon: IndianRupee, text: "Competitive Valuation" },
      { icon: Truck, text: "Free Doorstep Pickup" },
      { icon: ShieldCheck, text: "Secure Data Erasure" },
      { icon: Zap, text: "UPI/Bank Payment" },
    ],
    renderVisual: () => <SellPhoneVisual />,
  },
  {
    id: "repair",
    tagline: "DOORSTEP MOBILE REPAIR",
    taglineIcon: Wrench,
    taglineStyle: "bg-blue-100 text-blue-800 border-blue-200",
    headlinePrefix: "Doorstep Mobile Repair ",
    headlineHighlight: "Starting @ ₹499",
    headlineHighlightColor: "text-blue-600",
    description:
      "Screen replacement, battery replacement, connector and selected motherboard repairs at your home or office. Warranty available on eligible repairs.",
    ctaText: "Book Mobile Repair",
    ctaHref: "/service/mobile-repair",
    ctaBg: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
    bgGradient: "bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF]/60 to-[#F0F9FF]",
    borderColor: "border-blue-100",
    trustNote: "Pay after repair • Warranty on eligible repairs",
    features: [
      { icon: Wrench, text: "All Brands & Models" },
      { icon: Shield, text: "Warranty on Eligible Repairs" },
      { icon: CheckCircle2, text: "At Your Doorstep" },
      { icon: Clock, text: "Quick Turnaround" },
    ],
    renderVisual: () => <RepairPhoneVisual />,
  },
  {
    id: "laptop-repair",
    tagline: "DOORSTEP LAPTOP & MAC SERVICE",
    taglineIcon: Laptop,
    taglineStyle: "bg-indigo-100 text-indigo-800 border-indigo-200",
    headlinePrefix: "Doorstep Laptop Repair ",
    headlineHighlight: "Free Diagnosis",
    headlineHighlightColor: "text-indigo-600",
    description:
      "Keyboard, screen, battery replacement & SSD upgrades for MacBook, Dell, HP, Lenovo & Asus with 6-month warranty.",
    ctaText: "Book Laptop Repair",
    ctaHref: "/service/laptop-repair",
    ctaBg: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20",
    bgGradient: "bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#E0E7FF]/40",
    borderColor: "border-indigo-100",
    trustNote: "Free doorstep pickup & inspection • Certified technicians",
    features: [
      { icon: Laptop, text: "MacBook & Windows" },
      { icon: ShieldCheck, text: "6 Mo Warranty" },
      { icon: CheckCircle2, text: "Free Inspection" },
      { icon: Zap, text: "Same-Day Fix" },
    ],
    renderVisual: () => <LaptopRepairVisual />,
  },
  {
    id: "buy",
    tagline: "LOOPLIC ASSURED REFURBISHED",
    taglineIcon: Sparkles,
    taglineStyle: "bg-amber-100 text-amber-800 border-amber-200",
    headlinePrefix: "Quality-Checked Refurbished ",
    headlineHighlight: "Phones & Laptops",
    headlineHighlightColor: "text-amber-600",
    description:
      "Quality-checked pre-owned smartphones tested across multiple functional and cosmetic parameters. 6-month warranty with 7-day replacement on eligible issues.",
    ctaText: "Explore Refurbished Phones",
    ctaHref: "/buy",
    ctaBg: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
    bgGradient: "bg-gradient-to-br from-[#FFFBEB] via-[#FDF8F6] to-[#FEF3C7]/40",
    borderColor: "border-amber-100",
    trustNote: "7-day replacement on eligible issues • 6-month warranty",
    features: [
      { icon: BadgePercent, text: "Multiple Condition Grades" },
      { icon: ShieldCheck, text: "6-Month Warranty" },
      { icon: CreditCard, text: "EMI Options Available" },
      { icon: Sparkles, text: "Quality Inspected" },
    ],
    renderVisual: () => <RefurbishedPhoneVisual />,
  },
  {
    id: "cctv",
    tagline: "SAME-DAY CCTV INSTALLATION",
    taglineIcon: Camera,
    taglineStyle: "bg-slate-200 text-slate-800 border-slate-300",
    headlinePrefix: "Smart CCTV Security Setup ",
    headlineHighlight: "4K Night Vision",
    headlineHighlightColor: "text-slate-800",
    description:
      "HD night-vision cameras with 24/7 mobile live stream. Protect your home and shop with professional same-day installation.",
    ctaText: "Schedule Free Survey",
    ctaHref: "/service/cctv",
    ctaBg: "bg-slate-900 hover:bg-black text-white shadow-slate-900/20",
    bgGradient: "bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0]/70",
    borderColor: "border-slate-200",
    trustNote: "Free on-site inspection • Mobile app live stream setup included",
    features: [
      { icon: Video, text: "4K Night Vision" },
      { icon: Eye, text: "Mobile Live View" },
      { icon: ShieldCheck, text: "2-Year Warranty" },
      { icon: Zap, text: "Same-Day Setup" },
    ],
    renderVisual: () => <CctvVisual />,
  },
];

const AUTOPLAY_INTERVAL = 6000;

// ─── Component ───────────────────────────────────────────────────────────────

export function HeroBannerCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      emblaApi?.scrollPrev();
    },
    [emblaApi]
  );
  const scrollNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      emblaApi?.scrollNext();
    },
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
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
      aria-label="Featured Offers and Services"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        {/* Main Banner Container */}
        <div
          ref={emblaRef}
          className="w-full overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm"
        >
          <div className="flex">
            {SLIDES.map((slide) => {
              const TagIcon = slide.taglineIcon;
              return (
                <div key={slide.id} className="min-w-0 flex-[0_0_100%]">
                  {/* The whole banner slide is an accessible, clickable Link */}
                  <Link
                    href={slide.ctaHref}
                    className={`group relative block overflow-hidden ${slide.bgGradient} p-5 sm:p-7 md:p-9 lg:p-10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  >
                    {/* Subtle ambient light shapes */}
                    <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/60 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-white/60 blur-3xl" />

                    {/* 2-Column Responsive Layout */}
                    <div className="relative z-10 grid grid-cols-1 items-center gap-6 md:grid-cols-12 md:gap-8">
                      {/* Left Column: Content */}
                      <div className="flex flex-col items-start md:col-span-7 lg:col-span-7">
                        {/* Tagline Badge */}
                        <div
                          className={`mb-2.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide shadow-xs ${slide.taglineStyle}`}
                        >
                          <TagIcon className="size-3.5" />
                          <span>{slide.tagline}</span>
                        </div>

                        {/* Main Headline */}
                        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl md:text-3xl lg:text-[2rem] lg:leading-tight">
                          {slide.headlinePrefix}
                          <span className={slide.headlineHighlightColor}>
                            {slide.headlineHighlight}
                          </span>
                        </h2>

                        {/* Description */}
                        <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm md:text-base">
                          {slide.description}
                        </p>

                        {/* Feature Badges / Chips */}
                        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {slide.features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                              <span
                                key={feature.text}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs backdrop-blur-xs sm:text-xs"
                              >
                                <Icon className="size-3.5 text-slate-500" />
                                {feature.text}
                              </span>
                            );
                          })}
                        </div>

                        {/* CTA + Trust Note */}
                        <div className="mt-4.5 flex flex-col items-start gap-2 sm:mt-5 sm:flex-row sm:items-center sm:gap-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold shadow-md transition-all duration-200 group-hover:scale-[1.03] active:scale-[0.98] sm:text-sm ${slide.ctaBg}`}
                          >
                            <span>{slide.ctaText}</span>
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                          </span>

                          <span className="text-[11px] font-medium text-slate-500 sm:text-xs">
                            {slide.trustNote}
                          </span>
                        </div>
                      </div>

                      {/* Right Column: Realistic Visual Mockup */}
                      <div className="hidden md:col-span-5 md:flex md:items-center md:justify-center lg:col-span-5">
                        {slide.renderVisual()}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Navigation Arrows - hidden on mobile so touch gestures are used without button overlap */}
        <button
          onClick={scrollPrev}
          className="hidden sm:flex absolute left-3 sm:left-6 lg:left-7 top-1/2 z-20 size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/90 bg-white/90 text-slate-700 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-105 hover:text-slate-900 active:scale-95 sm:size-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={scrollNext}
          className="hidden sm:flex absolute right-3 sm:right-6 lg:right-7 top-1/2 z-20 size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/90 bg-white/90 text-slate-700 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-105 hover:text-slate-900 active:scale-95 sm:size-10"
          aria-label="Next slide"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {SLIDES.map((slide, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                scrollTo(idx);
              }}
              aria-label={`Go to ${slide.id} slide`}
              className={`rounded-full transition-all duration-300 ${
                idx === selectedIndex
                  ? "h-2 w-6 bg-slate-900"
                  : "size-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
