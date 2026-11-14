"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Phone, Menu, X } from "lucide-react";
import { LAB_CONTACT } from "./recovery-data";
import { RecoveryButton } from "./RecoveryButton";
import { RECOVERY_TOKENS } from "./recovery-tokens";

export function RecoveryNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Services", href: "#services" },
    { label: "Emergency Guide", href: "#emergency" },
    { label: "Process & Lab", href: "#process" },
    { label: "Pricing & SLAs", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const trackPhoneClick = (source: string) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "contact_phone_click", {
        event_category: "Data Recovery Contact",
        event_label: source,
      });
    }
  };

  return (
    <>
      {/* ─── Top Calm Notice ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 border-b border-slate-800">
        <div className={`${RECOVERY_TOKENS.layout.container} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Looplic Data Recovery Lab · <strong className="text-white">Free Initial Diagnostics</strong> across Bengaluru
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <a
              href={`tel:${LAB_CONTACT.phoneClean}`}
              onClick={() => trackPhoneClick("Announcement Bar Phone")}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="size-3.5 text-emerald-400" />
              <span>{LAB_CONTACT.phoneFormatted}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── Main Header Navigation (5 Links Maximum) ────────────────────────── */}
      <header
        className={`sticky top-0 z-40 w-full bg-white transition-all duration-200 ${
          scrolled ? "shadow-sm border-b border-slate-200" : "border-b border-slate-200"
        }`}
      >
        <div className={`${RECOVERY_TOKENS.layout.container} flex h-20 items-center justify-between`}>
          {/* Logo & Lab Identifier */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg">
              <Image
                src="/looplic-logo.webp"
                alt="Looplic Logo"
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>
            <span className="hidden sm:inline-block h-5 w-px bg-slate-300" />
            <span className="hidden sm:inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
              Data Recovery Lab
            </span>
          </div>

          {/* 5 Primary Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-slate-800 hover:text-emerald-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Area: Single Primary Button */}
          <div className="flex items-center gap-4">
            <a
              href={`tel:${LAB_CONTACT.phoneClean}`}
              onClick={() => trackPhoneClick("Header Call Link")}
              className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-emerald-700 transition-colors"
            >
              <Phone className="size-4 text-emerald-600" />
              <span>{LAB_CONTACT.phoneFormatted}</span>
            </a>

            <RecoveryButton href="#book">
              Book Diagnosis
            </RecoveryButton>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex size-11 items-center justify-center rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 lg:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Drawer Menu ─────────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-6 lg:hidden animate-in fade-in duration-150">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center min-h-[44px] rounded-lg px-3 text-base font-semibold text-slate-900 hover:bg-slate-50"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-3">
                <a
                  href={`tel:${LAB_CONTACT.phoneClean}`}
                  onClick={() => {
                    trackPhoneClick("Mobile Drawer Phone");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-slate-300 font-semibold text-slate-900"
                >
                  <Phone className="size-4 text-emerald-600" />
                  <span>Call Lab ({LAB_CONTACT.phoneFormatted})</span>
                </a>
                <RecoveryButton href="#book" onClick={() => setMobileMenuOpen(false)}>
                  Book Free Diagnosis
                </RecoveryButton>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
