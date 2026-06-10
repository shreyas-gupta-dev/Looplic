import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|technician-alert-sw.js).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, max-age=0, must-revalidate",
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
    ];
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY,
    VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY,
  },
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
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
