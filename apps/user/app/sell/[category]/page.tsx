import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { getBrandsForListing } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { buildSellBrandRoute, resolveSellCategory, SELL_CATEGORIES } from "@/src/lib/sell";

import { SellCategoryBrandGrid } from "@/src/components/next/SellCategoryBrandGrid";

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

  const brandsData = brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    image_url: brand.image_url,
    letter: brand.letter,
    gradient: brand.gradient,
    href: buildSellBrandRoute(sellCategory, brand.slug),
  }));

  return (
    <div className="min-h-screen bg-white">
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

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <Link href="/sell" className="hover:text-gray-900 transition-colors">Sell</Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-900">Sell Old {oldLabel}</span>
        </nav>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Sell Old {oldLabel}
          </h1>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Select your {noun} brand to get an instant price quote. Free doorstep pickup & same-day payment.
          </p>
        </div>

        {brands.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-base font-semibold text-gray-900">The {noun} catalog is being stocked.</p>
            <p className="mt-2 text-sm text-gray-500">
              We still buy them!{" "}
              <Link href="/contact-us" className="font-semibold text-blue-600 hover:underline">
                Contact us
              </Link>{" "}
              for a manual quote while we finish setting this up.
            </p>
          </div>
        ) : (
          <SellCategoryBrandGrid brands={brandsData} noun={noun} />
        )}

        {/* FAQs */}
        <section className="mt-12 border-t border-gray-100 pt-10">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-sm"
              >
                <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-gray-900 sm:text-base">
                  {f.q}
                </summary>
                <p className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <HomepageFooter />
    </div>
  );
}
