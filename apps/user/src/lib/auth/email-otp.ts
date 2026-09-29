import crypto from "node:crypto";
import { desc, eq } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { authEmailOtps } from "@looplic/db/schema";
import { normalizeIdentifier } from "./admin-users";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

/**
 * Generates a cryptographically secure 6-digit numeric OTP,
 * stores it in the database with a 10-minute expiry, and returns it.
 */
export async function generateAndSaveEmailOtp(email: string): Promise<string> {
  const normalized = normalizeIdentifier(email);
  const code = Math.floor(100000 + crypto.randomInt(900000)).toString();

  // Clear any existing active OTPs for this email to prevent reuse or confusion
  try {
    await db.delete(authEmailOtps).where(eq(authEmailOtps.email, normalized));
  } catch (err) {
    console.warn("[email-otp] Could not clear existing OTPs:", err);
  }

  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.insert(authEmailOtps).values({
    email: normalized,
    code,
    expiresAt,
    attempts: 0,
  });

  return code;
}

/**
 * Verifies a 6-digit numeric OTP for an email address.
 * Enforces expiration and rate-limits brute force attempts.
 */
export async function verifyEmailOtp(
  email: string,
  candidateCode: string,
): Promise<{ valid: boolean; error?: string }> {
  const normalized = normalizeIdentifier(email);
  const trimmed = candidateCode.trim();

  if (!trimmed || trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
    return { valid: false, error: "Please enter a valid 6-digit verification code." };
  }

  const rows = await db
    .select()
    .from(authEmailOtps)
    .where(eq(authEmailOtps.email, normalized))
    .orderBy(desc(authEmailOtps.createdAt))
    .limit(1);

  if (!rows || rows.length === 0) {
    return { valid: false, error: "No verification code found. Please request a new one." };
  }

  const record = rows[0];

  if (new Date() > new Date(record.expiresAt)) {
    try {
      await db.delete(authEmailOtps).where(eq(authEmailOtps.id, record.id));
    } catch {}
    return { valid: false, error: "Verification code has expired. Please request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    try {
      await db.delete(authEmailOtps).where(eq(authEmailOtps.id, record.id));
    } catch {}
    return { valid: false, error: "Too many incorrect attempts. Please request a new code." };
  }

  if (record.code !== trimmed) {
    try {
      await db
        .update(authEmailOtps)
        .set({ attempts: record.attempts + 1 })
        .where(eq(authEmailOtps.id, record.id));
    } catch {}
    return { valid: false, error: "Incorrect verification code. Please check and try again." };
  }

  // Code matched! Delete consumed OTP
  try {
    await db.delete(authEmailOtps).where(eq(authEmailOtps.id, record.id));
  } catch {}

  return { valid: true };
}
