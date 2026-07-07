import { NextResponse } from "next/server";

import { db } from "@/src/lib/db";
import { buybackBookings } from "@/src/lib/db/schema";
import { sendLeadEmail } from "@/src/lib/email/resend";
import { getServerSupabase } from "@/src/lib/supabase/server";

export const runtime = "nodejs";

function cleanString(value: unknown, maxLength = 300): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function makeBookingCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `LBB-${suffix}`;
}

// Creates a buyback pickup booking (or a quote request for unpriced models).
// The booking row is best-effort: if the buyback_bookings migration hasn't
// been run yet (42P01) we still send the lead email so no customer is lost.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const mode = body?.mode === "quote" ? "quote" : "pickup";
    const brandName = cleanString(body?.brandName, 120);
    const modelName = cleanString(body?.modelName, 160);
    const customerName = cleanString(body?.name, 120);
    const phone = cleanString(body?.phone, 40);
    const address = cleanString(body?.address, 500);
    const pickupDate = cleanString(body?.pickupDate, 40);
    const timeSlot = cleanString(body?.timeSlot, 80);
    const variantLabel = cleanString(body?.variantLabel, 80);
    const serviceType = cleanString(body?.serviceType, 40) || "mobile";
    const quoteBreakdown = cleanString(body?.quoteBreakdown, 2000);
    const quotedAmountRaw = Number(body?.quotedAmount);
    const quotedAmount = Number.isFinite(quotedAmountRaw) && quotedAmountRaw > 0 ? Math.round(quotedAmountRaw) : null;

    if (!brandName || !modelName || !customerName || !phone) {
      return NextResponse.json({ ok: false, error: "Name, phone and device are required." }, { status: 400 });
    }

    // Attach the logged-in user (if any) so the booking shows in /account.
    let userId: string | null = null;
    try {
      const supabase = await getServerSupabase();
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id ?? null;
    } catch {
      // Anonymous booking is fine.
    }

    const bookingCode = makeBookingCode();
    let saved = false;

    try {
      await db.insert(buybackBookings).values({
        bookingCode,
        serviceType,
        brandName,
        modelName,
        variantLabel: variantLabel ?? null,
        quotedAmount: quotedAmount === null ? null : String(quotedAmount),
        quoteBreakdown: quoteBreakdown ?? null,
        customerName,
        phone,
        address: address ?? null,
        pickupDate: pickupDate ?? null,
        timeSlot: timeSlot ?? null,
        status: mode === "pickup" ? "pending" : "quote_requested",
        userId,
      });
      saved = true;
    } catch (err) {
      const e = err as { code?: string; cause?: { code?: string } };
      const code = e?.code ?? e?.cause?.code;
      if (code !== "42P01") throw err;
      // Table missing (migration pending) — fall through to email-only.
    }

    const device = `${brandName} ${modelName}${variantLabel ? ` (${variantLabel})` : ""}`;
    const emailResult = await sendLeadEmail({
      source: mode === "pickup" ? "buyback-pickup" : "buyback-quote-request",
      title:
        mode === "pickup"
          ? `Buyback pickup ${bookingCode} — ${device}${quotedAmount ? ` @ ₹${quotedAmount.toLocaleString("en-IN")}` : ""}`
          : `Buyback quote request ${bookingCode} — ${device}`,
      bookingCode,
      customer: { name: customerName, phone },
      device: { brand: brandName, model: modelName },
      schedule: { date: pickupDate ?? null, timeSlot: timeSlot ?? null },
      address: address ?? null,
      notes: quoteBreakdown ?? null,
      metadata: {
        variant: variantLabel ?? null,
        quotedAmount,
        savedToDb: saved,
      },
    });

    // The DB row is the source of truth once it exists; only fail the request
    // when we have neither a saved row nor a delivered email.
    if (!saved && !emailResult.ok) {
      return NextResponse.json({ ok: false, error: "Could not record your booking. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, bookingCode });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to process booking." },
      { status: 500 },
    );
  }
}
