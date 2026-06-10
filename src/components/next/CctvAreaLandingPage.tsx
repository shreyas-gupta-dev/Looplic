import { ArrowRight, Camera, CheckCircle2, HardDrive, MapPin, Network, Smartphone } from "lucide-react";
import Link from "next/link";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CctvChooseServiceSection } from "@/src/components/next/CctvChooseServiceSection";
import { CrawlableInternalLinks } from "@/src/components/next/CrawlableInternalLinks";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { ServiceAreasSection } from "@/src/components/next/ServiceAreasSection";
import type { CctvAreaPageContent } from "@/src/lib/cctv-area-pages";

const serviceCards = [
  { title: "Camera planning", icon: Camera },
  { title: "DVR/NVR setup", icon: HardDrive },
  { title: "Mobile viewing", icon: Smartphone },
  { title: "Network checks", icon: Network },
] as const;

export function CctvAreaLandingPage({ content }: { content: CctvAreaPageContent }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />
      <main>
        <section className="border-b border-slate-200 bg-[#EEF4F8] px-4 py-10 sm:py-14">
          <div className="container mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.82fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0096FF] shadow-sm">
                <MapPin className="size-3.5" />
                {content.area.name} Bangalore
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#111827] sm:text-5xl">{content.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{content.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={content.bookingHref} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0096FF] to-[#00D28E] px-6 py-3 text-sm font-extrabold text-white shadow-sm shadow-blue-500/20">
                  Book CCTV Installation <ArrowRight className="size-4" />
                </Link>
                <Link href="/service/cctv" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-[#0096FF]/40 hover:text-[#0096FF]">
                  CCTV overview
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <div className="text-sm font-black text-slate-900">Area service highlights</div>
              <div className="mt-4 grid gap-3">
                {content.highlights.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <CheckCircle2 className="size-4 shrink-0 text-[#00A878]" />
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <CctvChooseServiceSection className="container mx-auto max-w-3xl px-4 py-10" />

        <section className="container mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-4 md:grid-cols-4">
            {serviceCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-50">
                    <Icon className="size-5 text-[#0096FF]" />
                  </div>
                  <h2 className="mt-4 text-sm font-semibold text-slate-900">{card.title}</h2>
                </article>
              );
            })}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 pb-10">
          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#0096FF]">Local planning</div>
              <h2 className="mt-2 text-2xl font-semibold text-[#111827]">What we check in {content.area.name}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{content.intro}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{content.planning}</p>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <strong className="text-slate-900">Common concern:</strong> {content.risk}
              </div>
            </aside>

            <div className="grid gap-4">
              {content.sections.map((section) => (
                <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-[#111827]">{section.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{section.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 pb-12">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#0096FF]">Questions</div>
            <h2 className="mt-2 text-2xl font-semibold text-[#111827]">CCTV installation FAQs for {content.area.name}</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {content.faqs.map((faq) => (
                <article key={faq.question} className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{faq.question}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{faq.answer}</p>
                </article>
              ))}
            </div>
            <div className="mt-6">
              <Link href={content.bookingHref} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0096FF] to-[#00D28E] px-6 py-3 text-sm font-extrabold text-white shadow-sm shadow-blue-500/20">
                Start Booking <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <CrawlableInternalLinks
          title={`Helpful CCTV pages for ${content.area.name}`}
          links={[
            { href: "/service/cctv", label: "CCTV installation Bangalore" },
            { href: content.bookingHref, label: `Book CCTV in ${content.area.name}` },
            { href: "/service/it-support", label: "IT support" },
            { href: "/service/managed-it-services", label: "Managed IT services" },
          ]}
        />
        <ServiceAreasSection currentAreaSlug={content.area.slug} currentRepairServiceType="cctv" />
      </main>
      <HomepageFooter />
    </div>
  );
}
