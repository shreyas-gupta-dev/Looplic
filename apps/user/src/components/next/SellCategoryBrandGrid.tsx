"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";

type BrandItem = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  letter: string;
  gradient: string;
  href: string;
};

export function SellCategoryBrandGrid({ brands, noun }: { brands: BrandItem[]; noun: string }) {
  const [search, setSearch] = useState("");

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, search]);

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${noun} brands...`}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
        />
      </div>

      {/* Brand Grid */}
      {filteredBrands.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            No brands found for &ldquo;{search}&rdquo;. Try a different search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {filteredBrands.map((brand) => (
            <Link
              key={brand.id}
              href={brand.href}
              className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-5 transition-all duration-150 hover:border-gray-300 hover:shadow-md"
            >
              <BrandLogo
                name={brand.name}
                imageUrl={brand.image_url}
                letter={brand.letter}
                gradient={brand.gradient}
                className="size-12 rounded-lg object-contain"
                fallbackClassName="size-12 rounded-lg"
              />
              <span className="text-xs font-medium text-gray-800 text-center leading-tight">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
