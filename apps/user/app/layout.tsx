import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";

import "@/app/globals.css";
import { AppProviders } from "@/components/Providers";
import { GOOGLE_ADS_ID, GOOGLE_ADS_IDS } from "@/src/lib/gtag";
import { siteConfig } from "@/src/lib/site";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Device Repair & Tech Support at Home",
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
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: new URL("/looplic-app-icon-512.png", siteConfig.url).toString(),
  description: siteConfig.description,
  sameAs: ["https://www.instagram.com/thelooplic/", "https://www.linkedin.com/company/looplic"],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-98865-79923",
    contactType: "customer support",
    areaServed: "IN",
    availableLanguage: ["en", "hi"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={nunito.variable} suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
        <Script id="looplic-google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            ${GOOGLE_ADS_IDS.map((id) => `gtag('config', '${id}');`).join("\n            ")}
          `}
        </Script>
        <Script id="looplic-pwa-install" strategy="beforeInteractive">
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
        <AppProviders />
      </body>
    </html>
  );
}
