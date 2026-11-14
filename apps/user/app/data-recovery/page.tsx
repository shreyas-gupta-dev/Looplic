import type { Metadata } from "next";
import { DataRecoveryView } from "@/src/components/data-recovery/DataRecoveryView";
import { buildPageMetadata } from "@/src/lib/metadata";
import { COMMON_FAQS, LAB_CONTACT } from "@/src/components/data-recovery/recovery-data";

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: "Hard Drive Data Recovery in Bangalore | HDD & SSD Lab",
  description:
    "Professional hard drive data recovery in Bangalore for clicking HDDs, failed SSDs, dead MacBooks & RAID servers. Free diagnosis & file list verification.",
  pathname: "/data-recovery",
  image: "/images/services/data-recovery.webp",
  keywords: [
    "hard drive data recovery bangalore",
    "data recovery bangalore",
    "ssd data recovery bangalore",
    "external hard disk recovery bangalore",
    "clicking hard drive repair",
    "macbook data recovery bangalore",
    "raid server recovery bangalore",
    "recover deleted files",
    "cleanroom data recovery",
    "looplic data recovery",
  ],
});

export default function DataRecoveryPage() {
  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": "https://looplic.com/data-recovery#breadcrumb",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://looplic.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Hard Drive Data Recovery",
            item: "https://looplic.com/data-recovery",
          },
        ],
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://looplic.com/data-recovery#lab",
        name: "Looplic Data Recovery Lab",
        url: "https://looplic.com/data-recovery",
        logo: "https://looplic.com/looplic-logo.webp",
        image: "https://looplic.com/images/services/data-recovery.webp",
        telephone: LAB_CONTACT.phone,
        email: LAB_CONTACT.email,
        priceRange: "₹₹ - Free diagnostic evaluation; fixed quote upon inspection",
        address: {
          "@type": "PostalAddress",
          streetAddress: "1st Floor, Shawkat Building, SJP Road, Nagarathpete",
          addressLocality: "Bengaluru",
          addressRegion: "Karnataka",
          postalCode: "560002",
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: LAB_CONTACT.coordinates.lat,
          longitude: LAB_CONTACT.coordinates.lng,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "10:00",
            closes: "20:00",
          },
        ],
      },
      {
        "@type": "Service",
        "@id": "https://looplic.com/data-recovery#service",
        name: "Hard Drive & SSD Data Recovery",
        provider: {
          "@id": "https://looplic.com/data-recovery#lab",
        },
        serviceType: "Data Recovery Service",
        areaServed: {
          "@type": "AdministrativeArea",
          name: "Bengaluru, Karnataka, India",
        },
        description:
          "Professional data recovery from hard disk drives (HDD), solid state drives (SSD), MacBooks, and RAID servers with cleanroom diagnostics and doorstep pickup.",
      },
      {
        "@type": "FAQPage",
        "@id": "https://looplic.com/data-recovery#faq",
        mainEntity: COMMON_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a.replace(/\[CONFIRM:[^\]]+\]\s*/g, ""),
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />
      <DataRecoveryView />
    </>
  );
}
