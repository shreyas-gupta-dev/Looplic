"use client";

import { ArrowLeft, Loader2, Minus, Plus, ShoppingCart, Trash2, Shield, Truck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  price: string;
  originalPrice: string;
  condition: string;
  storage: string | null;
  ram: string | null;
  color: string | null;
  stock: number;
  coverImageUrl: string | null;
  warrantyMonths: number;
};

function formatInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function CartPageView() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch cart:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    setUpdating(cartItemId);
    try {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity }),
      });
      setItems((prev) => prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)));
    } catch (e) {
      toast.error("Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartItemId: string) => {
    setUpdating(cartItemId);
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId }),
      });
      setItems((prev) => prev.filter((i) => i.id !== cartItemId));
      toast.success("Item removed from cart");
    } catch (e) {
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const totalSavings = items.reduce(
    (sum, item) => sum + (Number(item.originalPrice) - Number(item.price)) * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomepageNavbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
        <HomepageFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomepageNavbar />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/buy" className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
            <ArrowLeft className="size-4" /> Continue Shopping
          </Link>
        </div>

        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Shopping Cart {items.length > 0 && <span className="text-gray-400">({items.length})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-20 text-center">
            <ShoppingCart className="mx-auto mb-4 size-16 text-gray-200" />
            <h2 className="text-lg font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-1 text-sm text-gray-500">Browse our refurbished devices and add items to your cart.</p>
            <Link href="/buy" className="mt-6 inline-flex rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    {item.coverImageUrl ? (
                      <Image src={item.coverImageUrl} alt={item.productName} width={80} height={80} className="size-20 object-contain" />
                    ) : (
                      <ShoppingCart className="size-8 text-gray-200" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link href={`/buy/${item.productSlug}`} className="font-semibold text-gray-900 hover:text-primary">
                        {item.productName}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {[item.storage, item.ram, item.color].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1 || updating === item.id}
                          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                          disabled={item.quantity >= item.stock || updating === item.id}
                          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"
                        >
                          <Plus className="size-3.5" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updating === item.id}
                          className="ml-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="size-3.5" /> Remove
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatInr(Number(item.price) * item.quantity)}</p>
                        {Number(item.originalPrice) > Number(item.price) && (
                          <p className="text-xs text-gray-400 line-through">{formatInr(Number(item.originalPrice) * item.quantity)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal ({items.length} items)</span>
                    <span className="font-semibold text-gray-900">{formatInr(subtotal)}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total Savings</span>
                      <span className="font-semibold">-{formatInr(totalSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">{formatInr(subtotal)}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Proceed to Checkout
                </Link>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="size-4 text-green-600" /> 6-month warranty on all devices
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Truck className="size-4 text-blue-600" /> Free delivery within 2-4 days
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <HomepageFooter />
    </div>
  );
}
