"use client";

import { ChevronDown, ChevronRight, Laptop, Smartphone } from "lucide-react";
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
    title: "Mobile Repair",
    subtitle: "Expert mobile repair service at your location",
    searchPlaceholder: "Search your phone model...",
    brandLabel: "Pick a mobile brand",
    allHref: "/service/mobile-repair/brands",
    color: "from-orange-500 to-red-500",
    icon: Smartphone,
  },
  "laptop-repair": {
    title: "Laptop Repair",
    subtitle: "Professional laptop repair at your doorstep",
    searchPlaceholder: "Search your laptop model...",
    brandLabel: "Pick a laptop brand",
    allHref: "/service/laptop-repair/brands",
    color: "from-violet-500 to-purple-600",
    icon: Laptop,
  },
} as const;

const stats = [
  { value: "2000+", label: "Installs" },
  { value: "4.8+", label: "Rating" },
  { value: "30min", label: "Service" },
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

  const heroBrands = brands.slice(0, 6);
  const moreBrandsData = brands.slice(6);
  const hasMore = moreBrandsData.length > visibleCount;
  const displayedBrands = showAll ? moreBrandsData : moreBrandsData.slice(0, hasMore ? visibleCount - 1 : visibleCount);

  const Icon = config.icon;

  return (
    <>
      <section className="relative overflow-hidden pb-6 pt-8 md:pb-20 md:pt-16">
        <div className="absolute inset-0 gradient-hero-bg" />
        <div className="absolute right-0 top-0 size-80 rounded-full gradient-brand opacity-[0.06] blur-[100px]" />

        <div className="container relative z-10">
          <div className="mx-auto max-w-lg text-center">
            {eyebrow ? (
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-primary/80">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="px-4 text-[26px] font-semibold leading-[1.15] tracking-tight text-foreground md:text-5xl">
              {heroTitle ?? (
                <>
                  {config.title} <span className="mt-1 block gradient-brand-text">{config.subtitle.split(" ").slice(-4).join(" ")}</span>
                </>
              )}
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">{heroDescription ?? config.subtitle}</p>

            <DeviceSearchBox
              placeholder={searchPlaceholder ?? config.searchPlaceholder}
              browseHref={config.allHref}
              brands={brands}
              series={searchSeries}
              models={searchModels}
              mode={serviceType}
            />
          </div>

          <div className="mx-auto mt-8 max-w-md">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-bold text-muted-foreground">- {config.brandLabel} -</p>
              <Link href={config.allHref} className="flex items-center gap-0.5 text-[10px] font-bold text-primary">
                All <ChevronRight className="size-3" />
              </Link>
            </div>

            {heroBrands.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {heroBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/service/${serviceType}/brands/${brand.slug}`}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-3 shadow-card-brand transition-all hover:border-primary/30 hover:shadow-elevated-brand active:scale-95"
                  >
                    <BrandLogo
                      name={brand.name}
                      imageUrl={brand.image_url}
                      letter={brand.letter}
                      gradient={brand.gradient}
                      className="size-10 rounded-xl object-contain"
                      fallbackClassName="size-10 rounded-xl"
                    />
                    <span className="text-[10px] font-bold text-foreground">{brand.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No brands available yet</p>
            )}
          </div>

          <div className="mx-auto mt-6 max-w-xs">
            <div className="flex items-center justify-around rounded-2xl border border-border bg-card/80 p-3.5 shadow-card-brand backdrop-blur-sm">
              {stats.map((stat, index) => (
                <div key={stat.label} className="relative flex-1 text-center">
                  <div className="text-base font-extrabold leading-none gradient-brand-text">{stat.value}</div>
                  <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                  {index < stats.length - 1 ? <div className="absolute right-0 top-1/2 h-6 w-px -translate-y-1/2 bg-border" /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {moreBrandsData.length > 0 ? (
        <section className="bg-background py-10 md:py-16">
          <div className="container">
            <div className="mb-5 flex items-center justify-between px-1">
              <div>
                <h2 className="text-xl font-semibold text-foreground md:text-2xl">More Brands</h2>
                <p className="mt-1 text-xs text-muted-foreground">Tap a brand to explore models</p>
              </div>
              <Link href={config.allHref} className="flex items-center gap-0.5 text-xs font-bold text-primary">
                View All <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 md:gap-3">
              {displayedBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/service/${serviceType}/brands/${brand.slug}`}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-3.5 shadow-card-brand transition-all duration-200 hover:border-primary/30 hover:shadow-elevated-brand active:bg-secondary/60"
                >
                  <BrandLogo
                    name={brand.name}
                    imageUrl={brand.image_url}
                    letter={brand.letter}
                    gradient={brand.gradient}
                    className="size-10 rounded-xl object-contain"
                    fallbackClassName="size-10 rounded-xl shadow-sm"
                  />
                  <span className="text-[11px] font-bold text-foreground">{brand.name}</span>
                </Link>
              ))}

              {hasMore && !showAll ? (
                <button
                  onClick={() => setShowAll(true)}
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-2 py-3.5 transition-all duration-200 hover:border-primary/40 hover:bg-secondary/40"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                    <ChevronDown className="size-5 text-muted-foreground" />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">Show More</span>
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container pb-10">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-card-brand">
          <div className="flex items-center gap-3">
            <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${config.color}`}>
              <Icon className="size-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{config.title} at Your Doorstep</h2>
              <p className="text-sm text-muted-foreground">Browse by brand, choose your device, and continue into the dedicated booking flow.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
