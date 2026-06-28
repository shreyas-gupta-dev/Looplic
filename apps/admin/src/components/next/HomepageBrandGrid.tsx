"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import type { CatalogBrand } from "@/src/lib/data/catalog";
import { buildServiceSeriesRoute } from "@/src/lib/routes";

export function HomepageBrandGrid({ brands }: { brands: CatalogBrand[] }) {
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

  const hasMore = brands.length > visibleCount;
  const displayedBrands = showAll ? brands : brands.slice(0, hasMore ? visibleCount - 1 : visibleCount);

  return (
    <section className="bg-background py-10 md:py-16">
      <div className="container">
        <div className="mb-5 flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl font-semibold text-foreground md:text-3xl">Browse by Brand</h2>
            <p className="mt-1 text-xs text-muted-foreground">Tap a brand to explore models</p>
          </div>
          <Link href="/service/mobile-repair/brands" className="flex items-center gap-0.5 text-xs font-bold text-primary">
            View All <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 md:gap-3">
          {displayedBrands.map((brand) => (
            <Link
              href={buildServiceSeriesRoute("mobile-repair", brand.slug)}
              key={brand.id}
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
  );
}
