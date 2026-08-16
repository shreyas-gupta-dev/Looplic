"use client";

import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { companyAddress, companyName, supportEmail, supportPhone, supportPhoneDisplay } from "@/src/lib/company";

const sellLinks = [
  { href: "/sell", label: "Sell Old Mobile Phone" },
  { href: "/sell/laptop", label: "Sell Old Laptop" },
  { href: "/sell/tablet", label: "Sell Old Tablet" },
  { href: "/sell/smartwatch", label: "Sell Old Smartwatch" },
  { href: "/sell/desktop", label: "Sell Old Desktop/iMac" },
  { href: "/sell/gaming-console", label: "Sell Gaming Console" },
];

const sellBrandLinks = [
  { href: "/sell/phone/apple", label: "Sell Old iPhone" },
  { href: "/sell/phone/samsung", label: "Sell Old Samsung" },
  { href: "/sell/phone/oneplus", label: "Sell Old OnePlus" },
  { href: "/sell/phone/xiaomi", label: "Sell Old Xiaomi" },
  { href: "/sell/phone/vivo", label: "Sell Old Vivo" },
  { href: "/sell/phone/oppo", label: "Sell Old OPPO" },
  { href: "/sell/laptop/apple", label: "Sell Old MacBook" },
];

const buyLinks = [
  { href: "/buy?category=phone", label: "Refurbished Phones" },
  { href: "/buy?category=laptop", label: "Refurbished Laptops" },
  { href: "/buy?category=tablet", label: "Refurbished Tablets" },
  { href: "/buy?brand=Apple", label: "Refurbished iPhones" },
  { href: "/buy?brand=Samsung", label: "Refurbished Samsung" },
  { href: "/buy?brand=OnePlus", label: "Refurbished OnePlus" },
];

const companyLinks = [
  { href: "/about-us", label: "About Us" },
  { href: "/blog", label: "Blog" },
  { href: "/partners", label: "Partners/Franchise" },
  { href: "/sell/corporate", label: "Corporate / Bulk" },
  { href: "/store-locator", label: "Store Locator" },
  { href: "/careers", label: "Careers" },
];

const supportLinks = [
  { href: "/faq", label: "FAQ / Help Center" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/sell/track", label: "Track Your Order" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Return & Refund Policy" },
];

const socialLinks = [
  { href: "https://instagram.com/looplic", icon: Instagram, label: "Instagram" },
  { href: "https://facebook.com/looplic", icon: Facebook, label: "Facebook" },
  { href: "https://twitter.com/looplic", icon: Twitter, label: "Twitter/X" },
  { href: "https://linkedin.com/company/looplic", icon: Linkedin, label: "LinkedIn" },
  { href: "https://youtube.com/looplic", icon: Youtube, label: "YouTube" },
];

export function HomepageFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-gray-300">
      {/* Main footer content */}
      <div className="container mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Column 1: Brand + Contact */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-block">
              <Image
                src="/looplic-logo.webp"
                alt={companyName}
                width={130}
                height={36}
                className="h-9 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              India&apos;s most trusted platform to sell and buy refurbished devices.
              Get instant price quotes, free doorstep pickup, and certified refurbished with warranty.
            </p>

            <div className="mt-5 space-y-2.5">
              <a href={`tel:+91${supportPhone}`} className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white">
                <Phone className="size-4" /> {supportPhoneDisplay}
              </a>
              <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white">
                <Mail className="size-4" /> {supportEmail}
              </a>
              <div className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>{companyAddress}</span>
              </div>
            </div>

            {/* Social icons */}
            <div className="mt-5 flex items-center gap-2.5">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:bg-primary hover:text-white"
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Sell */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Sell Device
            </h4>
            <ul className="space-y-2.5">
              {sellLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Buy Refurbished */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Buy Refurbished
            </h4>
            <ul className="space-y-2.5">
              {buyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Company
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Support */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Support
            </h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* App Download */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-800/50 p-5 sm:flex-row">
          <div>
            <p className="text-sm font-semibold text-white">Download the Looplic App</p>
            <p className="mt-0.5 text-xs text-gray-400">Sell & buy on the go. Available on Android & iOS.</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-gray-900 transition-opacity hover:opacity-90">
              Google Play
            </a>
            <a href="#" className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-gray-900 transition-opacity hover:opacity-90">
              App Store
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row lg:px-8">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>ISO 27001 Certified</span>
            <span className="text-gray-700">•</span>
            <span>Startup India Recognized</span>
            <span className="text-gray-700">•</span>
            <span>DIPP Registered</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
