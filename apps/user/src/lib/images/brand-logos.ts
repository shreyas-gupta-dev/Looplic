/**
 * Brand logo asset resolver.
 *
 * Looplic serves crisp, high-resolution first-party brand logos directly from
 * `/public/images/brands/`. This avoids relying on third-party competitor CDNs
 * or unpredictable favicon proxies.
 */

const BRAND_LOGO_MAP: Record<string, string> = {
  apple: "/images/brands/apple.png",
  samsung: "/images/brands/samsung.png",
  oneplus: "/images/brands/oneplus.png",
  xiaomi: "/images/brands/xiaomi.png",
  mi: "/images/brands/xiaomi.png",
  google: "/images/brands/google.png",
  vivo: "/images/brands/vivo.png",
  oppo: "/images/brands/oppo.png",
  realme: "/images/brands/realme.png",
  huawei: "/images/brands/huawei.svg",
  micromax: "/images/brands/micromax.svg",
  lava: "/images/brands/lava.svg",
  motorola: "/images/brands/motorola.png",
  moto: "/images/brands/motorola.png",
  lenovo: "/images/brands/lenovo.png",
  nokia: "/images/brands/nokia.png",
  honor: "/images/brands/honor.png",
  asus: "/images/brands/asus.png",
  lg: "/images/brands/lg.png",
  infinix: "/images/brands/infinix.png",
  tecno: "/images/brands/tecno.png",
  iqoo: "/images/brands/iqoo.png",
  nothing: "/images/brands/nothing.png",
  poco: "/images/brands/poco.png",
  dell: "/images/brands/dell.svg",
  hp: "/images/brands/hp.svg",
  acer: "/images/brands/acer.svg",
  msi: "/images/brands/msi.png",
  microsoft: "/images/brands/microsoft.svg",
  razer: "/images/brands/razer.svg",
  gigabyte: "/images/brands/gigabyte.svg",
  framework: "/images/brands/framework.svg",
  dynabook: "/images/brands/dynabook.svg",
  fujitsu: "/images/brands/fujitsu.svg",
  avita: "/images/brands/avita.png",
  vaio: "/images/brands/vaio.png",
  chuwi: "/images/brands/chuwi.png",
};

/**
 * Normalizes a brand name or slug to a dictionary key.
 * Removes whitespace, symbols, and trailing "-laptop" or "laptop".
 */
export function normalizeBrandKey(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/-laptop$/, "")
    .replace(/\s+laptop$/, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Returns the local logo path for a brand if available.
 */
export function getLocalBrandLogo(nameOrSlug: string): string | null {
  if (!nameOrSlug) return null;
  const key = normalizeBrandKey(nameOrSlug);
  return BRAND_LOGO_MAP[key] ?? null;
}
