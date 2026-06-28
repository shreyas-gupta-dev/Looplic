import type { Metadata } from "next";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, ExternalLink, Lightbulb, ListChecks, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { blogPosts, getBlogPost } from "@/src/lib/blog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { siteConfig } from "@/src/lib/site";

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return buildPageMetadata({
      title: "Blog post not found",
      description: "The requested Looplic blog post could not be found.",
      pathname: "/blog",
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: post.description,
    pathname: `/blog/${post.slug}`,
    keywords: post.keywords,
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const postUrl = new URL(`/blog/${post.slug}`, siteConfig.url).toString();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    mainEntityOfPage: postUrl,
  };

  return (
    <div className="min-h-screen bg-background">
      <CatalogNavbar />
      <main>
        <article>
          <section className="border-b border-border bg-[radial-gradient(circle_at_top_left,_hsl(211_100%_50%_/_0.12),_transparent_28%),radial-gradient(circle_at_80%_12%,_hsl(165_100%_42%_/_0.12),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0)_0%,_rgba(248,250,252,0.96)_100%)]">
            <div className="container max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
              <Link href="/blog" className="text-sm font-bold text-primary transition-opacity hover:opacity-80">
                Blog
              </Link>
              <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.74fr] lg:items-end">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{post.category}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1">
                      <Clock className="size-3.5" />
                      {post.readingTime}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1">
                      <CalendarDays className="size-3.5" />
                      Updated {formatDate(post.updatedAt)}
                    </span>
                  </div>
                  <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">{post.title}</h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{post.description}</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Lightbulb className="size-5" />
                    </span>
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Quick Summary</div>
                      <div className="text-sm font-semibold text-foreground">What you will learn</div>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                    {post.summary.map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="py-8 sm:py-12">
            <div className="container grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.6fr] lg:items-start">
              <aside className="grid gap-4 lg:sticky lg:top-24">
                <nav aria-label="Article sections" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">In this guide</div>
                  <div className="mt-4 grid gap-2">
                    {post.sections.map((section) => (
                      <a key={section.id} href={`#${section.id}`} className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                        {section.title}
                      </a>
                    ))}
                  </div>
                </nav>

                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-black text-foreground">
                    <ListChecks className="size-4 text-primary" />
                    Repair checklist
                  </div>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                    {post.checklist.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>

              <div className="grid gap-6">
                <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {post.takeaways.map((takeaway) => (
                      <div key={takeaway} className="flex gap-3 rounded-xl border border-border/70 bg-background p-4">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                        <p className="text-sm leading-6 text-muted-foreground">{takeaway}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-[linear-gradient(135deg,_hsl(211_100%_50%_/_0.10),_hsl(165_100%_42%_/_0.10)),linear-gradient(180deg,_#ffffff,_#f8fafc)] p-6 shadow-sm sm:p-8">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-primary">Visual Guide</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">The simple repair decision path</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      { title: "Diagnose", text: "Identify the issue and confirm your exact device model." },
                      { title: "Compare", text: "Check pricing, support access, warranty clarity, and convenience." },
                      { title: "Book", text: "Choose the repair path that gives you the clearest next step." },
                    ].map((step, index) => (
                      <div key={step.title} className="rounded-2xl border border-white/80 bg-white/80 p-4">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">{index + 1}</div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {post.comparisonTable ? (
                  <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-primary">Comparison Table</div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{post.comparisonTable.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{post.comparisonTable.description}</p>
                    <div className="mt-5 overflow-x-auto">
                      <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left text-sm">
                        <thead>
                          <tr>
                            <th className="rounded-tl-xl border border-border bg-secondary px-4 py-3 font-black text-foreground">Provider</th>
                            {post.comparisonTable.columns.map((column, index) => (
                              <th key={column} className={`border-y border-r border-border bg-secondary px-4 py-3 font-black text-foreground ${index === post.comparisonTable!.columns.length - 1 ? "rounded-tr-xl" : ""}`}>
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {post.comparisonTable.rows.map((row, rowIndex) => {
                            const providerContent = (
                              <span className="inline-flex items-center gap-2 font-black text-foreground transition-colors group-hover:text-primary">
                                {row.provider.label}
                                {row.provider.href?.startsWith("http") ? <ExternalLink className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                              </span>
                            );
                            const isLastRow = rowIndex === post.comparisonTable!.rows.length - 1;

                            return (
                              <tr key={row.provider.label} className={row.highlight ? "bg-primary/[0.06]" : "bg-background"}>
                                <td className={`border-x border-b border-border px-4 py-4 align-top ${isLastRow ? "rounded-bl-xl" : ""}`}>
                                  {row.provider.href ? (
                                    row.provider.href.startsWith("http") ? (
                                      <a href={row.provider.href} target="_blank" rel="noreferrer" className="group">
                                        {providerContent}
                                      </a>
                                    ) : (
                                      <Link href={row.provider.href} className="group">
                                        {providerContent}
                                      </Link>
                                    )
                                  ) : (
                                    providerContent
                                  )}
                                </td>
                                {row.cells.map((cell, cellIndex) => (
                                  <td key={cell} className={`border-b border-r border-border px-4 py-4 align-top leading-6 text-muted-foreground ${isLastRow && cellIndex === row.cells.length - 1 ? "rounded-br-xl" : ""}`}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : null}

                <div className="grid gap-6">
                  {post.sections.map((section) => (
                    <section key={section.id} id={section.id} className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{section.title}</h2>
                      <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
                        {section.body.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                      {section.bullets ? (
                        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-3 rounded-xl border border-border/70 bg-background p-4 text-sm leading-6 text-muted-foreground">
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ))}
                </div>

                <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">Helpful links</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {post.internalLinks.map((link) => (
                      <Link key={link.href} href={link.href} className="inline-flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                        {link.label}
                        <ArrowRight className="size-4" />
                      </Link>
                    ))}
                    {post.externalLinks.map((link) => (
                      <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                        {link.label}
                        <ExternalLink className="size-4" />
                      </a>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-6 shadow-sm sm:p-8">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <MessageCircle className="size-5" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{post.cta.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{post.cta.description}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={post.cta.primaryHref} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">
                      {post.cta.primaryLabel}
                    </Link>
                    <a href={post.cta.secondaryHref} target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                      {post.cta.secondaryLabel}
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </article>

        <CrawlableInternalLinks title="Related Looplic pages" links={post.internalLinks} />
      </main>
      <HomepageFooter />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    </div>
  );
}
