import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@looplic/db"],
  async headers() {
    // Per-user / account-specific pages must never be cached by the CDN or
    // browser — they render account-bound data (saved profile, address,
    // booking details). Caching them risks one account seeing another's saved
    // details (see booking stale-profile fix). Marketing/catalog pages carry no
    // per-user data and are intentionally left edge-cacheable for Core Web
    // Vitals; per-user UI on them (sign-in vs account) renders client-side.
    const noStore = {
      key: "Cache-Control",
      value: "no-store, no-cache, max-age=0, must-revalidate",
    };

    return [
      { source: "/account", headers: [noStore] },
      { source: "/thank-you", headers: [noStore] },
      { source: "/auth/:path*", headers: [noStore] },
      { source: "/book/:path*", headers: [noStore] },
      { source: "/service/:serviceType/book/:path*", headers: [noStore] },
      {
        // Service workers must always be revalidated against the origin. If the
        // worker script is cached by the CDN or browser, a phone stuck on an old
        // (broken) worker never fetches the fixed one and stays broken. Force a
        // revalidation on every request so worker updates always reach clients.
        source: "/:swfile(sw.js|technician-alert-sw.js)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/service/:serviceType/brands/xiaomi",
        destination: "/service/:serviceType/brands/mi",
        permanent: true,
      },
      {
        source: "/service/:serviceType/brands/xiaomi/:path*",
        destination: "/service/:serviceType/brands/mi/:path*",
        permanent: true,
      },
      {
        source: "/service/:serviceType/book/xiaomi/:path*",
        destination: "/service/:serviceType/book/mi/:path*",
        permanent: true,
      },
      {
        source: "/xiaomi-screen-replacement",
        destination: "/mi-screen-replacement",
        permanent: true,
      },
      // Back-office moved to its own subdomains. Forward old looplic.com links
      // (and any installed PWAs / bookmarks) to the dedicated apps.
      {
        source: "/admin/:path*",
        destination: "https://admin.looplic.com/admin/:path*",
        permanent: true,
      },
      {
        source: "/operator/:path*",
        destination: "https://admin.looplic.com/operator/:path*",
        permanent: true,
      },
      {
        source: "/operation/:path*",
        destination: "https://admin.looplic.com/operation/:path*",
        permanent: true,
      },
      {
        source: "/technician/:path*",
        destination: "https://tech.looplic.com/technician/:path*",
        permanent: true,
      },
    ];
  },
  env: {
    VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
