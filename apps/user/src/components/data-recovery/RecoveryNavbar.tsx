"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Phone, MessageSquare, Menu, X, ShieldCheck, ArrowRight } from "lucide-react";
import { LAB_CONTACT } from "./recovery-data";

export function RecoveryNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Devices & Issues", href: "#services" },
    { label: "How It Works", href: "#process" },
    { label: "Why Looplic", href: "#why-us" },
    { label: "Pricing Tiers", href: "#pricing" },
    { label: "Track Case", href: "#track" },
    { label: "FAQ", href: "#faq" },
    { label: "Lab Location", href: "#contact" },
  ];

  const trackPhoneClick = (source: string) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "contact_phone_click", {
        event_category: "Data Recovery Contact",
        event_label: source,
      });
    }
  };

  const trackWhatsAppClick = (source: string) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "contact_whatsapp_click", {
        event_category: "Data Recovery Contact",
        event_label: source,
      });
    }
  };

  return (
    <>
      {/* ─── Top Announcement Bar ─────────────────────────────────────────────── */}
      <div className="bg-[#0c1838] px-4 py-2 text-xs font-medium text-slate-200">
        <div className="container mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Looplic Data Recovery Lab · <strong className="text-white">Free Initial Diagnosis</strong> across Bengaluru
            </span>
          </div>
          <div className="hidden items-center gap-5 sm:flex">
            <a
              href={`tel:${LAB_CONTACT.phone}`}
              onClick={() => trackPhoneClick("Announcement Bar Phone")}
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Phone className="size-3.5 text-emerald-400" />
              <span>{LAB_CONTACT.phoneFormatted}</span>
            </a>
            <a
              href={`https://wa.me/${LAB_CONTACT.whatsapp}?text=${encodeURIComponent("Hi Looplic Data Recovery, I need help recovering my storage device.")}`}
              onClick={() => trackWhatsAppClick("Announcement Bar WhatsApp")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <MessageSquare className="size-3.5" />
              <span>WhatsApp Engineer</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── Main Header Navigation ───────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          scrolled ? "bg-white/95 shadow-md backdrop-blur-md" : "bg-white border-b border-slate-100"
        }`}
      >
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/looplic-logo.webp"
                alt="Looplic Logo"
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>
            <span className="hidden h-5 w-px bg-slate-200 sm:inline-block" />
            <span className="hidden rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 sm:inline-block">
              Data Recovery Lab
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-semibold text-slate-600 transition-colors hover:text-emerald-600 xl:text-sm"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <a
              href={`tel:${LAB_CONTACT.phone}`}
              className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 md:flex"
            >
              <Phone className="size-3.5 text-slate-500" />
              <span>Call Lab</span>
            </a>

            <a
              href="#book"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow sm:text-sm"
            >
              <span>Book Diagnosis</span>
              <ArrowRight className="size-3.5" />
            </a>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Drawer Menu ─────────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
                <a
                  href={`tel:${LAB_CONTACT.phone}`}
                  onClick={() => trackPhoneClick("Mobile Drawer Phone")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-800"
                >
                  <Phone className="size-4 text-emerald-600" />
                  <span>Call Lab ({LAB_CONTACT.phoneFormatted})</span>
                </a>
                <a
                  href={`https://wa.me/${LAB_CONTACT.whatsapp}?text=${encodeURIComponent("Hi Looplic Data Recovery, I need help recovering my storage device.")}`}
                  onClick={() => trackWhatsAppClick("Mobile Drawer WhatsApp")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  <MessageSquare className="size-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
