import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@looplic/db"],
  async headers() {
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
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
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
        source: "/:path*",
        has: [{ type: "host", value: "www.looplic.com" }],
        destination: "https://looplic.com/:path*",
        permanent: true,
      },
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
      {
        source: "/admin/:path*",
        destination: process.env.NODE_ENV === "production" ? "https://admin.looplic.com/admin/:path*" : "http://localhost:3001/admin/:path*",
        permanent: false,
      },
      {
        source: "/operator/:path*",
        destination: process.env.NODE_ENV === "production" ? "https://admin.looplic.com/operator/:path*" : "http://localhost:3003/operator/:path*",
        permanent: false,
      },
      {
        source: "/operation/:path*",
        destination: process.env.NODE_ENV === "production" ? "https://admin.looplic.com/operation/:path*" : "http://localhost:3003/operation/:path*",
        permanent: false,
      },
      {
        source: "/technician/:path*",
        destination: process.env.NODE_ENV === "production" ? "https://tech.looplic.com/technician/:path*" : "http://localhost:3002/technician/:path*",
        permanent: false,
      },
    ];
  },
  env: {
    VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      '@tanstack/react-query',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    minimumCacheTTL: 86400,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "looplic-assets.s3.ap-south-1.amazonaws.com" },
      { protocol: "https", hostname: "looplic-assets.s3.amazonaws.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "s3ng.cashify.in" },
      { protocol: "https", hostname: "*.cashify.in" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "fdn2.gsmarena.com" },
      { protocol: "https", hostname: "*.gsmarena.com" },
    ],
  },
};

export default nextConfig;
