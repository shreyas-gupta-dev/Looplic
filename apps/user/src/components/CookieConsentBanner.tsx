"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

const CONSENT_KEY = "looplic_cookie_consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        // Small delay so layout doesn't jump immediately on initial paint
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage disabled or security exception
    }
  }, []);

  const handleConsent = (granted: boolean) => {
    try {
      localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    } catch {
      // Storage unavailable
    }

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: granted ? "granted" : "denied",
        ad_storage: granted ? "granted" : "denied",
        ad_user_data: granted ? "granted" : "denied",
        ad_personalization: granted ? "granted" : "denied",
      });
    }

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie consent"
      role="region"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300 sm:left-6 sm:bottom-6"
    >
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Cookie className="size-5" />
          </div>
          <div className="flex-1 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Privacy & Cookie Preferences</h3>
              <button
                type="button"
                onClick={() => handleConsent(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Decline and close"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-300">
              We use necessary cookies to operate the platform and optional analytics cookies to measure booking performance. We never collect or sell personal information without your consent.
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleConsent(true)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={() => handleConsent(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Necessary Only
              </button>
              <Link
                href="/privacy-policy"
                className="ml-auto text-xs text-slate-500 underline transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
