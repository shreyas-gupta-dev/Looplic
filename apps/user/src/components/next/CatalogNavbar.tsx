"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { useState } from "react";

import logo from "@/assets/looplic-logo.webp";
import { AuthHeaderActions } from "@/src/components/next/AuthHeaderActions";
import { InstallAppButton } from "@/src/components/next/InstallAppButton";

function AuthHeaderFallback({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link href="/auth" className={mobile ? "px-2 py-1 text-xs font-bold text-primary" : "rounded-lg gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"}>
      Sign In
    </Link>
  );
}

export function CatalogNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/">
          <img src={logo.src} alt="Looplic" className="h-8 md:h-7" />
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/service/mobile-repair/brands" className="transition-colors hover:text-foreground">
            Brands
          </Link>
          <Link href="/service/mobile-repair" className="transition-colors hover:text-foreground">
            Repairs
          </Link>
          <Link href="/about-us" className="transition-colors hover:text-foreground">
            About
          </Link>
          <Link href="/contact-us" className="transition-colors hover:text-foreground">
            Contact
          </Link>
          <InstallAppButton />
          <Suspense fallback={<AuthHeaderFallback />}>
            <AuthHeaderActions />
          </Suspense>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Suspense fallback={<AuthHeaderFallback mobile />}>
            <AuthHeaderActions mobile />
          </Suspense>
          <button onClick={() => setOpen((current) => !current)} className="p-2 text-foreground" aria-label="Toggle menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="overflow-hidden border-b border-border bg-card md:hidden">
          <div className="container flex flex-col gap-3 py-4">
            <Link href="/service/mobile-repair/brands" className="py-2 text-sm font-medium text-foreground" onClick={() => setOpen(false)}>
              Brands
            </Link>
            <Link href="/service/mobile-repair" className="py-2 text-sm font-medium text-foreground" onClick={() => setOpen(false)}>
              Repairs
            </Link>
            <Link href="/about-us" className="py-2 text-sm font-medium text-foreground" onClick={() => setOpen(false)}>
              About
            </Link>
            <Link href="/contact-us" className="py-2 text-sm font-medium text-foreground" onClick={() => setOpen(false)}>
              Contact
            </Link>
            <InstallAppButton compact />
            <div className="mt-2">
              <Suspense fallback={<AuthHeaderFallback />}>
                <AuthHeaderActions />
              </Suspense>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
