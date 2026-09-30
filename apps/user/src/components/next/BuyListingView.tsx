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
  description?: string | null;
  specifications?: Record<string, string> | null;
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
  excellent: "bg-brandcyan-100 text-brandcyan-700",
  superb: "bg-brandteal-100 text-brandteal-800",
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
                  className="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
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
                  className="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
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
                  selectedStorage.includes(s) ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-400"
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
                  selectedRam.includes(r) ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-400"
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
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Min"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => { setPriceRange([priceRange[0], Number(e.target.value)]); setCurrentPage(1); }}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
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
                    <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterCount}</span>
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
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                    className={`p-2 ${viewMode === "grid" ? "bg-brand-50 text-brand-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <Grid3X3 className="size-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-brand-50 text-brand-600" : "text-gray-400 hover:text-gray-600"}`}
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
                  <button onClick={clearFilters} className="mt-4 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
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
                        page === currentPage ? "bg-brand-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
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
                className="w-full rounded-md bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-700"
              >
                Show {filteredProducts.length} results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Semantic SEO Content Guide (~2000 Words) */}
      <section className="border-t border-gray-200 bg-gray-50/70 py-16 text-gray-700">
        <div className="container mx-auto max-w-7xl px-4 space-y-12">
          {/* Header */}
          <div className="max-w-4xl space-y-4">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              The Definitive Buyer&apos;s Guide
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Buy Certified Refurbished Mobile Phones &amp; Laptops in Bangalore &amp; India
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-600">
              Welcome to Looplic&apos;s certified refurbished electronics marketplace. In an era where flagship smartphones and pro laptops routinely breach six-figure price tags, smart consumers across India are increasingly turning to certified refurbished technology. At Looplic, we bridge the gap between expensive brand-new gadgets and risky, unverified second-hand classifieds, delivering factory-grade certified devices with up to 70% discounts, verified warranties, and rapid doorstep delivery.
            </p>
          </div>

          {/* Section 1: Refurbished vs Used */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                1. What is the Difference Between &apos;Refurbished&apos; and &apos;Used&apos; Electronics?
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                A common misconception among first-time recommerce buyers is equating a &quot;refurbished&quot; device with a generic &quot;second-hand&quot; or &quot;used&quot; device found on peer-to-peer portals like OLX or local bazaar shops. The distinction is critical:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700 pl-4 list-disc">
                <li>
                  <strong>Used Devices:</strong> Sold directly by prior owners in an &apos;as-is&apos; state without technical verification, internal diagnostic testing, data sanitization, or warranty protection. If an internal component fails days after purchase, the buyer has zero recourse.
                </li>
                <li>
                  <strong>Looplic Certified Refurbished Devices:</strong> Sourced from verified corporate trade-ins, unboxed returns, or certified buyback channels. Each unit is systematically inspected by certified hardware technicians through a comprehensive 32-point checklist, sanitised using hospital-grade antimicrobial solutions, wiped to military data security standards (NIST 800-88), and backed by up to 12 months of comprehensive warranty and a 15-day replacement guarantee.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                2. Why Certified Recommerce is Smarter for Your Wallet &amp; the Planet
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Modern electronic manufacturing requires immense energy, raw mineral extraction (such as cobalt, lithium, and rare earth metals), and intensive water usage. Manufacturing just one modern smartphone produces roughly 80kg of CO2 equivalent emissions.
              </p>
              <p className="text-sm leading-relaxed text-gray-600">
                When you buy certified refurbished through Looplic, you actively divert hazardous electronic waste from landfills, reduce carbon emissions by over 75%, and save up to ₹40,000 to ₹70,000 on flagship models like the Apple iPhone 15 Pro, Samsung Galaxy S24 Ultra, and OnePlus 12.
              </p>
              <div className="flex items-center gap-4 pt-2 text-xs font-semibold text-emerald-700">
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 border border-emerald-200">
                  🌱 78% Carbon Emission Reduction
                </span>
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 border border-emerald-200">
                  ♻️ Zero Toxic Landfill Disposal
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: 32-Point Quality Framework */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                3. The Looplic Assured 32-Point Engineering Inspection Protocol
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Before any smartphone, laptop, or tablet is listed on our catalog, it undergoes rigorous diagnostic testing inside our Bangalore central engineering hub. We reject over 25% of incoming devices that do not meet our exacting factory benchmarks.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-xs text-gray-700">
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-1.5">
                <h4 className="font-bold text-gray-900 text-sm">Display &amp; Digitizer</h4>
                <p>OLED/LCD touch response, True Tone calibration, zero dead pixel verification, refresh rate stabilization.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-1.5">
                <h4 className="font-bold text-gray-900 text-sm">Battery &amp; Power</h4>
                <p>Minimum 85%+ peak health capacity, charge cycle evaluation, thermal temperature stability during fast charging.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-1.5">
                <h4 className="font-bold text-gray-900 text-sm">Camera &amp; Optics</h4>
                <p>Optical Image Stabilization (OIS), autofocus tracking, front and rear multi-lens clarity, zero sensor dust.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-1.5">
                <h4 className="font-bold text-gray-900 text-sm">Audio &amp; Acoustics</h4>
                <p>Stereo speakers distortion check, noise-canceling dual microphones, earpiece decibel acoustic balance.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-1.5">
                <h4 className="font-bold text-gray-900 text-sm">Biometrics &amp; Security</h4>
                <p>Face ID / Touch ID / In-display ultrasonic fingerprint speed, Knox/Apple T2 security chip authentication.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-1.5">
                <h4 className="font-bold text-gray-900 text-sm">Wireless &amp; Connectivity</h4>
                <p>5G dual-SIM VoLTE, Wi-Fi 6/6E throughput, Bluetooth 5.3 range, NFC payment verification, GPS triangulation.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-1.5">
                <h4 className="font-bold text-gray-900 text-sm">Physical Ports &amp; Sensors</h4>
                <p>USB-C/Lightning connector retention force, accelerometer, gyroscope, proximity, and ambient light sensors.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-1.5">
                <h4 className="font-bold text-gray-900 text-sm">100% Data Eradication</h4>
                <p>Permanent, irreversible military-grade sanitization ensuring no trace of previous user data or cloud locks.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Condition Grading Guide */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              4. Honest Cosmetic Condition Grading: What to Expect
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every refurbished listing on Looplic is categorized into one of five transparent cosmetic grades. Regardless of the cosmetic grade you choose, every single device performs with 100% flawless technical reliability.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-teal-200 bg-white p-5 shadow-sm space-y-2">
                <span className="inline-block rounded-md bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                  Superb (Like New)
                </span>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Pristine condition. Flawless screen glass and chassis with zero visible marks or signs of use. Appears identical to a brand-new device fresh from the showroom. Battery health guaranteed 90%+.
                </p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm space-y-2">
                <span className="inline-block rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                  Excellent
                </span>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Minimal cosmetic wear. Screen is 100% clean and pristine. Minor micro-scratches on bezel or rear glass that are invisible from a normal viewing distance. Battery health guaranteed 85%+.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-white p-5 shadow-sm space-y-2">
                <span className="inline-block rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
                  Good
                </span>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Moderate cosmetic wear. Faint hairline marks on body or frame from everyday handling. Absolutely no cracks, screen burn, or deep dents. 100% operational hardware.
                </p>
              </div>

              <div className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm space-y-2">
                <span className="inline-block rounded-md bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">
                  Fair (Best Value)
                </span>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Noticeable cosmetic scratches or paint scuffs on the housing, but display touch and internal motherboards are fully functional. Highest discount savings for budget-conscious buyers.
                </p>
              </div>

              <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm space-y-2 sm:col-span-2 lg:col-span-2">
                <span className="inline-block rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                  Unboxed / Open Box
                </span>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Brand new devices where only the outer seal was opened. Zero signs of usage, 100% battery capacity, original box packaging, and standard manufacturer brand warranty remaining.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Brand Portals Comparison */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">
              5. Popular Refurbished Smartphone Brands Available on Looplic
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-xs sm:text-sm text-gray-600">
              <div className="space-y-2">
                <h4 className="font-bold text-base text-gray-900">Refurbished Apple iPhones</h4>
                <p>
                  From the compact iPhone 11 and iPhone 12 to the titanium iPhone 15 Pro Max and iPhone 16 Pro, all iPhones are factory unlocked with genuine iOS activation, True Tone, and guaranteed battery health.
                </p>
                <Link href="/buy?brand=Apple" className="inline-block text-xs font-bold text-primary hover:underline">
                  Explore Refurbished iPhones &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-base text-gray-900">Refurbished Samsung Galaxy</h4>
                <p>
                  Explore high-demand Galaxy S Series (S21 Ultra, S22+, S23 Ultra, S24), Galaxy Z Fold/Flip foldables, and budget-friendly Galaxy A and M series with vibrant Dynamic AMOLED displays.
                </p>
                <Link href="/buy?brand=Samsung" className="inline-block text-xs font-bold text-primary hover:underline">
                  Explore Refurbished Samsung &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-base text-gray-900">Refurbished OnePlus</h4>
                <p>
                  Experience signature OxygenOS fluidity with the OnePlus 11, OnePlus 12, and OnePlus Nord series. Includes high-wattage SuperVOOC charging validation and pristine fluid AMOLED panels.
                </p>
                <Link href="/buy?brand=OnePlus" className="inline-block text-xs font-bold text-primary hover:underline">
                  Explore Refurbished OnePlus &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-base text-gray-900">Refurbished Google Pixel</h4>
                <p>
                  Unmatched computational photography and clean Android experiences with Google Pixel 6, 7 Pro, 8 Pro, and 9 Pro XL. Camera lenses, Tensor chips, and Titan M2 security validated.
                </p>
                <Link href="/buy?brand=Google" className="inline-block text-xs font-bold text-primary hover:underline">
                  Explore Refurbished Pixel &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Section 5: FAQs */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              6. Frequently Asked Questions (FAQ) About Buying Refurbished Devices
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-1.5">
                <h4 className="font-bold text-sm text-gray-900">What warranty do I receive with my purchase?</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  All certified refurbished devices on Looplic include a standard 6-month or 12-month comprehensive warranty covering motherboards, screens, cameras, and batteries. You can find your digital warranty card in your account dashboard.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-1.5">
                <h4 className="font-bold text-sm text-gray-900">What if I receive a device I am not satisfied with?</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We offer a hassle-free 7-Day Replacement Guarantee. If the device has any technical defect or cosmetic grade mismatch, contact our support team to schedule an immediate free reverse doorstep pickup.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-1.5">
                <h4 className="font-bold text-sm text-gray-900">Can I exchange my old phone when buying refurbished?</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Yes! Use our instant buyback calculator to get a valuation for your old smartphone, laptop, or tablet. You can receive instant UPI cash payout or apply an exchange coupon code directly at checkout.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-1.5">
                <h4 className="font-bold text-sm text-gray-900">Do you offer doorstep delivery in Bangalore?</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Yes, we provide express same-day and next-day doorstep delivery across all major Bangalore localities including Koramangala, Indiranagar, HSR Layout, Whitefield, Electronic City, Jayanagar, and Marathahalli.
                </p>
              </div>
            </div>
          </div>

          {/* Section 6: Internal Linking Ecosystem */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Explore the Looplic Circular Tech Ecosystem</h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-gray-800">Sell Old Devices</p>
                <ul className="space-y-1 text-gray-500">
                  <li><Link href="/sell" className="hover:text-primary">• Sell Old Mobile Phone</Link></li>
                  <li><Link href="/sell/laptop" className="hover:text-primary">• Sell Old Laptop</Link></li>
                  <li><Link href="/sell/tablet" className="hover:text-primary">• Sell Old iPad &amp; Tablet</Link></li>
                  <li><Link href="/sell/smartwatch" className="hover:text-primary">• Sell Old Smartwatch</Link></li>
                </ul>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-gray-800">Doorstep Repairs</p>
                <ul className="space-y-1 text-gray-500">
                  <li><Link href="/apple-iphone-screen-replacement" className="hover:text-primary">• iPhone Screen Replacement</Link></li>
                  <li><Link href="/samsung-screen-replacement" className="hover:text-primary">• Samsung Screen Replacement</Link></li>
                  <li><Link href="/oneplus-screen-replacement" className="hover:text-primary">• OnePlus Screen Replacement</Link></li>
                  <li><Link href="/service/laptop-repair" className="hover:text-primary">• Laptop Repair Services</Link></li>
                </ul>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-gray-800">Bangalore Neighborhoods</p>
                <ul className="space-y-1 text-gray-500">
                  <li><Link href="/bangalore" className="hover:text-primary">• Bangalore Service Hub</Link></li>
                  <li><Link href="/store-locator" className="hover:text-primary">• SJP Road Town Hall Store</Link></li>
                  <li><Link href="/about-us" className="hover:text-primary">• About Looplic Recommerce</Link></li>
                  <li><Link href="/careers" className="hover:text-primary">• Careers &amp; Open Positions</Link></li>
                </ul>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-gray-800">Policies &amp; Support</p>
                <ul className="space-y-1 text-gray-500">
                  <li><Link href="/refund-policy" className="hover:text-primary">• 7-Day Refund Policy</Link></li>
                  <li><Link href="/terms-and-conditions" className="hover:text-primary">• Terms &amp; Conditions</Link></li>
                  <li><Link href="/privacy-policy" className="hover:text-primary">• Privacy Policy</Link></li>
                  <li><Link href="/faq" className="hover:text-primary">• Help Center &amp; FAQs</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

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
            <Image
              src={product.coverImageUrl}
              alt={product.name}
              width={112}
              height={112}
              sizes="112px"
              loading="lazy"
              className="size-28 object-contain"
            />
          ) : (
            <ShoppingCart className="size-10 text-gray-300" />
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-gray-900 group-hover:text-brand-600">{product.name}</h3>
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
                  <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">{discount}% off</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-600 font-medium">
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
          <Image
            src={product.coverImageUrl}
            alt={product.name}
            width={160}
            height={160}
            sizes="160px"
            loading="lazy"
            className="size-36 object-contain transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <ShoppingCart className="size-14 text-gray-300" />
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded bg-brand-600 px-2 py-1 text-xs font-bold text-white">
            {discount}% OFF
          </span>
        )}
        <span className={`absolute right-2 top-2 rounded px-2 py-1 text-xs font-semibold ${conditionColors[product.condition]}`}>
          {conditionLabels[product.condition]}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 line-clamp-2">{product.name}</h3>
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
            <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-600">
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
