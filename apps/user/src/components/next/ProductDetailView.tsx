"use client";

import { ArrowLeft, Check, ChevronRight, CreditCard, Heart, Minus, Plus, Shield, ShoppingCart, Star, Truck, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

type ProductDetailViewProps = {
  slug: string;
};

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
  excellent: { label: "Excellent", color: "bg-green-100 text-green-700 border-green-200", desc: "Barely any signs of use, like new" },
  superb: { label: "Superb", color: "bg-emerald-100 text-emerald-700 border-emerald-200", desc: "Flawless condition, premium grade" },
  unboxed: { label: "Unboxed", color: "bg-purple-100 text-purple-700 border-purple-200", desc: "Brand new, open box item" },
};

function formatInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function ProductDetailView({ slug }: ProductDetailViewProps) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
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
  }, [slug]);

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
                <span className="absolute left-4 top-4 rounded-lg bg-green-600 px-3 py-1 text-sm font-bold text-white">
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
                    <span className="rounded-lg bg-green-100 px-2 py-0.5 text-sm font-bold text-green-700">
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
                <Shield className="size-5 text-green-600" />
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

      {/* Description */}
      {product.description && (
        <section className="py-10">
          <div className="container mx-auto max-w-7xl px-4">
            <h2 className="mb-4 text-xl font-bold text-gray-900">About this product</h2>
            <div className="prose prose-gray max-w-none text-sm leading-relaxed text-gray-600">
              <p>{product.description}</p>
            </div>
          </div>
        </section>
      )}

      <HomepageFooter />
    </div>
  );
}
