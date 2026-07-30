import { getVisitingChargePolicy } from "@/src/lib/visiting-charge";

import { SERVICE_LABELS } from "./constants";
import type { FlowContext } from "./types";

// Booking summary + notes construction. `buildBookingNotes` is a deliberate
// mirror of buildBookingNotes() inside UniversalBookingFlow.tsx so a WhatsApp
// booking's notes column reads exactly like a website booking's — same laptop
// spec line, same CCTV config line, same visiting-charge policy sentence.

export function inr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function buildBookingNotes(context: FlowContext): string {
  const parts: string[] = [];

  if (context.laptopRam || context.laptopStorage || context.laptopOs) {
    const specs = [
      context.laptopRam && `RAM: ${context.laptopRam}`,
      context.laptopStorage && `Storage: ${context.laptopStorage}`,
      context.laptopOs && `OS: ${context.laptopOs}`,
    ]
      .filter(Boolean)
      .join(", ");
    if (specs) parts.push(`Laptop specs: ${specs}`);
  }

  if (context.cctvCameraCount || context.cctvLocationType || context.cctvDvrPreference) {
    const cctv = [
      context.cctvCameraCount && `Cameras: ${context.cctvCameraCount}`,
      context.cctvLocationType && `Location: ${context.cctvLocationType}`,
      context.cctvDvrPreference && `DVR/NVR: ${context.cctvDvrPreference}`,
    ]
      .filter(Boolean)
      .join(", ");
    if (cctv) parts.push(`CCTV config: ${cctv}`);
  }

  if (context.notes?.trim()) parts.push(context.notes.trim());

  const policy = getVisitingChargePolicy(context.dbServiceType);
  if (policy) parts.push(policy);

  // Provenance, so the ops team can tell at a glance this came from the bot.
  parts.push("Booked via WhatsApp");

  return parts.filter(Boolean).join("\n\n");
}

// Catalog model AND series names often already carry the brand ("Apple iPhone
// 15 Pro", "Apple iPhone 15 Series"), so only prefix the brand when it isn't
// already there — otherwise the customer reads "Apple Apple iPhone 15 Pro".
// Same rule searchDevices() applies when building its label.
export function withBrand(brandName: string | undefined, name: string | undefined): string {
  const brand = (brandName || "").trim();
  const value = (name || "").trim();
  if (!value) return brand;
  if (!brand) return value;
  const norm = (input: string) => input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return norm(value).startsWith(norm(brand)) ? value : `${brand} ${value}`;
}

export function deviceLabel(context: FlowContext): string {
  return withBrand(context.brandName, context.modelName);
}

export function seriesLabel(context: FlowContext): string {
  return withBrand(context.brandName, context.seriesName);
}

// The human-readable name of what's being booked (used in the confirmation, the
// lead email subject and the team alert).
export function selectionLabel(context: FlowContext): string {
  if (context.kind === "repair") return context.repairSubcategoryName || "Repair";
  if (context.kind === "guard") return context.guardType ? stripGuardPrefix(context.guardType) : "Screen guard";
  if (context.kind === "cctv") {
    return [context.cctvServiceLabel, context.cctvBrand].filter(Boolean).join(" – ") || "CCTV";
  }
  if (context.kind === "sell") return `Sell ${deviceLabel(context)}`.trim();
  return SERVICE_LABELS[context.dbServiceType || ""] || "Service";
}

function stripGuardPrefix(guardType: string): string {
  const parts = guardType.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : guardType;
}

export function priceOf(context: FlowContext): number | null {
  if (context.kind === "repair") return context.priceVisible === false ? null : context.price ?? null;
  if (context.kind === "guard") return context.guardPrice ?? null;
  if (context.kind === "sell") return context.sellQuote ?? null;
  return null;
}

export function formatAddress(context: FlowContext): string {
  return [context.address, context.city, context.pincode].filter(Boolean).join(", ");
}

// "Wed, 30 Jul" — short and unambiguous for a WhatsApp bubble.
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// The order review shown before the customer taps Confirm — the WhatsApp
// equivalent of the website's schedule step summary.
export function buildConfirmSummary(context: FlowContext): string {
  const lines: string[] = ["*Please check your booking* 📋", ""];

  const service = SERVICE_LABELS[context.dbServiceType || ""] || "Service";
  lines.push(`*Service:* ${service}`);

  const device = deviceLabel(context);
  if (device) lines.push(`*Device:* ${device}`);

  const selection = selectionLabel(context);
  if (selection && selection !== service) lines.push(`*Selected:* ${selection}`);

  const price = priceOf(context);
  if (price !== null) {
    lines.push(context.kind === "sell" ? `*Our offer:* ${inr(price)}` : `*Price:* ${inr(price)}`);
  } else if (context.kind !== "sell") {
    lines.push("*Price:* confirmed by our team");
  }

  if (context.laptopRam || context.laptopStorage || context.laptopOs) {
    lines.push(
      `*Laptop:* ${[context.laptopRam, context.laptopStorage, context.laptopOs].filter(Boolean).join(" · ")}`,
    );
  }
  if (context.cctvCameraCount || context.cctvLocationType || context.cctvDvrPreference) {
    lines.push(
      `*Setup:* ${[context.cctvCameraCount, context.cctvLocationType, context.cctvDvrPreference]
        .filter(Boolean)
        .join(" · ")}`,
    );
  }

  lines.push("");
  lines.push(`*Name:* ${context.name || "—"}`);
  lines.push(`*Phone:* ${context.phone || "—"}`);
  lines.push(`*Address:* ${formatAddress(context) || "—"}`);
  lines.push(
    `*${context.kind === "sell" ? "Pickup" : "Visit"}:* ${formatDate(context.scheduledDate)} · ${context.timeSlot || "—"}`,
  );

  if (context.notes?.trim()) lines.push(`*Notes:* ${context.notes.trim()}`);

  const policy = getVisitingChargePolicy(context.dbServiceType);
  if (policy) {
    lines.push("");
    lines.push(`_${policy}_`);
  }
  if (context.kind === "sell") {
    lines.push("");
    lines.push("_The final amount is confirmed after our executive inspects the device._");
  }

  return lines.join("\n");
}
