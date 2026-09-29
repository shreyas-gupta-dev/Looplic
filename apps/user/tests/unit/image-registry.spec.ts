import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  allImageSlots,
  getSellCategoryImage,
  getServiceImage,
  illustration,
  isRenderableImageUrl,
  sellCategoryImages,
  serviceImages,
} from "@/src/lib/images/registry";
import { ourServices, sellCategories } from "@/src/components/next/homepage-data";

/**
 * Guards the image registry.
 *
 * The failure this prevents is the one that was already live: a slot pointing at
 * a URL that 404s, or at a third party's CDN. Local assets are checked on disk;
 * remote ones must be on the next.config.ts allowlist.
 */

const PUBLIC_DIR = join(process.cwd(), "public");

// Must match images.remotePatterns in next.config.ts.
const ALLOWED_REMOTE_HOSTS = [
  /^looplic-assets\.s3\.ap-south-1\.amazonaws\.com$/,
  /^looplic-assets\.s3\.amazonaws\.com$/,
  /^res\.cloudinary\.com$/,
  /\.supabase\.co$/,
];

test("every registry slot resolves to a local file or an allowlisted host", () => {
  expect(allImageSlots.length).toBeGreaterThan(0);

  for (const slot of allImageSlots) {
    if (slot.src.startsWith("/")) {
      const onDisk = join(PUBLIC_DIR, slot.src.replace(/^\//, ""));
      expect(existsSync(onDisk), `missing local asset for ${slot.src}`).toBe(true);
      continue;
    }

    const url = new URL(slot.src);
    expect(url.protocol, `${slot.src} must be https`).toBe("https:");
    const allowed = ALLOWED_REMOTE_HOSTS.some((pattern) => pattern.test(url.hostname));
    expect(allowed, `${url.hostname} is not in images.remotePatterns`).toBe(true);
  }
});

test("every slot has non-empty alt text", () => {
  for (const slot of allImageSlots) {
    expect(slot.alt.trim().length, `empty alt for ${slot.src}`).toBeGreaterThan(0);
  }
});

test("no slot points at a competitor CDN or a stock photo host", () => {
  const forbidden = [/cashify/i, /unsplash/i, /gstatic/i, /yandex/i, /pexels/i];

  for (const slot of allImageSlots) {
    for (const pattern of forbidden) {
      expect(pattern.test(slot.src), `${slot.src} matches ${pattern}`).toBe(false);
    }
  }
});

test("every homepage service tile has a registry entry", () => {
  for (const service of ourServices) {
    expect(getServiceImage(service.id), `no image slot for service "${service.id}"`).not.toBeNull();
  }
  // And nothing is declared that is never used.
  expect(Object.keys(serviceImages).sort()).toEqual(ourServices.map((s) => s.id).sort());
});

test("every sell category tile has a registry entry", () => {
  for (const category of sellCategories) {
    expect(getSellCategoryImage(category.id), `no image slot for category "${category.id}"`).not.toBeNull();
  }
  expect(Object.keys(sellCategoryImages).sort()).toEqual(sellCategories.map((c) => c.id).sort());
});

test("homepage data no longer carries raw image URLs", () => {
  // Assets belong in the registry; a stray `image` field here is how the old
  // hotlinks got in.
  for (const entry of [...ourServices, ...sellCategories]) {
    expect(entry, `${entry.id} should not declare its own image`).not.toHaveProperty("image");
  }
});

/**
 * The guard applied to database-supplied catalog imagery.
 *
 * These are the exact URL shapes that migration left in `brands.image_url`,
 * `models.image_url` and the sell catalog. Every component that renders one of
 * those columns must route it through this function, otherwise a competitor's
 * CDN or Google's favicon proxy is rendered on a Looplic page — and the favicon
 * proxy 404s for brands it has no icon for, which is how the broken Fujitsu
 * logo reached production.
 */
test("isRenderableImageUrl rejects the URLs migration left in the catalog", () => {
  const rejected = [
    "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&url=http://fujitsu.com&size=128",
    "https://s3ng.cashify.in/images/model/apple-iphone-13.png",
    "http://looplic-assets.s3.ap-south-1.amazonaws.com/brand/apple.png", // not https
    "https://evil.example.com/looplic-assets.s3.amazonaws.com/x.png", // host must match, not merely contain
    "not a url",
    "",
    "   ",
    null,
    undefined,
  ];

  for (const url of rejected) {
    expect(isRenderableImageUrl(url), `${String(url)} must be refused`).toBe(false);
  }
});

test("isRenderableImageUrl accepts our own assets and allowlisted hosts", () => {
  const accepted = [
    "/illustrations/repair-phone.svg",
    "https://looplic-assets.s3.ap-south-1.amazonaws.com/brand/apple.png",
    "https://looplic-assets.s3.amazonaws.com/brand/apple.png",
    "https://res.cloudinary.com/looplic/image/upload/apple.png",
    "https://abcdefg.supabase.co/storage/v1/object/public/brand/apple.png",
  ];

  for (const url of accepted) {
    expect(isRenderableImageUrl(url), `${url} must be allowed`).toBe(true);
  }
});

test("the guard allowlist and the registry's own slots agree", () => {
  // A slot the registry ships must itself pass the guard, or an override would
  // be rendered while the default is silently dropped.
  for (const slot of allImageSlots) {
    expect(isRenderableImageUrl(slot.src), `registry slot ${slot.src} fails its own guard`).toBe(true);
  }
});

/**
 * Consistency of the generated illustration set.
 *
 * These tiles are only credible as a set if they share a canvas, a stroke weight
 * and a palette. Drift here is exactly what made the previous set look homemade,
 * and it is invisible in code review because each file is generated separately.
 */
/**
 * The licensed-photography path.
 *
 * The registry exists so that swapping generated artwork for real photography is a
 * one-line change and no component is touched. These assert that the swap works,
 * and that it cannot be used to smuggle in an unhosted URL.
 */
test("a licensed photography override replaces the illustration", () => {
  const photo = "https://looplic-assets.s3.ap-south-1.amazonaws.com/photography/repair-phone.jpg";
  const slot = illustration("repair-phone", "Mobile phone repair", photo);

  expect(slot.src).toBe(photo);
  expect(slot.alt).toBe("Mobile phone repair");
  // A photograph should go through the Next.js optimizer; only our SVGs skip it.
  expect(slot.unoptimized).toBeUndefined();
});

test("an override that is not on the allowlist is ignored, not rendered", () => {
  for (const bad of [
    "https://s3ng.cashify.in/photography/repair-phone.jpg",
    "https://images.unsplash.com/photo-1546868871-af0de0ae72be",
    "http://looplic-assets.s3.ap-south-1.amazonaws.com/photography/x.jpg",
  ]) {
    const slot = illustration("repair-phone", "Mobile phone repair", bad);
    expect(slot.src, `${bad} must not be rendered`).toBe("/illustrations/repair-phone.svg");
    expect(slot.unoptimized).toBe(true);
  }
});

test("no override means the generated illustration, skipping the optimizer", () => {
  const slot = illustration("repair-phone", "Mobile phone repair");
  expect(slot.src).toBe("/illustrations/repair-phone.svg");
  expect(slot.unoptimized).toBe(true);
});

test("every illustration shares one canvas, one stroke weight and no external refs", () => {
  const localSvgs = allImageSlots
    .map((slot) => slot.src)
    .filter((src) => src.startsWith("/illustrations/"));

  expect(localSvgs.length).toBeGreaterThan(0);

  const strokeWidths = new Set<string>();

  for (const src of new Set(localSvgs)) {
    const svg = readFileSync(join(PUBLIC_DIR, src.replace(/^\//, "")), "utf8");

    expect(svg, `${src} must declare a 400x400 viewBox`).toContain('viewBox="0 0 400 400"');

    // No external references: these must render offline and leak no requests.
    expect(/(?:href|src)\s*=\s*"https?:/i.test(svg), `${src} references a remote resource`).toBe(false);
    expect(svg.includes("<image"), `${src} embeds a raster image`).toBe(false);

    // Emphasis must come from colour, not from a second stroke weight.
    for (const match of svg.matchAll(/stroke-width="(\d+)"/g)) {
      strokeWidths.add(match[1]);
    }
  }

  expect(
    [...strokeWidths],
    `the set uses more than one stroke weight: ${[...strokeWidths].join(", ")}`,
  ).toHaveLength(1);
});
