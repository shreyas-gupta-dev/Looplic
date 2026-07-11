import { CalendarDays, Clock } from "lucide-react";
import Link from "next/link";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import type { DbBlogPost } from "@/src/lib/data/blog-db";
import { siteConfig } from "@/src/lib/site";

function formatDate(date: string | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

// Renders a CMS-authored post. The body is trusted HTML produced by the admin
// rich-text editor (staff-only). If untrusted authors are ever added, sanitize
// body_html on write or render before dangerouslySetInnerHTML here.
export function CmsArticle({ post }: { post: DbBlogPost }) {
  const postUrl = new URL(`/blog/${post.slug}`, siteConfig.url).toString();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description || post.excerpt,
    image: post.cover_image_url || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    author: { "@type": "Organization", name: post.author || siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: postUrl,
  };

  return (
    <div className="min-h-screen bg-background">
      <CatalogNavbar />
      <main>
        <article>
          <section className="border-b border-border bg-[radial-gradient(circle_at_top_left,_hsl(211_100%_50%_/_0.12),_transparent_28%),radial-gradient(circle_at_80%_12%,_hsl(165_100%_42%_/_0.12),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0)_0%,_rgba(248,250,252,0.96)_100%)]">
            <div className="container max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
              <Link href="/blog" className="text-sm font-bold text-primary transition-opacity hover:opacity-80">
                Blog
              </Link>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
                {post.category ? <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{post.category}</span> : null}
                {post.reading_time ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1">
                    <Clock className="size-3.5" />
                    {post.reading_time}
                  </span>
                ) : null}
                {post.published_at ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1">
                    <CalendarDays className="size-3.5" />
                    {formatDate(post.published_at)}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">{post.title}</h1>
              {post.excerpt ? <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{post.excerpt}</p> : null}
              {post.author ? <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">By {post.author}</p> : null}
            </div>
          </section>

          <section className="py-8 sm:py-12">
            <div className="container max-w-3xl px-4 sm:px-6">
              {post.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover_image_url}
                  alt={post.cover_image_alt || post.title}
                  className="mb-8 w-full rounded-2xl border border-border object-cover"
                />
              ) : null}
              <div
                className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-2xl"
                dangerouslySetInnerHTML={{ __html: post.body_html }}
              />
            </div>
          </section>
        </article>

        <CrawlableInternalLinks
          title="Explore Looplic"
          links={[
            { href: "/service/mobile-repair/brands", label: "Mobile brands" },
            { href: "/bangalore", label: "Bangalore service areas" },
            { href: "/contact-us", label: "Contact Looplic" },
          ]}
        />
      </main>
      <HomepageFooter />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    </div>
  );
}
