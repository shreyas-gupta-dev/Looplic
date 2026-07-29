#!/usr/bin/env node
// One-time: stamp the Looplic business profile onto the WhatsApp Cloud API number
// so the chat shows Looplic branding (about / address / email / website / logo)
// instead of "Numunix". Run this AFTER the number is migrated to the Cloud API.
//
// Usage (PowerShell):
//   $env:WHATSAPP_PHONE_NUMBER_ID="..."; $env:WHATSAPP_ACCESS_TOKEN="..."; `
//   $env:WHATSAPP_APP_ID="..."; node scripts/whatsapp-set-profile.mjs
//
// Required env: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
// Optional env: WHATSAPP_APP_ID (needed to upload the profile picture),
//               WHATSAPP_API_VERSION (default v21.0),
//               WHATSAPP_PROFILE_IMAGE (path to a jpeg/png; default the app icon)
//
// Node 18+ (uses global fetch). No dependencies.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const APP_ID = process.env.WHATSAPP_APP_ID;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_IMAGE = path.resolve(__dirname, "../apps/user/public/looplic-app-icon-512.png");
const IMAGE_PATH = process.env.WHATSAPP_PROFILE_IMAGE || DEFAULT_IMAGE;

// The Looplic business profile. Edit these if the details change.
const PROFILE = {
  about: "Doorstep mobile & laptop repair, buyback and IT services in Bengaluru.",
  address: "SJP Road, Bengaluru, Karnataka 560002",
  description:
    "Looplic — doorstep repair for mobiles, laptops and desktops, plus device buyback, CCTV and IT support across Bengaluru. Verified technicians, fair pricing.",
  email: "support@looplic.com",
  vertical: "PROF_SERVICES",
  websites: ["https://www.looplic.com"],
};

function die(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
  die(
    "Missing WHATSAPP_PHONE_NUMBER_ID and/or WHATSAPP_ACCESS_TOKEN.\n" +
      "  Set them (from Meta → WhatsApp → API Setup) and re-run. This script only\n" +
      "  works after the number is migrated to the Cloud API.",
  );
}

const BASE = `https://graph.facebook.com/${API_VERSION}`;

// Uploads the profile picture via the resumable Upload API and returns the file
// handle to attach to the business profile. Requires WHATSAPP_APP_ID.
async function uploadProfilePicture() {
  if (!APP_ID) {
    console.warn("• Skipping profile picture — set WHATSAPP_APP_ID to upload it (or set it in Meta UI).");
    return null;
  }
  if (!fs.existsSync(IMAGE_PATH)) {
    console.warn(`• Skipping profile picture — image not found at ${IMAGE_PATH}`);
    return null;
  }
  const bytes = fs.readFileSync(IMAGE_PATH);
  const fileType = IMAGE_PATH.toLowerCase().endsWith(".jpg") || IMAGE_PATH.toLowerCase().endsWith(".jpeg")
    ? "image/jpeg"
    : "image/png";

  // 1. Create an upload session.
  const startUrl = `${BASE}/${APP_ID}/uploads?file_length=${bytes.length}&file_type=${encodeURIComponent(fileType)}&access_token=${ACCESS_TOKEN}`;
  const startRes = await fetch(startUrl, { method: "POST" });
  const startData = await startRes.json().catch(() => null);
  if (!startRes.ok || !startData?.id) {
    console.warn(`• Could not start picture upload: ${startData?.error?.message || startRes.status}`);
    return null;
  }

  // 2. Upload the bytes; response carries the file handle `h`.
  const upRes = await fetch(`${BASE}/${startData.id}`, {
    method: "POST",
    headers: { Authorization: `OAuth ${ACCESS_TOKEN}`, file_offset: "0" },
    body: bytes,
  });
  const upData = await upRes.json().catch(() => null);
  if (!upRes.ok || !upData?.h) {
    console.warn(`• Picture upload failed: ${upData?.error?.message || upRes.status}`);
    return null;
  }
  console.log("• Profile picture uploaded.");
  return upData.h;
}

async function main() {
  console.log(`Setting Looplic WhatsApp business profile on phone_number_id ${PHONE_NUMBER_ID} …`);

  const profilePictureHandle = await uploadProfilePicture();

  const body = {
    messaging_product: "whatsapp",
    ...PROFILE,
    ...(profilePictureHandle ? { profile_picture_handle: profilePictureHandle } : {}),
  };

  const res = await fetch(`${BASE}/${PHONE_NUMBER_ID}/whatsapp_business_profile`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || data?.success === false) {
    die(`Profile update failed: ${data?.error?.message || res.status}\n  ${JSON.stringify(data)}`);
  }

  console.log("\n✓ Looplic business profile updated.");
  console.log("  Note: the verified DISPLAY NAME (shown as the contact name) is changed");
  console.log("  separately in Meta → WhatsApp Manager → Phone numbers → Name, and needs");
  console.log("  Meta review. This script sets about/address/email/website/logo only.");
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
