import type { LucideIcon } from "lucide-react";
import {
  Battery,
  Camera,
  Cpu,
  Droplets,
  Fingerprint,
  HardDrive,
  Keyboard,
  Monitor,
  Radio,
  Settings,
  Smartphone,
  Stethoscope,
  Volume2,
  Wrench,
  Zap,
} from "lucide-react";

/**
 * Repair-selection plumbing for the service landing pages.
 *
 * The "What needs fixing?" tiles used to be a hardcoded list of six `<div>`s with
 * no destination: they looked clickable, did nothing, and did not correspond to
 * the repair categories actually in the database (they showed mobile categories
 * like "Camera Repair" on the laptop page, where no such category exists).
 *
 * Now the tiles are driven by the real `repair_categories` rows and each one
 * carries its category id down the catalog path. UniversalBookingFlow already
 * seeds its `selectedCategoryId` from a `category` query param, so a tile click
 * arrives at the booking step with the repair preselected.
 */

export const REPAIR_SELECTION_PARAM = "category";

/**
 * Icon per repair category. Matched on the category name, longest key first, so
 * "Battery Replacement" (laptop) and "Battery" (mobile) both resolve.
 * Categories with no match fall back to a wrench.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "screen replacement": Monitor,
  "battery replacement": Battery,
  "keyboard replacement": Keyboard,
  "motherboard repair": Cpu,
  "hinge repair": Wrench,
  "ssd/ram upgrade": HardDrive,
  "speaker & sound": Volume2,
  "body & frame": Smartphone,
  "water damage": Droplets,
  "other services": Wrench,
  diagnostics: Stethoscope,
  connectivity: Radio,
  motherboard: Cpu,
  charging: Zap,
  battery: Battery,
  buttons: Fingerprint,
  sensors: Fingerprint,
  software: Settings,
  camera: Camera,
  screen: Monitor,
};

export function repairCategoryIcon(categoryName: string): LucideIcon {
  const normalized = categoryName.trim().toLowerCase();
  if (CATEGORY_ICONS[normalized]) return CATEGORY_ICONS[normalized];

  // Partial match, longest key first so "battery replacement" beats "battery".
  const keys = Object.keys(CATEGORY_ICONS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (normalized.includes(key)) return CATEGORY_ICONS[key];
  }
  return Wrench;
}

/**
 * Short helper line under a tile. Kept generic rather than inventing
 * category-specific copy that could contradict the actual subcategories.
 */
export function repairCategoryHint(categoryName: string): string {
  return `See ${categoryName.toLowerCase()} options and prices`;
}

/**
 * Appends the repair selection to a catalog href, preserving any query string the
 * href already has.
 */
export function withRepairSelection(href: string, categoryId?: string | null): string {
  if (!categoryId) return href;

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${REPAIR_SELECTION_PARAM}=${encodeURIComponent(categoryId)}`;
}

/**
 * Reads the repair selection out of a Next.js `searchParams` object, ignoring
 * anything that is not a single plain string.
 */
export function readRepairSelection(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): string | null {
  const raw = searchParams?.[REPAIR_SELECTION_PARAM];
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  // Category ids are UUIDs; refuse anything else so the value can never be used
  // to smuggle arbitrary text into downstream links.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed) ? trimmed : null;
}
