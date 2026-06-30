import type { Metadata } from "next";

import { siteConfig } from "@/src/lib/site";

type MetadataInput = {
  title: string;
  description: string;
  pathname: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata({ title, description, pathname, keywords = [], noIndex = false }: MetadataInput): Metadata {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(path, siteConfig.url).toString();

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? {
          // noindex,follow: keep the page out of the index but still let crawlers
          // follow its links (correct for thin utility/URL-index pages so they
          // don't dead-end crawl paths).
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
    },
  };
}

export function buildMigrationMetadata(title: string, pathname: string): Metadata {
  return buildPageMetadata({
    title,
    description: `${title} route scaffolded for the Looplic Next.js migration.`,
    pathname,
    noIndex: true,
  });
}
