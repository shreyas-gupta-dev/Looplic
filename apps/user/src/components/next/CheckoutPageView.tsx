"use client";

import { ArrowLeft, CheckCircle, CreditCard, Loader2, MapPin, Shield, ShoppingCart, Truck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Script from "next/script";

import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

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

export function CheckoutPageView() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string[] | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");

  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, []);

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!fullName.trim() || !phone.trim() || !address.trim() || !pincode.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    setPlacing(true);
    try {
      // Place the order first
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: `${fullName}, ${address}`,
          shippingCity: city,
          shippingPincode: pincode,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (paymentMethod === "online") {
        // Initiate Razorpay payment
        await initiateRazorpayPayment(subtotal, data.orders[0]?.orderCode);
      }

      setOrderSuccess(data.orders.map((o: any) => o.orderCode));
      toast.success("Order placed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const initiateRazorpayPayment = async (amount: number, orderCode: string) => {
    // Create Razorpay order
    const createRes = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        receipt: orderCode,
        notes: { orderCode },
      }),
    });

    const orderData = await createRes.json();
    if (!createRes.ok) throw new Error(orderData.error || "Payment initiation failed");

    // Open Razorpay checkout
    return new Promise<void>((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error("Payment gateway not loaded. Please refresh and try again."));
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Looplic",
        description: `Order ${orderCode}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderCode,
            }),
          });

          if (verifyRes.ok) {
            resolve();
          } else {
            reject(new Error("Payment verification failed"));
          }
        },
        prefill: {
          name: fullName,
          contact: phone,
        },
        theme: {
          color: "#48C479",
        },
        modal: {
          ondismiss: function () {
            reject(new Error("Payment cancelled"));
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

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

  // Order success state
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomepageNavbar />
        <div className="container mx-auto max-w-lg px-4 py-16 text-center">
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <CheckCircle className="mx-auto mb-4 size-16 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h1>
            <p className="mt-2 text-gray-500">Your order has been confirmed and will be shipped within 2-4 business days.</p>
            <div className="mt-4 space-y-1">
              {orderSuccess.map((code) => (
                <p key={code} className="text-sm font-medium text-gray-700">
                  Order ID: <span className="font-bold text-primary">{code}</span>
                </p>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/account" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white">
                View My Orders
              </Link>
              <Link href="/buy" className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
        <HomepageFooter />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomepageNavbar />
        <div className="container mx-auto max-w-lg px-4 py-16 text-center">
          <ShoppingCart className="mx-auto mb-4 size-16 text-gray-200" />
          <h1 className="text-xl font-bold text-gray-900">Your cart is empty</h1>
          <Link href="/buy" className="mt-4 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white">
            Shop Now
          </Link>
        </div>
        <HomepageFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomepageNavbar />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Link href="/cart" className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Cart
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-gray-900">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Shipping Address */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
                <MapPin className="size-5 text-primary" /> Shipping Address
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Pincode *</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="6-digit pincode"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Address *</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="House/Flat No., Building, Street, Area"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="City"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
                <CreditCard className="size-5 text-primary" /> Payment Method
              </h3>
              <div className="space-y-3">
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${paymentMethod === "online" ? "border-primary bg-green-50/50" : "border-gray-200"}`}>
                  <input type="radio" name="payment" value="online" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} className="text-primary focus:ring-primary" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Pay Online (UPI / Card / Net Banking)</p>
                    <p className="text-xs text-gray-500">Pay securely via Razorpay</p>
                  </div>
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${paymentMethod === "cod" ? "border-primary bg-green-50/50" : "border-gray-200"}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="text-primary focus:ring-primary" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Cash on Delivery (COD)</p>
                    <p className="text-xs text-gray-500">Pay when your device arrives</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-bold text-gray-900">Order Summary</h3>
              <div className="mt-4 max-h-60 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                      {item.coverImageUrl ? (
                        <Image src={item.coverImageUrl} alt="" width={40} height={40} className="size-10 object-contain" />
                      ) : (
                        <ShoppingCart className="size-5 text-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-medium text-gray-900 line-clamp-1">{item.productName}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatInr(Number(item.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatInr(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="text-green-600 font-medium">FREE</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold">
                  <span>Total</span><span>{formatInr(subtotal)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {placing ? <Loader2 className="size-4 animate-spin" /> : null}
                {placing ? "Placing Order..." : `Place Order • ${formatInr(subtotal)}`}
              </button>

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <p className="flex items-center gap-1.5"><Shield className="size-3.5 text-green-600" /> 100% secure payments</p>
                <p className="flex items-center gap-1.5"><Truck className="size-3.5 text-blue-600" /> Delivery within 2-4 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HomepageFooter />

      {/* Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}
