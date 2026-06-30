import type { Metadata } from "next";
import { ArrowRight, BookOpen, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { blogPosts } from "@/src/lib/blog";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Mobile & Laptop Repair Guides",
  description: "Practical Looplic guides on mobile repair, laptop care, doorstep service, and choosing reliable device repair support in Bangalore. Tips, how-tos, and advice.",
  pathname: "/blog",
  keywords: ["Looplic blog", "mobile repair blog", "Bangalore phone repair guide", "doorstep mobile repair"],
});

export default function BlogPage() {
  const featuredPost = blogPosts[0];
  const remainingPosts = blogPosts.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <CatalogNavbar />
      <main>
        <section className="border-b border-border bg-[radial-gradient(circle_at_top_left,_hsl(211_100%_50%_/_0.12),_transparent_28%),radial-gradient(circle_at_80%_12%,_hsl(165_100%_42%_/_0.12),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0)_0%,_rgba(248,250,252,0.96)_100%)]">
          <div className="container max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="inline-flex rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Looplic Blog
            </div>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                  Practical repair guides for faster, clearer device decisions.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Helpful articles on mobile repair, doorstep service, booking choices, device care, and what customers should check before choosing repair support.
                </p>
              </div>
              <div className="grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                {[
                  "Clear buying and repair advice",
                  "Short summaries for quick scanning",
                  "Internal links to relevant Looplic services",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="size-4" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-12">
          <div className="container max-w-6xl px-4 sm:px-6">
            <article className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[1fr_0.72fr]">
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{featuredPost.category}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1">
                    <Clock className="size-3.5" />
                    {featuredPost.readingTime}
                  </span>
                </div>
                <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  <Link href={`/blog/${featuredPost.slug}`} className="transition-colors hover:text-primary">
                    {featuredPost.title}
                  </Link>
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{featuredPost.excerpt}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Read article
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link href="/service/mobile-repair/brands" className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                    Browse repairs
                  </Link>
                </div>
              </div>
              <div className="border-t border-border bg-[linear-gradient(135deg,_hsl(211_100%_50%_/_0.12),_hsl(165_100%_42%_/_0.12)),linear-gradient(180deg,_#ffffff,_#f8fafc)] p-6 lg:border-l lg:border-t-0">
                <div className="flex h-full min-h-56 flex-col justify-between rounded-2xl border border-white/70 bg-white/70 p-5">
                  <BookOpen className="size-10 text-primary" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Featured Guide</div>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground">
                      {featuredPost.summary.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>

            {remainingPosts.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {remainingPosts.map((post) => (
                  <article key={post.slug} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{post.category}</div>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                      <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-primary">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <CrawlableInternalLinks
          title="Explore Looplic"
          links={[
            { href: "/service/mobile-repair", label: "Mobile repair" },
            { href: "/service/mobile-repair/brands", label: "Mobile brands" },
            { href: "/service/mobile-repair", label: "Mobile repair" },
            { href: "/bangalore", label: "Bangalore service areas" },
            { href: "/contact-us", label: "Contact Looplic" },
          ]}
        />
      </main>
      <HomepageFooter />
    </div>
  );
}
