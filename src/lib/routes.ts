export const serviceTypes = ["mobile-repair", "laptop-repair", "cctv"] as const;

export type ServiceType = (typeof serviceTypes)[number];

export const appRouteMap = [
  {
    group: "Service",
    title: "Service Landing",
    href: "/service/mobile-repair",
    description: "Dedicated service landing page route for SSR and SEO.",
  },
  {
    group: "Service",
    title: "Service Booking",
    href: "/service/laptop-repair/book/sample-brand/sample-series/sample-model",
    description: "Dedicated service booking page route using service + nested slugs.",
  },
  {
    group: "Secure",
    title: "Customer Account",
    href: "/account",
    description: "Server-protected account route placeholder.",
  },
  {
    group: "Secure",
    title: "Admin Dashboard",
    href: "/admin/dashboard",
    description: "Protected admin shell for migrated dashboard modules.",
  },
  {
    group: "Secure",
    title: "Operation Dashboard",
    href: "/operation",
    description: "Protected operation shell for order assignment and billing workflows.",
  },
  {
    group: "Secure",
    title: "Operator Dashboard",
    href: "/operator",
    description: "Alias for the protected operation shell using operator-facing URLs.",
  },
  {
    group: "Secure",
    title: "Technician Dashboard",
    href: "/technician",
    description: "Protected technician shell for assigned orders, inspection, pickup, quote, and completion workflows.",
  },
] as const;

export function buildServiceRoute(serviceType: ServiceType) {
  return `/service/${serviceType}`;
}

export function buildServiceBrandsRoute(serviceType: ServiceType) {
  return `/service/${serviceType}/brands`;
}

export function buildServiceSeriesRoute(serviceType: ServiceType, brandSlug: string, seriesSlug?: string) {
  if (!seriesSlug) {
    return `/service/${serviceType}/brands/${brandSlug}`;
  }

  return `/service/${serviceType}/brands/${brandSlug}/${seriesSlug}`;
}

export function buildServiceBookingRoute(
  serviceType: ServiceType,
  brandSlug: string,
  seriesSlug: string,
  modelSlug: string,
) {
  return `/service/${serviceType}/book/${brandSlug}/${seriesSlug}/${modelSlug}`;
}
