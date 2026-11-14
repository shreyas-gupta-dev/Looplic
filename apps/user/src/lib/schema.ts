import { siteConfig } from "@/src/lib/site";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type ServiceSchemaOptions = {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  areaServed?: string;
};

export type CollectionPageOptions = {
  name: string;
  description: string;
  path: string;
};

/**
 * Builds standard LocalBusiness + ElectronicsStore schema for Looplic.
 * Captures Bangalore physical presence, contact points, geo coordinates,
 * and 7-day operating hours.
 */
export function buildLocalBusinessSchema() {
  return {
    "@type": ["LocalBusiness", "ElectronicsStore"],
    "@id": `${siteConfig.url}/#localbusiness`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: new URL("/looplic-app-icon-512.png", siteConfig.url).toString(),
    image: new URL("/looplic-app-icon-512.png", siteConfig.url).toString(),
    telephone: "+91-88844-45924",
    priceRange: "₹₹",
    description:
      "On-demand doorstep mobile repair, laptop servicing, and certified refurbished device buyback in Bangalore.",
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "1st Floor, Shawkat Building, SJP Road, opp. Dasappa Hospital, near Town Hall, Dodpete, Nagarathpete",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      postalCode: "560002",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 12.9647,
      longitude: 77.5855,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "20:00",
      },
    ],
    areaServed: [
      {
        "@type": "City",
        name: "Bengaluru",
      },
      {
        "@type": "State",
        name: "Karnataka",
      },
    ],
    sameAs: [
      "https://www.instagram.com/looplic/",
      "https://www.linkedin.com/company/looplic",
    ],
  };
}

/**
 * Builds WebSite schema for site identity and branding.
 */
export function buildWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    description:
      "Sell old phones and laptops with doorstep pickup, or book doorstep mobile repair in Bangalore with 6-month warranty.",
    publisher: {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

/**
 * Builds BreadcrumbList schema with resolved canonical URLs.
 * Crucial for Google Breadcrumb rich snippets.
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, siteConfig.url).toString(),
    })),
  };
}

/**
 * Builds Service schema for doorstep repair or buyback offerings.
 */
export function buildServiceSchema({
  name,
  description,
  path,
  serviceType,
  areaServed = "Bangalore",
}: ServiceSchemaOptions) {
  const url = new URL(path, siteConfig.url).toString();

  return {
    "@type": "Service",
    name,
    description,
    serviceType,
    url,
    provider: {
      "@type": ["LocalBusiness", "ElectronicsStore"],
      "@id": `${siteConfig.url}/#localbusiness`,
      name: siteConfig.name,
      url: siteConfig.url,
    },
    areaServed: {
      "@type": "City",
      name: areaServed,
    },
  };
}

/**
 * Builds CollectionPage schema for catalog and listing hubs.
 */
export function buildCollectionPageSchema({
  name,
  description,
  path,
}: CollectionPageOptions) {
  const url = new URL(path, siteConfig.url).toString();

  return {
    "@type": "CollectionPage",
    name,
    description,
    url,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
    },
  };
}

