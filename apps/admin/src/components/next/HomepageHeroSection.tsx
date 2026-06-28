"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { DeviceSearchBox } from "@/src/components/next/DeviceSearchBox";
import type { CatalogBrand, SearchModel, SearchSeries } from "@/src/lib/data/catalog";
import { buildServiceSeriesRoute } from "@/src/lib/routes";

const stats = [
  { value: "2000+", label: "Installs" },
  { value: "4.8+", label: "Rating" },
  { value: "30min", label: "Service" },
];

export function HomepageHeroSection({
  brands,
  searchBrands,
  searchSeries,
  searchModels,
  title = "Get Mobile Repair at Your Door",
  description = "Find your model, choose a repair, and book a technician in under a minute.",
  browseHref = "/service/mobile-repair/brands",
  searchPlaceholder = "Search your phone model...",
  eyebrow,
}: {
  brands: CatalogBrand[];
  searchBrands: CatalogBrand[];
  searchSeries: SearchSeries[];
  searchModels: SearchModel[];
  title?: string;
  description?: string;
  browseHref?: string;
  searchPlaceholder?: string;
  eyebrow?: string;
}) {
  return (
    <section className="relative overflow-hidden pb-6 pt-8 md:pb-20 md:pt-16">
      <div className="absolute inset-0 gradient-hero-bg" />
      <div className="absolute right-0 top-0 size-80 rounded-full gradient-brand opacity-[0.06] blur-[100px]" />
      <div className="absolute bottom-0 left-0 size-60 rounded-full gradient-brand opacity-[0.04] blur-[80px]" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-lg text-center">
          {eyebrow ? (
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-primary/80">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="px-4 text-[26px] font-semibold leading-[1.15] tracking-tight text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>

          <DeviceSearchBox
            placeholder={searchPlaceholder}
            browseHref={browseHref}
            brands={searchBrands}
            series={searchSeries}
            models={searchModels}
            mode="mobile-repair"
          />
        </div>

        <div className="mx-auto mt-8 max-w-md">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-xs font-bold text-muted-foreground">- Pick a brand for your phone -</p>
            <Link href={browseHref} className="flex items-center gap-0.5 text-[10px] font-bold text-primary">
              All <ChevronRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={buildServiceSeriesRoute("mobile-repair", brand.slug)}
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
  );
}
