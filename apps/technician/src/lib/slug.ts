const NON_ALPHANUMERIC = /[^a-z0-9]+/g;
const TRIM_HYPHENS = /^-+|-+$/g;

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, "-")
    .replace(TRIM_HYPHENS, "")
    .replace(/-{2,}/g, "-");
}

export function withSlugFallback(value: string, fallback: string) {
  const slug = slugify(value);
  return slug.length > 0 ? slug : fallback;
}
