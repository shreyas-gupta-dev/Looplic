import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@looplic/db"],
  async headers() {
    const noStore = {
      key: "Cache-Control",
      value: "no-store, no-cache, max-age=0, must-revalidate",
    };
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://maps.googleapis.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://* http://localhost:*; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://* http://localhost:* wss://*; frame-src 'self' https://www.google.com https://maps.google.com; object-src 'none'; base-uri 'self';",
          },
        ],
      },
      { source: "/account", headers: [noStore] },
      { source: "/thank-you", headers: [noStore] },
      { source: "/auth/:path*", headers: [noStore] },
      { source: "/book/:path*", headers: [noStore] },
      { source: "/service/:serviceType/book/:path*", headers: [noStore] },
      {
        source: "/(bangalore|service|sell|blog|about-us|faq|contact-us|careers|partners|privacy-policy|terms-and-conditions|warranty-policy|refund-policy)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path*(-screen-replacement|-repair-bangalore|-phones-bangalore|-iphone-bangalore|-laptop-bangalore|-mobile-phone-bangalore)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
          },
        ],
      },
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
        source: "/service/hard-drive-data-recovery",
        destination: "/data-recovery",
        permanent: true,
      },
      {
        source: "/service/data-recovery",
        destination: "/data-recovery",
        permanent: true,
      },
      {
        source: "/services/data-recovery",
        destination: "/data-recovery",
        permanent: true,
      },
      {
        source: "/services/hard-drive-data-recovery",
        destination: "/data-recovery",
        permanent: true,
      },
      {
        source: "/hard-drive-data-recovery",
        destination: "/data-recovery",
        permanent: true,
      },
      {
        source: "/hard-drive-recovery",
        destination: "/data-recovery",
        permanent: true,
      },
      {
        source: "/data-recovery-bangalore",
        destination: "/data-recovery",
        permanent: true,
      },
      {
        source: "/bangalore/data-recovery",
        destination: "/data-recovery",
        permanent: true,
      },
      {
        source: "/services",
        destination: "/service-pages",
        permanent: true,
      },
      {
        source: "/service",
        destination: "/service-pages",
        permanent: true,
      },
      {
        source: "/repair",
        destination: "/service/mobile-repair",
        permanent: true,
      },
      {
        source: "/repairs",
        destination: "/service-pages",
        permanent: true,
      },
      {
        source: "/book/hard-drive-data-recovery",
        destination: "/data-recovery#book",
        permanent: false,
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
        destination: process.env.NEXT_PUBLIC_ADMIN_URL || (process.env.NODE_ENV === "production" ? "https://looplic-admin-mu.vercel.app/admin/:path*" : "http://localhost:3001/admin/:path*"),
        permanent: false,
      },
      {
        source: "/operator/:path*",
        destination: process.env.NEXT_PUBLIC_OPERATOR_URL || (process.env.NODE_ENV === "production" ? "https://looplic-operator-tan.vercel.app/operator/:path*" : "http://localhost:3003/operator/:path*"),
        permanent: false,
      },
      {
        source: "/operation/:path*",
        destination: process.env.NEXT_PUBLIC_OPERATOR_URL || (process.env.NODE_ENV === "production" ? "https://looplic-operator-tan.vercel.app/operator/:path*" : "http://localhost:3003/operation/:path*"),
        permanent: false,
      },
      {
        source: "/technician/:path*",
        destination: process.env.NEXT_PUBLIC_TECH_URL || (process.env.NODE_ENV === "production" ? "https://looplic-technician-seven.vercel.app/technician/:path*" : "http://localhost:3002/technician/:path*"),
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
