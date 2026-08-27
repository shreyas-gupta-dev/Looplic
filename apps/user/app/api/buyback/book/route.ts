import { NextResponse } from "next/server";

import { db } from "@/src/lib/db";
import { buybackBookings } from "@/src/lib/db/schema";
import { sendCustomerBookingConfirmation, sendLeadEmail } from "@/src/lib/email/resend";
import { createBookingConfirmationPdfBytes } from "@/src/lib/invoice-pdf";
import { getServerSupabase } from "@/src/lib/supabase/server";
import { brandOsSegment, computeBuybackQuote } from "@/src/lib/buyback/calc";
import { getBuybackQuestionSet, getBuybackVariants, type BuybackServiceType } from "@/src/lib/data/buyback";
import { isValidPhoneNumber, isValidPincode } from "@/src/lib/bookings";
import { enforceRateLimit } from "@/src/lib/rate-limit";

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
    const rateLimit = await enforceRateLimit(request, "buyback-book", 8, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json({ ok: false, error: "Too many requests. Please try again in a few minutes." }, { status: 429 });
    }

    const body = await request.json();

    const mode = body?.mode === "quote" ? "quote" : "pickup";
    const brandName = cleanString(body?.brandName, 120);
    const modelName = cleanString(body?.modelName, 160);
    const customerName = cleanString(body?.name, 120);
    const phone = cleanString(body?.phone, 40);
    const address = cleanString(body?.address, 500);
    const pincode = cleanString(body?.pincode, 10);
    const pickupDate = cleanString(body?.pickupDate, 40);
    const timeSlot = cleanString(body?.timeSlot, 80);
    const variantLabel = cleanString(body?.variantLabel, 80);
    const serviceType = cleanString(body?.serviceType, 40) || "mobile";
    const quoteBreakdown = cleanString(body?.quoteBreakdown, 2000);
    const modelId = cleanString(body?.modelId, 100);
    const variantId = cleanString(body?.variantId, 100);
    const selectedAnswers =
      body?.selectedAnswers && typeof body.selectedAnswers === "object" && !Array.isArray(body.selectedAnswers)
        ? (body.selectedAnswers as Record<string, unknown>)
        : null;
    const quotedAmountRaw = Number(body?.quotedAmount);
    let quotedAmount = Number.isFinite(quotedAmountRaw) && quotedAmountRaw > 0 ? Math.round(quotedAmountRaw) : null;

    if (!brandName || !modelName || !customerName || !phone) {
      return NextResponse.json({ ok: false, error: "Name, phone and device are required." }, { status: 400 });
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json({ ok: false, error: "Please enter a valid phone number." }, { status: 400 });
    }

    if (mode === "pickup") {
      if (!address) {
        return NextResponse.json({ ok: false, error: "Please enter your pickup address." }, { status: 400 });
      }
      if (pincode && !isValidPincode(pincode)) {
        return NextResponse.json({ ok: false, error: "Please enter a valid 6-digit pincode." }, { status: 400 });
      }
    }

    // Never trust a client-submitted price: recompute it server-side from the
    // model/variant/answers and use that instead, so a tampered quotedAmount
    // in the request can't be stored or paid out.
    if (mode === "pickup" && modelId && variantId && selectedAnswers) {
      try {
        const variants = await getBuybackVariants(modelId);
        const variant = variants.find((v) => v.id === variantId);
        if (variant) {
          const osSegment = brandOsSegment(brandName);
          const { questions, optionsByQuestion } = await getBuybackQuestionSet(serviceType as BuybackServiceType, osSegment);
          const normalizedAnswers: Record<string, string[]> = {};
          for (const [questionId, optionIds] of Object.entries(selectedAnswers)) {
            if (Array.isArray(optionIds)) normalizedAnswers[questionId] = optionIds.filter((id): id is string => typeof id === "string");
          }
          const recomputed = computeBuybackQuote(variant.basePrice, questions, optionsByQuestion, normalizedAnswers);
          quotedAmount = recomputed.finalQuote;
        }
      } catch {
        // Recomputation is best-effort — if it fails (e.g. transient DB
        // issue), fall back to the client-submitted amount rather than
        // blocking the booking outright.
      }
    }

    // Attach the logged-in user (if any) so the booking shows in /account.
    // The account email also receives the pickup confirmation, since the
    // pickup form itself only collects name and phone.
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const supabase = await getServerSupabase();
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id ?? null;
      userEmail = data?.user?.email ?? null;
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

    // Pickup confirmation to the customer (best-effort — never fails the booking).
    if (mode === "pickup" && userEmail) {
      try {
        const pdf = createBookingConfirmationPdfBytes({
          bookingCode,
          customerName,
          customerPhone: phone,
          customerEmail: userEmail,
          serviceType,
          serviceLabel: "Sell Device - Doorstep Pickup",
          documentTitle: "PICKUP CONFIRMATION",
          priceLabel: "Quoted amount",
          price: quotedAmount,
          brand: brandName,
          model: `${modelName}${variantLabel ? ` (${variantLabel})` : ""}`,
          scheduledDate: pickupDate,
          timeSlot,
          address,
          notes: quoteBreakdown,
        });
        const confirmationResult = await sendCustomerBookingConfirmation(
          {
            source: "buyback-pickup",
            bookingCode,
            customer: { name: customerName, phone, email: userEmail },
            service: { type: serviceType, label: "Sell Device - Doorstep Pickup", price: quotedAmount ? String(quotedAmount) : undefined },
            device: { brand: brandName, model: modelName },
            schedule: { date: pickupDate ?? null, timeSlot: timeSlot ?? null },
            address: address ?? null,
          },
          {
            pdfBase64: Buffer.from(pdf, "binary").toString("base64"),
            pdfFilename: `${bookingCode}-pickup-confirmation.pdf`,
          },
        );
        if (!confirmationResult.ok) {
          console.error("Buyback pickup confirmation email failed", "error" in confirmationResult ? confirmationResult.error : confirmationResult.status);
        }
      } catch (err) {
        console.warn("Buyback pickup confirmation failed (non-fatal)", err);
      }
    }

    return NextResponse.json({ ok: true, bookingCode });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to process booking." },
      { status: 500 },
    );
  }
}
