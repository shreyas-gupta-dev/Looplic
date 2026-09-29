"use client";

import { ArrowLeft, Check, ChevronRight, CreditCard, Heart, Minus, Plus, Shield, ShoppingCart, Star, Truck, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

type ProductData = {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
  category: string;
  condition: string;
  price: string;
  original_price: string;
  storage: string | null;
  ram: string | null;
  color: string | null;
  description: string | null;
  specifications: Record<string, string> | null;
  warranty_months: number;
  stock: number;
  cover_image_url: string | null;
};

type ProductImageRow = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
};

const conditionLabels: Record<string, { label: string; color: string; desc: string }> = {
  fair: { label: "Fair", color: "bg-orange-100 text-orange-700 border-orange-200", desc: "Visible signs of use, fully functional" },
  good: { label: "Good", color: "bg-blue-100 text-blue-700 border-blue-200", desc: "Minor signs of use, excellent condition" },
  excellent: { label: "Excellent", color: "bg-brandcyan-100 text-brandcyan-700 border-brandcyan-200", desc: "Barely any signs of use, like new" },
  superb: { label: "Superb", color: "bg-brandteal-100 text-brandteal-800 border-brandteal-200", desc: "Flawless condition, premium grade" },
  unboxed: { label: "Unboxed", color: "bg-purple-100 text-purple-700 border-purple-200", desc: "Brand new, open box item" },
};

function formatInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

type ProductDetailViewProps = {
  slug: string;
  initialProduct?: ProductData | null;
  initialImages?: ProductImageRow[];
};

export function ProductDetailView({ slug, initialProduct, initialImages }: ProductDetailViewProps) {
  const [product, setProduct] = useState<ProductData | null>(initialProduct ?? null);
  const [images, setImages] = useState<ProductImageRow[]>(initialImages ?? []);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (initialProduct) return;
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/catalog/product?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            setProduct(data.product);
            setImages(data.images || []);
          }
        }
      } catch (e) {
        console.error("Failed to fetch product:", e);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug, initialProduct]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <HomepageNavbar />
        <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <p className="mt-4 text-gray-500">Loading product...</p>
        </div>
        <HomepageFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <HomepageNavbar />
        <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
          <ShoppingCart className="mx-auto mb-4 size-16 text-gray-200" />
          <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
          <p className="mt-2 text-gray-500">This product may no longer be available.</p>
          <Link href="/buy" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white">
            <ArrowLeft className="size-4" /> Back to Shop
          </Link>
        </div>
        <HomepageFooter />
      </div>
    );
  }

  const price = Number(product.price);
  const originalPrice = Number(product.original_price);
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const cond = conditionLabels[product.condition] || conditionLabels.good;
  const allImages = images.length > 0
    ? images.map((i) => i.image_url)
    : product.cover_image_url
      ? [product.cover_image_url]
      : [];
  const emiPerMonth = Math.round(price / 12);

  return (
    <div className="min-h-screen bg-white">
      <HomepageNavbar />

      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="size-3" />
            <Link href="/buy" className="hover:text-primary">Buy Refurbished</Link>
            <ChevronRight className="size-3" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Section */}
      <section className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image Gallery */}
          <div>
            <div className="relative mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              {allImages.length > 0 ? (
                <Image
                  src={allImages[selectedImage] || allImages[0]}
                  alt={product.name}
                  width={500}
                  height={500}
                  className="max-h-[90%] max-w-[90%] object-contain"
                />
              ) : (
                <ShoppingCart className="size-32 text-gray-200" />
              )}
              {discount > 0 && (
                <span className="absolute left-4 top-4 rounded-lg bg-brand-600 px-3 py-1 text-sm font-bold text-white">
                  {discount}% OFF
                </span>
              )}
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex size-16 shrink-0 items-center justify-center rounded-lg border-2 bg-gray-50 transition-all ${
                      idx === selectedImage ? "border-primary" : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Image src={img} alt="" width={56} height={56} className="size-14 rounded object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className={`mb-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold ${cond.color}`}>
              <Check className="size-3.5" /> {cond.label} Condition
            </div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {product.storage && <span>{product.storage}</span>}
              {product.ram && <><span>•</span><span>{product.ram} RAM</span></>}
              {product.color && <><span>•</span><span>{product.color}</span></>}
            </div>

            {/* Price */}
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">{formatInr(price)}</span>
                {originalPrice > price && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatInr(originalPrice)}</span>
                    <span className="rounded-lg bg-brand-100 px-2 py-0.5 text-sm font-bold text-brand-700">
                      Save {formatInr(originalPrice - price)}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                EMI from <span className="font-semibold text-gray-900">{formatInr(emiPerMonth)}/month</span> • No cost EMI available
              </p>
            </div>

            {/* Condition info */}
            <div className="mt-4 rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900">Device Condition: {cond.label}</h3>
              <p className="mt-1 text-sm text-gray-500">{cond.desc}</p>
            </div>

            {/* Key features */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 p-3">
                <Shield className="size-5 text-brand-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">{product.warranty_months} Month Warranty</p>
                  <p className="text-[11px] text-gray-500">Brand warranty</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 p-3">
                <Truck className="size-5 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Free Delivery</p>
                  <p className="text-[11px] text-gray-500">2-4 business days</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 p-3">
                <Zap className="size-5 text-orange-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">15-Day Replacement</p>
                  <p className="text-[11px] text-gray-500">Hassle-free returns</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 p-3">
                <CreditCard className="size-5 text-purple-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Secure Payment</p>
                  <p className="text-[11px] text-gray-500">100% protected</p>
                </div>
              </div>
            </div>

            {/* Quantity + Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2 text-gray-500 hover:text-gray-900">
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="p-2 text-gray-500 hover:text-gray-900">
                  <Plus className="size-4" />
                </button>
              </div>
              <button className="flex-1 rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-90">
                <ShoppingCart className="mr-2 inline size-4" /> Add to Cart
              </button>
              <button className="flex-1 rounded-xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary transition-colors hover:bg-primary/5">
                Buy Now
              </button>
            </div>

            {product.stock <= 5 && product.stock > 0 && (
              <p className="mt-3 text-sm font-medium text-orange-600">⚡ Only {product.stock} left in stock!</p>
            )}
          </div>
        </div>
      </section>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50 py-10">
          <div className="container mx-auto max-w-7xl px-4">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Specifications</h2>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {Object.entries(product.specifications).map(([key, value], idx) => (
                <div key={key} className={`flex items-center ${idx > 0 ? "border-t border-gray-100" : ""}`}>
                  <span className="w-40 shrink-0 bg-gray-50 px-5 py-3.5 text-sm font-medium text-gray-600 sm:w-52">
                    {key}
                  </span>
                  <span className="flex-1 px-5 py-3.5 text-sm text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Description & Detailed Semantic Review */}
      <section className="py-10 border-t border-gray-100">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
              {/* Detailed Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">About this Refurbished Device</h2>
                <div className="prose prose-gray max-w-none text-sm leading-relaxed text-gray-700 space-y-3">
                  <p>{product.description}</p>
                  <p>
                    Every certified pre-owned smartphone sold on Looplic undergoes an extensive 32-point diagnostic hardware and software testing process. Our certified technicians verify motherboard integrity, battery health capacity, display color accuracy, touch latency, and camera sensor precision before certifying the unit for sale. Unlike unverified local marketplace sellers or unregulated second-hand websites, every Looplic refurbished phone comes backed by an assured warranty, verified invoice, authentic accessories, and a dedicated 15-day replacement policy.
                  </p>
                </div>
              </div>

              {/* Comprehensive Buying Guide & Value Proposition */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Why Buy a Certified Refurbished {product.name} from Looplic?</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Purchasing a brand-new flagship smartphone often commands exorbitant retail prices that rapidly depreciate within the first year of ownership. By choosing a certified refurbished {product.name} through Looplic, you enjoy the exact same high-tier performance, premium design, crystal-clear optics, and responsive display at a fraction of the original retail cost—saving up to 70% while keeping harmful electronic waste out of local landfills.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <Shield className="size-4 text-emerald-600" />
                      100% Functional Guarantee
                    </h4>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      Every internal component—from the high-speed processor and thermal heat pipe to the cellular modem and wireless charging coils—has been tested under sustained operational load to ensure zero throttling or hardware instabilities.
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <Truck className="size-4 text-blue-600" />
                      Doorstep Delivery &amp; Inspection
                    </h4>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      We offer rapid doorstep delivery across Bangalore and pan-India shipping with insured courier packaging. In select Bangalore pin codes, you can even request on-spot verification with our delivery specialist before final acceptance.
                    </p>
                  </div>
                </div>
              </div>

              {/* 32-Point Quality Checklist */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Shield className="size-5 text-emerald-600" />
                  Looplic Assured 32-Point Quality Inspection Protocol
                </h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  Each device must clear every milestone before earning our certified seal. Any device with motherboard trace damages or uncertified aftermarket displays is categorically rejected.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-700">
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Display Touch, Multi-Touch &amp; True Tone</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Battery Capacity &gt; 85% Health Guaranteed</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Front &amp; Rear Camera Sensors &amp; OIS</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Stereo Earpiece &amp; Loudspeaker Audio</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Dual Microphone &amp; Noise Cancellation</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Face ID / In-Display Fingerprint Biometrics</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>5G/4G VoLTE, Wi-Fi, Bluetooth &amp; GPS</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Fast Charging Port, Qi Wireless &amp; Thermals</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>100% Military Grade Secure Data Eradication</span>
                  </div>
                </div>
              </div>

              {/* Looplic vs Other Platforms Comparison */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Why Buy from Looplic vs Local Markets &amp; Classfieds?</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-900 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-3">Feature Checklist</th>
                        <th className="p-3 text-emerald-700 bg-emerald-50/70 font-bold">Looplic Assured</th>
                        <th className="p-3 text-gray-500">Local Market / OLX</th>
                        <th className="p-3 text-gray-500">Other Online Portals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="p-3 font-medium">Warranty Protection</td>
                        <td className="p-3 font-bold text-emerald-600 bg-emerald-50/40">Up to 12 Months Comprehensive</td>
                        <td className="p-3 text-red-500">Zero Warranty (As-Is)</td>
                        <td className="p-3">3 to 6 Months (Limited)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Return / Replacement Window</td>
                        <td className="p-3 font-bold text-emerald-600 bg-emerald-50/40">15-Day Instant Replacement</td>
                        <td className="p-3 text-red-500">No Returns Accepted</td>
                        <td className="p-3">7 Days Only</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Diagnostic Inspection</td>
                        <td className="p-3 font-bold text-emerald-600 bg-emerald-50/40">32-Point Certified Check</td>
                        <td className="p-3 text-red-500">Unverified / High Risk</td>
                        <td className="p-3">Standard Check</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Doorstep Service in Bangalore</td>
                        <td className="p-3 font-bold text-emerald-600 bg-emerald-50/40">Free Technician Visits</td>
                        <td className="p-3 text-red-500">None</td>
                        <td className="p-3">Courier shipping only</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Data Security Guarantee</td>
                        <td className="p-3 font-bold text-emerald-600 bg-emerald-50/40">NIST 800-88 Compliant Wipe</td>
                        <td className="p-3 text-red-500">No Data Sanitization</td>
                        <td className="p-3">Basic Factory Reset</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Payment Flexibility</td>
                        <td className="p-3 font-bold text-emerald-600 bg-emerald-50/40">No-Cost EMI, UPI, Cards, COD</td>
                        <td className="p-3 text-red-500">Cash / UPI Only (No EMI)</td>
                        <td className="p-3">Cards &amp; UPI</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Condition Grading Guide */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Understanding Looplic Condition Grades</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We maintain strict, honest cosmetic definitions so you always receive exactly what you paid for. All grades share the identical 100% flawless technical and internal hardware operation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-3.5">
                    <span className="font-bold text-emerald-800 text-sm">Superb / Like New</span>
                    <p className="mt-1 text-gray-700 leading-relaxed">
                      Flawless display glass and body housing with zero visible scratches or scuffs. Looks and feels virtually brand-new. Battery health &gt; 90%.
                    </p>
                  </div>
                  <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-3.5">
                    <span className="font-bold text-blue-800 text-sm">Excellent</span>
                    <p className="mt-1 text-gray-700 leading-relaxed">
                      Display is pristine with no marks. Casing may have 1 or 2 faint micro-scratches imperceptible from an arm&apos;s length. Battery health &gt; 85%.
                    </p>
                  </div>
                  <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-3.5">
                    <span className="font-bold text-indigo-800 text-sm">Good</span>
                    <p className="mt-1 text-gray-700 leading-relaxed">
                      Light cosmetic wear, faint micro-scratches on bezel or rear glass. Absolutely no dents or cracks. Fully functional with verified battery life.
                    </p>
                  </div>
                  <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-3.5">
                    <span className="font-bold text-amber-800 text-sm">Fair / Value Grade</span>
                    <p className="mt-1 text-gray-700 leading-relaxed">
                      Visible signs of past usage such as surface scratches or minor cosmetic scuffs on the back panel, but 100% functional screen and internal hardware. Maximum savings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Environmental Impact Section */}
              <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 space-y-2">
                <h3 className="text-lg font-bold text-teal-950 flex items-center gap-2">
                  <Zap className="size-5 text-teal-600" />
                  Sustainable Recommerce: Your Positive Planet Impact
                </h3>
                <p className="text-xs text-teal-900 leading-relaxed">
                  Manufacturing a single new smartphone generates approximately 80 kilograms of carbon emissions and consumes scarce precious metals including cobalt, lithium, copper, and gold. By purchasing a certified refurbished smartphone from Looplic, you directly prevent hazardous electronic waste, reduce carbon footprints by up to 78%, and accelerate India&apos;s transition to a sustainable circular economy.
                </p>
              </div>

              {/* Frequently Asked Questions (FAQ) */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <h4 className="font-semibold text-sm text-gray-900">What does 'Certified Refurbished' mean at Looplic?</h4>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      A certified refurbished device is a gently used or open-box phone that has undergone rigorous cosmetic restoration, complete component diagnostics across 32 checkpoints, battery capacity validation, and certified sanitization. It functions identically to a brand-new device out of the factory box.
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <h4 className="font-semibold text-sm text-gray-900">What is covered under the Looplic Comprehensive Warranty?</h4>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      Our warranty covers all internal electronic components including logic board issues, unexpected display flickering, touch digitizer latency, camera autofocus failures, speaker distortion, biometric sensor faults, and charging circuitry. Physical drops, deep water submersion, and unauthorized third-party tampering are excluded.
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <h4 className="font-semibold text-sm text-gray-900">Can I sell or exchange my old device when buying this phone?</h4>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      Yes! You can use Looplic&apos;s instant trade-in feature to calculate your existing smartphone, laptop, or tablet valuation in 10 seconds. You can choose to receive direct UPI cash or an exchange discount code to reduce the purchase price of your refurbished phone.
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <h4 className="font-semibold text-sm text-gray-900">What accessories are included in the refurbished package?</h4>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      Every phone arrives securely packaged in a Looplic custom tamper-evident box accompanied by an MFi/BIS-certified fast charging cable, a SIM ejector tool, and a valid tax invoice with your warranty QR card.
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <h4 className="font-semibold text-sm text-gray-900">What happens if I encounter an issue within 15 days?</h4>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      If your device develops any technical defect within the first 15 days of delivery, contact our Bangalore support desk. We will schedule a free reverse pickup from your doorstep and promptly dispatch an identical replacement or issue a full refund as per your preference.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Internal Linking & Value-adds */}
            <div className="lg:col-span-4 space-y-6">
              {/* Trade-in / Sell Phone Banner */}
              <div className="rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 p-6 text-white shadow-lg">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-brandcyan-300">
                  Upgrade &amp; Save
                </span>
                <h3 className="text-lg font-bold mt-1">Want to sell your old phone?</h3>
                <p className="text-xs text-gray-200 mt-2">
                  Get the best exchange price in Bangalore with instant UPI payment and free doorstep pickup.
                </p>
                <Link
                  href="/sell"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-brand-900 hover:bg-gray-100 transition-colors"
                >
                  Calculate Old Phone Value <ChevronRight className="size-3.5" />
                </Link>
              </div>

              {/* Need Repair? */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h4 className="font-bold text-sm text-gray-900">Need Screen or Battery Repair?</h4>
                <p className="mt-1 text-xs text-gray-500">
                  Got an existing phone with a broken display? We fix mobile screens in 30 minutes at your doorstep in Bangalore.
                </p>
                <div className="mt-3 flex flex-col gap-1.5 text-xs">
                  <Link href="/apple-iphone-screen-replacement" className="text-brand-600 hover:underline font-medium">
                    • Apple iPhone Screen Replacement
                  </Link>
                  <Link href="/samsung-screen-replacement" className="text-brand-600 hover:underline font-medium">
                    • Samsung Galaxy Screen Replacement
                  </Link>
                  <Link href="/oneplus-screen-replacement" className="text-brand-600 hover:underline font-medium">
                    • OnePlus Screen Replacement
                  </Link>
                  <Link href="/service/mobile-repair" className="text-brand-600 hover:underline font-medium">
                    • All Mobile Repair Services
                  </Link>
                  <Link href="/service/laptop-repair" className="text-brand-600 hover:underline font-medium">
                    • Laptop Repair &amp; Diagnostics
                  </Link>
                  <Link href="/store-locator" className="text-brand-600 hover:underline font-medium">
                    • Visit Bengaluru Store (Town Hall)
                  </Link>
                </div>
              </div>

              {/* Popular Categories Links */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h4 className="font-bold text-sm text-gray-900 mb-2">Browse More Refurbished Models</h4>
                <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                  <Link href="/buy" className="hover:text-primary transition-colors">• All Refurbished Phones &amp; Laptops</Link>
                  <Link href="/buy?category=phone&amp;brand=Apple" className="hover:text-primary transition-colors">• Refurbished Apple iPhones (11 to 16 Pro Max)</Link>
                  <Link href="/buy?category=phone&amp;brand=Samsung" className="hover:text-primary transition-colors">• Refurbished Samsung Galaxy (S21 to S25 Ultra)</Link>
                  <Link href="/buy?category=phone&amp;brand=OnePlus" className="hover:text-primary transition-colors">• Refurbished OnePlus Flagships (Nord to 12)</Link>
                  <Link href="/buy?category=phone&amp;brand=Google" className="hover:text-primary transition-colors">• Refurbished Google Pixel (6 to 9 Pro XL)</Link>
                  <Link href="/bangalore" className="hover:text-primary transition-colors">• Doorstep Delivery Areas in Bangalore</Link>
                  <Link href="/refund-policy" className="hover:text-primary transition-colors">• 7-Day Replacement &amp; Warranty Policy</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Schema.org Product data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: allImages[0] || product.cover_image_url,
            description: product.description,
            sku: product.slug,
            offers: {
              "@type": "Offer",
              url: `https://www.looplic.com/buy/${product.slug}`,
              priceCurrency: "INR",
              price: price,
              priceValidUntil: "2027-12-31",
              itemCondition: "https://schema.org/RefurbishedCondition",
              availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Organization",
                name: "Looplic",
              },
            },
          }),
        }}
      />

      <HomepageFooter />
    </div>
  );
}
