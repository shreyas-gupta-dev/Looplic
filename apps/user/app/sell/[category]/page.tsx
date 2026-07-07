import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { getBrandsForListing } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { buildSellBrandRoute, resolveSellCategory, SELL_CATEGORIES } from "@/src/lib/sell";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const sellCategory = resolveSellCategory(category);
  if (!sellCategory) return {};
  const { label, noun } = SELL_CATEGORIES[sellCategory];

  const oldLabel = label === "Phone" ? "Mobile Phone" : label;
  return buildPageMetadata({
    title: `Sell Old ${oldLabel} in Bangalore for Instant Cash`,
    description: `Sell your old ${noun} in Bangalore: instant online quote, free doorstep pickup, and same-day UPI or bank payment. Choose your brand to get started.`,
    pathname: `/sell/${sellCategory}`,
  });
}

export default async function SellBrandsPage({ params }: PageProps) {
  const { category } = await params;
  const sellCategory = resolveSellCategory(category);
  if (!sellCategory) notFound();

  const { serviceType, label, noun } = SELL_CATEGORIES[sellCategory];
  const brands = await getBrandsForListing(serviceType);
  const oldLabel = label === "Phone" ? "Mobile Phone" : label;

  const faqs = [
    {
      q: `How do I sell my old ${noun} on Looplic?`,
      a: `Pick your brand and model, answer a few questions about its condition, and get an instant quote. Book a free doorstep pickup and our executive pays you on the spot via UPI or bank transfer.`,
    },
    {
      q: "How is the price decided?",
      a: `Every model has a best-condition price. Your answers about the screen, body, functionality and accessories adjust it — the final amount is confirmed after a quick physical check at pickup.`,
    },
    {
      q: "Is pickup really free?",
      a: "Yes. Doorstep pickup anywhere in Bangalore is free, with no obligation to sell if you change your mind.",
    },
    {
      q: "When do I get paid?",
      a: "Immediately at pickup — the executive transfers the amount via UPI, IMPS or bank transfer before leaving.",
    },
    {
      q: "What about my data?",
      a: `We help you factory-reset and securely erase your ${noun} before handover, and wipe it again at our facility.`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <CatalogNavbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-[12px] text-gray-500">
          <Link href="/sell" className="font-semibold text-violet-600 hover:underline">Home</Link>
          <span className="mx-1.5">/</span>
          <span>Sell Old {oldLabel}</span>
        </nav>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#8B3DFF]"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B3DFF]">Sell {label}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#111827]">Sell Old {oldLabel} in Bangalore</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-gray-500">
            Get an instant quote for your old {noun}, free doorstep pickup, and same-day payment via UPI or bank
            transfer. Pick your brand to get started.
          </p>
        </div>

        {brands.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-[13px] font-semibold text-gray-900">The {noun} catalog is being stocked.</p>
            <p className="mt-1 text-[12px] text-gray-500">
              We still buy them! <Link href="/contact-us" className="font-semibold text-violet-600 hover:underline">Contact us</Link> for a manual quote while we finish setting this up.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 md:gap-3">
          {brands.map((brand) => (
            <Link
              href={buildSellBrandRoute(sellCategory, brand.slug)}
              key={brand.id}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)]"
            >
              <BrandLogo
                name={brand.name}
                imageUrl={brand.image_url}
                letter={brand.letter}
                gradient={brand.gradient}
                className="size-10 rounded-xl object-contain"
                fallbackClassName="size-10 rounded-xl shadow-sm"
              />
              <span className="text-[11px] font-bold text-gray-900">{brand.name}</span>
            </Link>
          ))}
        </div>
        {/* FAQs */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-[#111827]">Frequently asked questions</h2>
          <div className="space-y-2.5">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <summary className="cursor-pointer list-none text-[13px] font-bold text-gray-900">{f.q}</summary>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <HomepageFooter />
    </div>
  );
}
