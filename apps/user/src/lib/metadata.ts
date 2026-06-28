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
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
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
