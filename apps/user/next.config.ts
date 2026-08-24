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
        has: [{ type: "host", value: "looplic.com" }],
        destination: "https://www.looplic.com/:path*",
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
    webpackBuildWorker: true,
    parallelServerCompiles: true,
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
