import type { Metadata } from "next";

import { siteConfig } from "@/src/lib/site";

type MetadataInput = {
  title: string;
  description: string;
  pathname: string;
  keywords?: string[];
  noIndex?: boolean;
  image?: string;
};

export function buildPageMetadata({ title, description, pathname, keywords = [], noIndex = false, image }: MetadataInput): Metadata {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(path, siteConfig.url).toString();
  const imageUrl = image
    ? (image.startsWith("http") ? image : new URL(image, siteConfig.url).toString())
    : new URL("/looplic-app-icon-512.png", siteConfig.url).toString();

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
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} | ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [imageUrl],
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
