import { siteConfig } from "@/src/lib/site";

type Crumb = { name: string; path: string };

/**
 * Emits a schema.org BreadcrumbList for the given trail. Each path is resolved
 * to an absolute URL against the canonical site origin so Google can render
 * breadcrumb navigation in search results.
 */
export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, siteConfig.url).toString(),
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
