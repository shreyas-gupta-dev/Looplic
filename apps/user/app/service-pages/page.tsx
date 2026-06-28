import type { Metadata } from "next";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { buildPageMetadata } from "@/src/lib/metadata";
import { seoServicePages } from "@/src/lib/seo-service-pages";
import { siteConfig } from "@/src/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Looplic Service Page URLs",
  description: "Plain URL index for Looplic SEO service pages in Bangalore. This page lists service URLs only, without model booking URLs.",
  pathname: "/service-pages",
  keywords: ["Looplic service URLs", "mobile repair URLs", "laptop repair URLs", "IT support URLs"],
});

export default function ServicePagesIndex() {
  return (
    <div className="min-h-screen bg-background">
      <CatalogNavbar />
      <main className="container max-w-5xl py-10">
        <h1 className="text-3xl font-semibold text-foreground">Service page URLs</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          SEO service URLs only. Model-level catalog and booking URLs are intentionally excluded from this index.
        </p>

        <section className="mt-8">
          <ul className="grid gap-3 text-sm font-semibold">
            {seoServicePages.map((page) => {
              const absoluteUrl = new URL(`/${page.slug}`, siteConfig.url).toString();

              return (
                <li key={page.slug} className="break-all rounded-xl border border-border bg-card p-3">
                  <a href={`/${page.slug}`} className="text-primary underline-offset-4 hover:underline">
                    {absoluteUrl}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <HomepageFooter />
    </div>
  );
}
