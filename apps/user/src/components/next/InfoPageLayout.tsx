import type { ReactNode } from "react";
import Link from "next/link";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

type InfoPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function InfoPageLayout({ eyebrow, title, description, children }: InfoPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <CatalogNavbar />
      <main>
        <section className="border-b border-border bg-[radial-gradient(circle_at_top_left,_hsl(211_100%_50%_/_0.12),_transparent_28%),radial-gradient(circle_at_80%_12%,_hsl(165_100%_42%_/_0.12),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0)_0%,_rgba(248,250,252,0.96)_100%)]">
          <div className="container max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="inline-flex rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/contact-us" className="rounded-xl border border-border bg-card px-4 py-2 text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                Contact support
              </Link>
              <Link href="/service/mobile-repair/brands" className="rounded-xl border border-transparent bg-primary px-4 py-2 text-primary-foreground transition-opacity hover:opacity-90">
                Browse services
              </Link>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-12">
          <div className="container max-w-5xl px-4 sm:px-6">
            <div className="grid gap-4 sm:gap-5">{children}</div>
          </div>
        </section>

        <CrawlableInternalLinks
          title="Helpful Looplic pages"
          links={[
            { href: "/", label: "Looplic home" },
            { href: "/service/mobile-repair", label: "Mobile repair" },
            { href: "/service/mobile-repair/brands", label: "Mobile repair brands" },
            { href: "/service/laptop-repair/brands", label: "Laptop repair brands" },
            { href: "/service/mobile-repair", label: "Mobile repair" },
            { href: "/service/it-support", label: "IT support" },
          ]}
        />
      </main>
      <HomepageFooter />
    </div>
  );
}
