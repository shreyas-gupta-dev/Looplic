import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

type ServiceItem = {
  title: string;
  text: string;
  icon: LucideIcon;
};

type SimpleServiceDetailPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  bookingHref: string;
  ctaLabel: string;
  highlights: string[];
  services: ServiceItem[];
  workflow: string[];
  introSections?: Array<{
    title: string;
    text: string;
  }>;
  coverageIntro?: string;
  closingTitle?: string;
  closingText?: string;
  afterHeroContent?: ReactNode;
  afterContent?: ReactNode;
  accentClassName?: string;
  highlightsPosition?: "hero" | "afterHeroContent";
};

export function SimpleServiceDetailPage({
  eyebrow,
  title,
  description,
  bookingHref,
  ctaLabel,
  highlights,
  services,
  workflow,
  introSections,
  coverageIntro,
  closingTitle,
  closingText,
  afterHeroContent,
  afterContent,
  accentClassName = "from-[#0096FF] to-[#00D28E]",
  highlightsPosition = "hero",
}: SimpleServiceDetailPageProps) {
  const highlightsCard = (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
      <div className="text-sm font-black text-slate-900">What you get</div>
      <div className="mt-4 grid gap-3">
        {highlights.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <CheckCircle2 className="size-4 shrink-0 text-[#00A878]" />
            <span className="text-sm font-bold text-slate-700">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />
      <main>
        <section className="border-b border-slate-200 bg-[#EEF4F8] px-4 py-10 sm:py-14">
          <div className={`container mx-auto grid max-w-5xl gap-8 lg:items-center ${highlightsPosition === "hero" ? "lg:grid-cols-[1fr_0.9fr]" : ""}`}>
            <div>
              <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0096FF] shadow-sm">
                {eyebrow}
              </div>
              <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[#111827] sm:text-5xl">{title}</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
              <div className="mt-6">
                <Link href={bookingHref} className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r ${accentClassName} px-6 py-3 text-sm font-extrabold text-white shadow-sm shadow-blue-500/20`}>
                  {ctaLabel} <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {highlightsPosition === "hero" ? highlightsCard : null}
          </div>
        </section>

        {afterHeroContent}

        {highlightsPosition === "afterHeroContent" ? (
          <section className="container mx-auto max-w-3xl px-4 pb-6">
            {highlightsCard}
          </section>
        ) : null}

        {introSections && introSections.length > 0 ? (
          <section className="container mx-auto max-w-5xl px-4 py-10">
            <div className="grid gap-4 md:grid-cols-3">
              {introSections.map((section) => (
                <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{section.text}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="container mx-auto max-w-5xl px-4 py-10">
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1 w-6 rounded-full bg-[#00B4D8]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#0096FF]">Service coverage</span>
            </div>
            <h2 className="text-2xl font-semibold text-[#111827]">Built for clean, reliable execution</h2>
            {coverageIntro ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{coverageIntro}</p> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-sky-50">
                    <Icon className="size-5 text-[#0096FF]" />
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">{service.title}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{service.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {closingTitle && closingText ? (
          <section className="container mx-auto max-w-5xl px-4 pb-10">
            <div className="rounded-2xl border border-slate-200 bg-[#EEF4F8] p-6">
              <h2 className="text-xl font-semibold text-[#111827]">{closingTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{closingText}</p>
            </div>
          </section>
        ) : null}

        <section className="container mx-auto max-w-5xl px-4 pb-12">
          <div className="grid gap-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#0096FF]">How it works</div>
              <h2 className="mt-2 text-2xl font-semibold text-[#111827]">From booking to handover</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">A simple flow helps operations assign the right technician, confirm scope, and close the work cleanly.</p>
            </div>
            <div className="grid gap-3">
              {workflow.map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#0096FF] shadow-sm">{index + 1}</div>
                  <div className="text-sm font-bold text-slate-700">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {afterContent}
      </main>
      <HomepageFooter />
    </div>
  );
}
