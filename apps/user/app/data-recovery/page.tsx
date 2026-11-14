import type { Metadata } from "next";
import { DataRecoveryView } from "@/src/components/data-recovery/DataRecoveryView";
import { buildPageMetadata } from "@/src/lib/metadata";
import { COMMON_FAQS, LAB_CONTACT } from "@/src/components/data-recovery/recovery-data";

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: "Hard Drive Data Recovery in Bengaluru | Looplic Data Recovery Lab",
  description:
    "Professional data recovery in Bengaluru for Hard Drives, SSDs, MacBooks & RAID servers. Free diagnostic assessment, cleanroom handling & secure doorstep pickup.",
  pathname: "/data-recovery",
  keywords: [
    "hard drive data recovery bangalore",
    "ssd data recovery",
    "macbook data recovery bangalore",
    "raid server recovery",
    "recover deleted files",
    "cleanroom data recovery",
    "clicking hard disk repair",
    "looplic data recovery",
  ],
});

export default function DataRecoveryPage() {
  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://www.looplic.com/data-recovery#lab",
        name: "Looplic Data Recovery Lab",
        url: "https://www.looplic.com/data-recovery",
        logo: "https://www.looplic.com/looplic-logo.webp",
        image: "https://www.looplic.com/images/services/data-recovery.webp",
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
        "@id": "https://www.looplic.com/data-recovery#service",
        name: "Hard Drive & RAID Data Recovery",
        provider: {
          "@id": "https://www.looplic.com/data-recovery#lab",
        },
        serviceType: "Data Recovery",
        areaServed: {
          "@type": "AdministrativeArea",
          name: "Bengaluru, Karnataka, India",
        },
        description:
          "Professional data recovery from hard disk drives (HDD), solid state drives (SSD), MacBooks, and RAID servers with cleanroom diagnostics and doorstep pickup.",
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.looplic.com/data-recovery#faq",
        mainEntity: COMMON_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
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
