import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoServiceLandingPage } from "@/src/components/next/SeoServiceLandingPage";
import { ServiceJsonLd } from "@/src/components/seo/ServiceJsonLd";
import { buildPageMetadata } from "@/src/lib/metadata";
import { seoServicePageMap } from "@/src/lib/seo-service-pages";

type SeoServicePageProps = {
  slug: string;
};

export function buildSeoServiceMetadata(slug: string): Metadata {
  const page = seoServicePageMap.get(slug);

  if (!page) {
    return { title: "Service" };
  }

  return buildPageMetadata({
    title: page.title,
    description: page.description,
    pathname: `/${page.slug}`,
    keywords: [page.keyword, page.problem, `${page.keyword.toLowerCase()} booking`],
  });
}

export function SeoServicePage({ slug }: SeoServicePageProps) {
  const page = seoServicePageMap.get(slug);

  if (!page) {
    notFound();
  }

  const faqJsonLd =
    page.faqs && page.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <ServiceJsonLd
        name={page.title}
        description={page.description}
        path={`/${page.slug}`}
        serviceType={page.keyword}
      />
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      ) : null}
      <SeoServiceLandingPage page={page} />
    </>
  );
}
