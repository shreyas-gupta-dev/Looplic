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

  return (
    <>
      <ServiceJsonLd
        name={page.title}
        description={page.description}
        path={`/${page.slug}`}
        serviceType={page.keyword}
      />
      <SeoServiceLandingPage page={page} />
    </>
  );
}
