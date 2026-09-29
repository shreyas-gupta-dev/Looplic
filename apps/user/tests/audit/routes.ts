/**
 * The routes the audit harness sweeps. Kept in one place so the smoke audit,
 * the image audit and the dead-control audit all cover exactly the same set.
 */
export type AuditRoute = {
  path: string;
  name: string;
  /** Routes that legitimately redirect (e.g. auth-gated pages). */
  expectRedirect?: boolean;
};

export const auditRoutes: AuditRoute[] = [
  { path: "/", name: "home" },
  { path: "/service/mobile-repair", name: "service: mobile repair" },
  { path: "/service/laptop-repair", name: "service: laptop repair" },
  { path: "/service/cctv", name: "service: cctv" },
  { path: "/service/it-support", name: "service: it support" },
  { path: "/service/desktop-assembly", name: "service: desktop assembly" },
  { path: "/service/managed-it-services", name: "service: managed it" },
  { path: "/service/mobile-repair/brands", name: "mobile repair brands" },
  { path: "/service/laptop-repair/brands", name: "laptop repair brands" },
  { path: "/sell", name: "sell home" },
  { path: "/sell/track", name: "sell tracking" },
  { path: "/track", name: "repair tracking" },
  { path: "/buy", name: "buy refurbished" },
  { path: "/blog", name: "blog index" },
  { path: "/store-locator", name: "store locator" },
  { path: "/partners", name: "partners" },
  { path: "/about-us", name: "about us" },
  { path: "/contact-us", name: "contact us" },
  { path: "/faq", name: "faq" },
  { path: "/cart", name: "cart" },
  { path: "/checkout", name: "checkout" },
  { path: "/auth", name: "auth (login/signup)" },
  { path: "/auth/reset-password", name: "password reset" },
  { path: "/account", name: "account", expectRedirect: true },
  { path: "/privacy-policy", name: "privacy policy" },
  { path: "/terms-and-conditions", name: "terms" },
];

/**
 * Console messages that are noise rather than defects. Keep this list short and
 * justified — every entry is a thing we have decided not to fix.
 */
export const ignoredConsolePatterns: RegExp[] = [
  // React DevTools nag in dev mode.
  /Download the React DevTools/i,
  // Next.js dev-only fast refresh / HMR chatter.
  /\[Fast Refresh\]/i,
  // Third-party analytics blocked by the browser or absent in dev.
  /googletagmanager|gtag\/js|google-analytics/i,
];

export function isIgnoredConsoleMessage(text: string): boolean {
  return ignoredConsolePatterns.some((pattern) => pattern.test(text));
}
