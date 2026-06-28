import { siteConfig } from "@/src/lib/site";

type ServiceJsonLdProps = {
  name: string;
  description: string;
  path: string;
  serviceType: string;
};

export function ServiceJsonLd({ name, description, path, serviceType }: ServiceJsonLdProps) {
  const url = new URL(path, siteConfig.url).toString();
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    areaServed: {
      "@type": "City",
      name: "Bangalore",
    },
    url,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
