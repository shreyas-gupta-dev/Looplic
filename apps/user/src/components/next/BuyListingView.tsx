"use client";

import { Grid3X3, List, ChevronLeft, ChevronRight, ShoppingCart, Shield, SlidersHorizontal, X, BadgeCheck } from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductListing = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  condition: "fair" | "good" | "excellent" | "superb" | "unboxed";
  price: number;
  originalPrice: number;
  storage: string | null;
  ram: string | null;
  color: string | null;
  description: string | null;
  specifications: Record<string, string> | null;
  warrantyMonths: number;
  stock: number;
  featured: boolean;
  coverImageUrl: string | null;
  images: { url: string; alt: string }[];
};

type SortOption = "price-asc" | "price-desc" | "newest" | "popularity" | "discount";

const conditionColors: Record<string, string> = {
  fair: "bg-orange-100 text-orange-700",
  good: "bg-blue-100 text-blue-700",
  excellent: "bg-green-100 text-green-700",
  superb: "bg-emerald-100 text-emerald-700",
  unboxed: "bg-purple-100 text-purple-700",
};

const conditionLabels: Record<string, string> = {
  fair: "Fair",
  good: "Good",
  excellent: "Excellent",
  superb: "Superb",
  unboxed: "Unboxed",
};

function formatInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function discountPercent(original: number, current: number) {
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BuyListingView({ products = [] }: { products?: ProductListing[] }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortOption>("popularity");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
  const [selectedRam, setSelectedRam] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const itemsPerPage = 12;

  // Extract filter options from actual product data
  const availableBrands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);
  const availableStorage = useMemo(() => [...new Set(products.map((p) => p.storage).filter(Boolean))].sort() as string[], [products]);
  const availableRam = useMemo(() => [...new Set(products.map((p) => p.ram).filter(Boolean))].sort() as string[], [products]);
  const availableConditions = useMemo(() => [...new Set(products.map((p) => p.condition))], [products]);

  // Filter & sort
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.stock > 0 || products.length === 0);

    if (selectedBrands.length > 0) result = result.filter((p) => selectedBrands.includes(p.brand));
    if (selectedConditions.length > 0) result = result.filter((p) => selectedConditions.includes(p.condition));
    if (selectedStorage.length > 0) result = result.filter((p) => p.storage && selectedStorage.includes(p.storage));
    if (selectedRam.length > 0) result = result.filter((p) => p.ram && selectedRam.includes(p.ram));
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sort) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "newest": result.sort((a, b) => b.id.localeCompare(a.id)); break;
      case "discount": result.sort((a, b) => discountPercent(b.originalPrice, b.price) - discountPercent(a.originalPrice, a.price)); break;
      case "popularity": result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
    }

    return result;
  }, [products, selectedBrands, selectedConditions, selectedStorage, selectedRam, priceRange, sort]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedConditions([]);
    setSelectedStorage([]);
    setSelectedRam([]);
    setPriceRange([0, 200000]);
    setCurrentPage(1);
  };

  const toggleFilter = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
    setCurrentPage(1);
  };

  const activeFilterCount = selectedBrands.length + selectedConditions.length + selectedStorage.length + selectedRam.length;

  // ─── Filter Sidebar Content ────────────────────────────────────────────────
  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Brands */}
      {availableBrands.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Brand</h4>
          <div className="space-y-2.5">
            {availableBrands.map((brand) => (
              <label key={brand} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleFilter(selectedBrands, brand, setSelectedBrands)}
                  className="size-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                {brand}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Condition */}
      {availableConditions.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Condition</h4>
          <div className="space-y-2.5">
            {(["fair", "good", "excellent", "superb", "unboxed"] as const).filter((c) => availableConditions.includes(c)).map((cond) => (
              <label key={cond} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(cond)}
                  onChange={() => toggleFilter(selectedConditions, cond, setSelectedConditions)}
                  className="size-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${conditionColors[cond]}`}>
                  {conditionLabels[cond]}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Storage */}
      {availableStorage.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Storage</h4>
          <div className="flex flex-wrap gap-2">
            {availableStorage.map((s) => (
              <button
                key={s}
                onClick={() => toggleFilter(selectedStorage, s, setSelectedStorage)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedStorage.includes(s) ? "border-green-600 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RAM */}
      {availableRam.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">RAM</h4>
          <div className="flex flex-wrap gap-2">
            {availableRam.map((r) => (
              <button
                key={r}
                onClick={() => toggleFilter(selectedRam, r, setSelectedRam)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedRam.includes(r) ? "border-green-600 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => { setPriceRange([Number(e.target.value), priceRange[1]]); setCurrentPage(1); }}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="Min"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => { setPriceRange([priceRange[0], Number(e.target.value)]); setCurrentPage(1); }}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="Max"
          />
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="w-full rounded-md border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <HomepageNavbar />

      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Buy Refurbished Devices</h1>
          <p className="mt-2 text-sm text-gray-500">Certified refurbished phones & laptops with 6-month warranty</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 lg:hidden"
                >
                  <SlidersHorizontal className="size-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterCount}</span>
                  )}
                </button>
                <span className="text-sm text-gray-500">
                  Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="hidden text-sm text-gray-500 sm:inline">Sort by:</span>
                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value as SortOption); setCurrentPage(1); }}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="discount">Discount</option>
                  </select>
                </div>

                {/* View toggle */}
                <div className="hidden items-center rounded-md border border-gray-200 sm:flex">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-green-50 text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <Grid3X3 className="size-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-green-50 text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <List className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {paginatedProducts.length > 0 ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50 py-20 text-center">
                <ShoppingCart className="mb-4 size-14 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-900">
                  {products.length === 0 ? "Coming Soon" : "No products found"}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {products.length === 0
                    ? "We're adding refurbished products soon. Check back later!"
                    : "Try adjusting your filters to find what you're looking for."}
                </p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="mt-4 rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`size-9 rounded-md text-sm font-medium ${
                        page === currentPage ? "bg-green-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative ml-auto flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-bold text-gray-900">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel />
            </div>
            <div className="border-t border-gray-100 p-4">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-md bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700"
              >
                Show {filteredProducts.length} results
              </button>
            </div>
          </div>
        </div>
      )}

      <HomepageFooter />
    </div>
  );
}

// ─── Product Card ────────────────────────────────────────────────────────────

function ProductCard({ product, viewMode }: { product: ProductListing; viewMode: "grid" | "list" }) {
  const discount = discountPercent(product.originalPrice, product.price);

  if (viewMode === "list") {
    return (
      <Link
        href={`/buy/${product.slug}`}
        className="group flex gap-5 rounded-lg border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md"
      >
        <div className="flex size-32 shrink-0 items-center justify-center rounded-lg bg-gray-50">
          {product.coverImageUrl ? (
            <Image src={product.coverImageUrl} alt={product.name} width={112} height={112} className="size-28 object-contain" />
          ) : (
            <ShoppingCart className="size-10 text-gray-300" />
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-gray-900 group-hover:text-green-600">{product.name}</h3>
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${conditionColors[product.condition]}`}>
                {conditionLabels[product.condition]}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {[product.storage, product.ram, product.color].filter(Boolean).join(" • ")}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">{formatInr(product.price)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-sm text-gray-400 line-through">{formatInr(product.originalPrice)}</span>
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">{discount}% off</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <BadgeCheck className="size-4" /> LOOPLIC ASSURED
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/buy/${product.slug}`}
      className="group flex flex-col rounded-lg border border-gray-100 bg-white transition-shadow hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative flex h-48 items-center justify-center bg-gray-50 p-4">
        {product.coverImageUrl ? (
          <Image src={product.coverImageUrl} alt={product.name} width={160} height={160} className="size-36 object-contain transition-transform duration-200 group-hover:scale-105" />
        ) : (
          <ShoppingCart className="size-14 text-gray-300" />
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded bg-green-600 px-2 py-1 text-xs font-bold text-white">
            {discount}% OFF
          </span>
        )}
        <span className={`absolute right-2 top-2 rounded px-2 py-1 text-xs font-semibold ${conditionColors[product.condition]}`}>
          {conditionLabels[product.condition]}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-green-600 line-clamp-2">{product.name}</h3>
        <p className="mt-1 text-xs text-gray-500">
          {[product.storage, product.ram, product.color].filter(Boolean).join(" • ")}
        </p>
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">{formatInr(product.price)}</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">{formatInr(product.originalPrice)}</span>
            )}
          </div>
          {/* Looplic Assured badge */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-green-600">
              <BadgeCheck className="size-3.5" />
              <span>LOOPLIC ASSURED</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <Shield className="size-3" /> {product.warrantyMonths}mo
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
