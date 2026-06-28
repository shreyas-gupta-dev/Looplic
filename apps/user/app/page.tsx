import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NewHomepageView } from "@/src/components/next/NewHomepageView";
import { RootOAuthRedirect } from "@/src/components/next/RootOAuthRedirect";
import { getBrandsForListing, getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { siteConfig } from "@/src/lib/site";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Doorstep Mobile Repair, Laptop Repair & Tech Support in 30 Minutes",
  description:
    "Book doorstep mobile repair, laptop repair, desktop assembly, CCTV installation, IT support, and managed IT services in Bangalore with quick scheduling, technician assignment, and order tracking.",
  pathname: "/",
  keywords: [
    "doorstep mobile repair",
    "mobile repair at home",
    "mobile repair Bangalore",
    "laptop repair at home",
    "laptop repair Bangalore",
    "CCTV installation",
    "desktop assembly",
    "IT support",
    "managed IT services",
    "AMC IT support",
    "Looplic",
  ],
});

type PageProps = {
  searchParams?: Promise<{
    code?: string;
    next?: string;
    state?: string;
  }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params?.code) {
    const callbackParams = new URLSearchParams({ code: params.code });

    if (params.next) {
      callbackParams.set("next", params.next);
    }

    if (params.state) {
      callbackParams.set("state", params.state);
    }

    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  const [brands, searchIndex] = await Promise.all([getBrandsForListing("mobile"), getCatalogSearchIndex("mobile")]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: siteConfig.name,
            url: siteConfig.url,
            description: "Doorstep mobile repair, laptop repair, CCTV installation, desktop assembly, IT support, and managed IT services in Bangalore.",
            areaServed: {
              "@type": "City",
              name: "Bangalore",
            },
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Looplic Services",
              itemListElement: [
                "Mobile Repair",
                "Laptop Repair",
                "Desktop Assembly",
                "CCTV Installation",
                "IT Support",
                "Managed IT Services",
              ].map((name) => ({
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name,
                },
              })),
            },
          }),
        }}
      />
      <RootOAuthRedirect />
      <NewHomepageView brands={brands} searchBrands={searchIndex.brands} searchSeries={searchIndex.series} searchModels={searchIndex.models} />
    </>
  );
}
