import { ArrowRight, CheckCircle2, ClipboardCheck, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import Link from "next/link";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import type { SeoServicePage } from "@/src/lib/seo-service-pages";

type SeoServiceLandingPageProps = {
  page: SeoServicePage;
};

export function SeoServiceLandingPage({ page }: SeoServiceLandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />
      <main>
        <section className="border-b border-slate-200 bg-[#EEF4F8] px-4 py-10 sm:py-14">
          <div className="container mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0096FF] shadow-sm">
                {page.eyebrow}
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#111827] sm:text-5xl">{page.title}</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">{page.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={page.ctaHref} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0096FF] to-[#00D28E] px-6 py-3 text-sm font-extrabold text-white shadow-sm shadow-blue-500/20">
                  {page.ctaLabel} <ArrowRight className="size-4" />
                </Link>
                <Link href={page.secondaryHref} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 shadow-sm transition-colors hover:border-[#0096FF]/30 hover:text-[#0096FF]">
                  {page.secondaryLabel}
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <ShieldCheck className="size-4 text-[#00A878]" />
                Service flow
              </div>
              <div className="mt-4 grid gap-3">
                {["Select device", "Book inspection", "Confirm quote"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0096FF] text-xs font-black text-white">{index + 1}</span>
                    <div>
                      <div className="text-sm font-extrabold text-slate-800">{step}</div>
                      <div className="text-xs leading-5 text-slate-500">
                        {index === 0 ? "Choose the exact brand, series, and model." : index === 1 ? "Share contact details and inspect location." : "Review the repair scope before work begins."}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-4 py-10">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {page.highlights.map((highlight) => (
              <div key={highlight} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#00A878]" />
                <div className="text-sm font-bold leading-5 text-slate-700">{highlight}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-4 pb-10">
          <div className="grid gap-4 md:grid-cols-3">
            {page.sections.map((section) => (
              <article key={section.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        {(page.serviceSteps || page.detailBlocks) && (
          <section className="container mx-auto grid max-w-5xl gap-4 px-4 pb-10 lg:grid-cols-[0.9fr_1.1fr]">
            {page.serviceSteps && (
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <ClipboardCheck className="size-4 text-[#0096FF]" />
                  Booking path
                </div>
                <ol className="mt-5 grid gap-3">
                  {page.serviceSteps.map((step, index) => (
                    <li key={step} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0096FF] text-xs font-black text-white">{index + 1}</span>
                      <span className="pt-1 text-sm font-bold leading-5 text-slate-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {page.detailBlocks && (
              <div className="grid gap-4 sm:grid-cols-2">
                {page.detailBlocks.map((block) => (
                  <div key={block.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                      {block.title.toLowerCase().includes("model") ? <Smartphone className="size-4 text-[#00A878]" /> : <Wrench className="size-4 text-[#00A878]" />}
                      {block.title}
                    </div>
                    <ul className="mt-5 grid gap-2">
                      {block.items.map((item) => (
                        <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                          <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#00A878]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {page.brandLinks && page.brandLinks.length > 0 && (
          <section className="container mx-auto max-w-5xl px-4 pb-10">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#0096FF]">All brand screen replacement pages</div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {page.brandLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-[#0096FF]/40 hover:bg-white">
                    <div className="flex items-center justify-between gap-3 text-sm font-extrabold text-slate-900">
                      <span>{link.label}</span>
                      <ArrowRight className="size-4 shrink-0 text-slate-400 transition-colors group-hover:text-[#0096FF]" />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{link.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="container mx-auto max-w-5xl px-4 pb-12">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#0096FF]">Questions</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {page.faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl bg-slate-50 p-4">
                  <h2 className="text-sm font-semibold text-slate-900">{faq.question}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <HomepageFooter />
    </div>
  );
}
