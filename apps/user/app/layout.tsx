import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";

import "@/app/globals.css";
import { AppProviders } from "@/components/Providers";
import { LazyOverlays } from "@/components/LazyOverlays";
import { GOOGLE_ADS_ID, GTAG_IDS } from "@/src/lib/gtag";
import { siteConfig } from "@/src/lib/site";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Sell & Buy Refurbished Phones, Laptops & More",
    template: "%s | Looplic",
  },
  description: siteConfig.description,
  icons: {
    icon: "/looplic-app-icon-192.png",
    shortcut: "/looplic-app-icon-192.png",
    apple: "/looplic-app-icon-192.png",
  },
  manifest: "/manifest.webmanifest",
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google-site-verification=looplic-search-console-verification",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: new URL("/looplic-app-icon-512.png", siteConfig.url).toString(),
  description: siteConfig.description,
  sameAs: ["https://www.instagram.com/looplic/", "https://www.linkedin.com/company/looplic"],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-88844-45924",
    contactType: "customer support",
    areaServed: "IN",
    availableLanguage: ["en", "hi"],
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "1st Floor, Shawkat Building, SJP Road, opp. Dasappa Hospital, near Town Hall, Dodpete, Nagarathpete",
    addressLocality: "Bengaluru",
    addressRegion: "Karnataka",
    postalCode: "560002",
    addressCountry: "IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://looplic-assets.s3.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://looplic-assets.s3.ap-south-1.amazonaws.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={poppins.variable} suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="lazyOnload" />
        <Script id="looplic-google-ads" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            ${GTAG_IDS.map((id) => `gtag('config', '${id}');`).join("\n            ")}
          `}
        </Script>
        <Script id="looplic-pwa-install" strategy="afterInteractive">
          {`
            (function () {
              if (window.__looplicPwaInstallSetup) return;
              window.__looplicPwaInstallSetup = true;

              window.addEventListener("beforeinstallprompt", function (event) {
                event.preventDefault();
                window.__looplicInstallPrompt = event;
                window.dispatchEvent(new Event("looplic-install-prompt-ready"));
              });

              window.addEventListener("appinstalled", function () {
                window.__looplicInstallPrompt = null;
                try {
                  window.localStorage.setItem("looplic-install-app-installed", "true");
                } catch (error) {}
                window.dispatchEvent(new Event("looplic-app-installed"));
              });

              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.register("/sw.js")
                  .then(function () {
                    return navigator.serviceWorker.ready;
                  })
                  .then(function () {
                    window.dispatchEvent(new Event("looplic-service-worker-ready"));
                  })
                  .catch(function () {});
              }
            })();
          `}
        </Script>
        {children}
        <LazyOverlays />
        <AppProviders />
      </body>
    </html>
  );
}
