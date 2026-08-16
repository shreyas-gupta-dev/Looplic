"use client";

import { BadgeIndianRupee, Building2, Check, HandshakeIcon, Loader2, MapPin, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "High Revenue Potential",
    description: "Earn attractive commissions on every device sold through your store. Average monthly earnings of ₹2–5 lakhs.",
  },
  {
    icon: Building2,
    title: "Low Investment, High Returns",
    description: "Start with minimal investment. We provide training, marketing support, and tech infrastructure — you provide the location.",
  },
  {
    icon: Users,
    title: "Growing Market",
    description: "The refurbished device market is growing 25% year-over-year. Tap into India's massive demand for affordable technology.",
  },
  {
    icon: BadgeIndianRupee,
    title: "Multiple Revenue Streams",
    description: "Earn from device buyback, refurbished sales, repairs, and accessories — all under one roof.",
  },
  {
    icon: HandshakeIcon,
    title: "Full Support",
    description: "Dedicated partner manager, marketing materials, POS system, inventory management, and ongoing training included.",
  },
  {
    icon: MapPin,
    title: "Territory Protection",
    description: "Exclusive territory rights ensure no other Looplic partner operates within your designated area.",
  },
];

export function PartnersPageView() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.city.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setStatus("submitting");

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus("done");
      toast.success("Application submitted! We'll be in touch soon.");
    } catch {
      setStatus("error");
      toast.error("Something went wrong. Please try again.");
    }
  }

  const inputClassName =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#48C479] focus:ring-2 focus:ring-[#48C479]/20";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <HomepageNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-white px-4 py-12 text-center">
        <div className="container mx-auto max-w-2xl">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#48C479]/10">
            <HandshakeIcon className="size-7 text-[#48C479]" />
          </div>
          <h1 className="text-[28px] font-bold text-gray-900 sm:text-[36px]">Partner with Looplic</h1>
          <p className="mt-2 text-[15px] text-gray-500">
            Join India&apos;s fastest-growing refurbished electronics platform. Open a franchise and build a profitable business with full support.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 text-center">
          <h2 className="text-[22px] font-bold text-gray-900">Why Partner with Looplic?</h2>
          <p className="mt-2 text-[14px] text-gray-500">Everything you need to build a successful local electronics business.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-green-50">
                  <Icon className="size-5 text-[#48C479]" />
                </div>
                <h3 className="text-[14px] font-bold text-gray-900">{benefit.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-gray-500">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Partner Form */}
      <section className="container mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-center text-[20px] font-bold text-gray-900">Apply to Become a Partner</h2>
          <p className="mt-2 text-center text-[14px] text-gray-500">Fill in your details and our partnerships team will contact you within 48 hours.</p>

          {status === "done" ? (
            <div className="mt-8 rounded-2xl border border-green-100 bg-green-50/60 p-8 text-center">
              <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-white shadow-sm">
                <Check className="size-7 text-[#48C479]" />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900">Application Submitted!</h3>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-gray-600">
                Thank you for your interest in partnering with Looplic. Our team will review your application and reach out within 2 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Full Name *</span>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={inputClassName}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Email *</span>
                  <input
                    required
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    className={inputClassName}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Phone *</span>
                  <input
                    required
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="98765 43210"
                    className={inputClassName}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-bold text-gray-700">City *</span>
                  <input
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Your city"
                    className={inputClassName}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Message (optional)</span>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us about your business experience, available investment, and preferred location..."
                  className={`${inputClassName} resize-none`}
                />
              </label>

              {status === "error" && (
                <p className="text-[12px] font-semibold text-rose-500">Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#48C479] px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:bg-[#3daa68] disabled:opacity-60"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Partnership Application"
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      <HomepageFooter />
    </div>
  );
}
