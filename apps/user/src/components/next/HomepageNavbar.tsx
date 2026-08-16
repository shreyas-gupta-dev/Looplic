"use client";

import { ChevronDown, Menu, Phone, Search, User, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";

import { AuthHeaderActions } from "@/src/components/next/AuthHeaderActions";
import { supportPhone } from "@/src/lib/company";

function AuthHeaderFallback({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link
      href="/auth"
      className={
        mobile
          ? "px-2 py-1 text-xs font-bold text-primary"
          : "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      }
    >
      Login
    </Link>
  );
}

const sellCategories = [
  { href: "/sell", label: "Sell Mobile Phone", icon: "📱" },
  { href: "/sell/laptop", label: "Sell Laptop", icon: "💻" },
  { href: "/sell/tablet", label: "Sell Tablet", icon: "📟" },
  { href: "/sell/smartwatch", label: "Sell Smartwatch", icon: "⌚" },
  { href: "/sell/gaming-console", label: "Sell Gaming Console", icon: "🎮" },
  { href: "/sell/desktop", label: "Sell Desktop/iMac", icon: "🖥️" },
];

const sellBrands = [
  { href: "/sell/phone/apple", label: "Sell Apple" },
  { href: "/sell/phone/samsung", label: "Sell Samsung" },
  { href: "/sell/phone/oneplus", label: "Sell OnePlus" },
  { href: "/sell/phone/xiaomi", label: "Sell Xiaomi" },
  { href: "/sell/phone/vivo", label: "Sell Vivo" },
  { href: "/sell/phone/oppo", label: "Sell OPPO" },
];

const buyCategories = [
  { href: "/buy?category=phone", label: "Refurbished Phones", icon: "📱" },
  { href: "/buy?category=laptop", label: "Refurbished Laptops", icon: "💻" },
  { href: "/buy?category=tablet", label: "Refurbished Tablets", icon: "📟" },
];

const moreLinks = [
  { href: "/about-us", label: "About Us" },
  { href: "/blog", label: "Blog" },
  { href: "/sell/corporate", label: "Corporate / Bulk" },
  { href: "/partners", label: "Partners" },
  { href: "/faq", label: "FAQ / Help" },
  { href: "/contact-us", label: "Contact Us" },
];

export function HomepageNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openDropdown = (key: string) => setActiveDropdown(key);
  const closeDropdown = () => setActiveDropdown(null);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white transition-shadow duration-200 ${
        scrolled ? "shadow-md border-gray-200" : "border-transparent"
      }`}
    >
      {/* Top info bar */}
      <div className="hidden border-b border-gray-100 bg-gray-50 lg:block">
        <div className="container mx-auto flex h-8 max-w-7xl items-center justify-between px-6 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>🇮🇳 India&apos;s #1 Device Recommerce Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/store-locator" className="hover:text-primary transition-colors">Store Locator</Link>
            <span className="text-gray-300">|</span>
            <Link href="/sell/track" className="hover:text-primary transition-colors">Track Order</Link>
            <span className="text-gray-300">|</span>
            <a href={`tel:+91${supportPhone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="size-3" /> Support
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav aria-label="Primary" className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <Image
            src="/looplic-logo.webp"
            alt="Looplic"
            width={130}
            height={36}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-0.5 text-sm font-medium text-gray-700 lg:flex">
          {/* Sell Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openDropdown("sell")}
            onMouseLeave={closeDropdown}
          >
            <button className="flex items-center gap-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 hover:text-primary">
              Sell Device
              <ChevronDown className={`size-3.5 transition-transform ${activeDropdown === "sell" ? "rotate-180" : ""}`} />
            </button>
            {activeDropdown === "sell" && (
              <div className="absolute left-0 top-full w-[520px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-gray-400">By Category</p>
                    {sellCategories.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-green-50 hover:text-primary"
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div>
                    <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-gray-400">By Brand</p>
                    {sellBrands.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-lg px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-green-50 hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buy Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openDropdown("buy")}
            onMouseLeave={closeDropdown}
          >
            <button className="flex items-center gap-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 hover:text-primary">
              Buy Refurbished
              <ChevronDown className={`size-3.5 transition-transform ${activeDropdown === "buy" ? "rotate-180" : ""}`} />
            </button>
            {activeDropdown === "buy" && (
              <div className="absolute left-0 top-full w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                {buyCategories.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Direct links */}
          <Link href="/service/mobile" className="rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 hover:text-primary">
            Repair
          </Link>
          <Link href="/store-locator" className="rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 hover:text-primary">
            Store Locator
          </Link>

          {/* More Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openDropdown("more")}
            onMouseLeave={closeDropdown}
          >
            <button className="flex items-center gap-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 hover:text-primary">
              More
              <ChevronDown className={`size-3.5 transition-transform ${activeDropdown === "more" ? "rotate-180" : ""}`} />
            </button>
            {activeDropdown === "more" && (
              <div className="absolute right-0 top-full w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                {moreLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Desktop */}
        <div className="hidden items-center gap-2 lg:flex">
          <Suspense fallback={<AuthHeaderFallback />}>
            <AuthHeaderActions />
          </Suspense>
        </div>

        {/* Mobile right side */}
        <div className="flex items-center gap-2 lg:hidden">
          <Suspense fallback={<AuthHeaderFallback mobile />}>
            <AuthHeaderActions />
          </Suspense>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-gray-700"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-6 pt-4 lg:hidden">
          <div className="space-y-1">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              Sell Device
            </p>
            {sellCategories.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-primary"
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}

            <div className="my-3 border-t border-gray-100" />

            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              Buy Refurbished
            </p>
            {buyCategories.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50"
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}

            <div className="my-3 border-t border-gray-100" />

            <Link href="/service/mobile" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Repair
            </Link>
            <Link href="/store-locator" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Store Locator
            </Link>

            <div className="my-3 border-t border-gray-100" />

            {moreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
