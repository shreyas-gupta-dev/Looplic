import { NextResponse } from "next/server";

import { sendCustomerBookingConfirmation, sendLeadEmail, type EmailPdfAttachment } from "@/src/lib/email/resend";
import { createBookingConfirmationPdfBytes } from "@/src/lib/invoice-pdf";
import type { LeadPayload } from "@/src/lib/leads/types";
import { notifyCustomerBookingConfirmation, notifyTeamNewLead } from "@/src/lib/whatsapp/notify";

export const runtime = "nodejs";

// The confirmation PDF is best-effort: a rendering bug must never block the
// confirmation email itself.
function buildBookingConfirmationAttachment(payload: LeadPayload): EmailPdfAttachment | undefined {
  try {
    const pdf = createBookingConfirmationPdfBytes({
      bookingCode: payload.bookingCode,
      customerName: payload.customer?.name || "Customer",
      customerPhone: payload.customer?.phone || "",
      customerEmail: payload.customer?.email,
      serviceType: payload.service?.type || "",
      serviceLabel: payload.service?.label || payload.service?.type || "Service booking",
      price: payload.service?.price,
      brand: payload.device?.brand,
      series: payload.device?.series,
      model: payload.device?.model,
      scheduledDate: payload.schedule?.date,
      timeSlot: payload.schedule?.timeSlot,
      address: payload.address,
      city: payload.city,
      pincode: payload.pincode,
      notes: payload.notes,
    });
    return {
      pdfBase64: Buffer.from(pdf, "binary").toString("base64"),
      pdfFilename: `${payload.bookingCode || "looplic-booking"}-confirmation.pdf`.replace(/[^a-zA-Z0-9._-]+/g, "-"),
    };
  } catch (error) {
    console.warn("Booking confirmation PDF generation failed (email sent without attachment)", error);
    return undefined;
  }
}

function cleanString(value: unknown, maxLength = 500) {
  if (value === null || value === undefined) {
    return undefined;
  }

  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function cleanLeadPayload(input: any): LeadPayload {
  return {
    source: cleanString(input?.source, 80) || "website",
    title: cleanString(input?.title, 160),
    bookingCode: cleanString(input?.bookingCode, 80),
    address: cleanString(input?.address, 300),
    city: cleanString(input?.city, 100),
    pincode: cleanString(input?.pincode, 20),
    notes: cleanString(input?.notes, 1200),
    pageUrl: cleanString(input?.pageUrl, 500),
    customer: {
      name: cleanString(input?.customer?.name, 120),
      phone: cleanString(input?.customer?.phone, 40),
      email: cleanString(input?.customer?.email, 180),
    },
    service: {
      type: cleanString(input?.service?.type, 120),
      label: cleanString(input?.service?.label, 180),
      price: cleanString(input?.service?.price, 80),
    },
    device: {
      brand: cleanString(input?.device?.brand, 120),
      series: cleanString(input?.device?.series, 120),
      model: cleanString(input?.device?.model, 160),
    },
    schedule: {
      date: cleanString(input?.schedule?.date, 40),
      timeSlot: cleanString(input?.schedule?.timeSlot, 80),
    },
    metadata: Object.fromEntries(
      Object.entries(input?.metadata ?? {})
        .slice(0, 20)
        .map(([key, value]) => [cleanString(key, 80) || "metadata", cleanString(value, 300) || ""]),
    ),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = cleanLeadPayload(body);

    if (!payload.customer?.phone && !payload.customer?.email) {
      return NextResponse.json({ ok: false, error: "Lead phone or email is required." }, { status: 400 });
    }

    const result = await sendLeadEmail(payload);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status || 500 });
    }

    if (payload.source === "booking") {
      const confirmationResult = await sendCustomerBookingConfirmation(payload, buildBookingConfirmationAttachment(payload));
      if (!confirmationResult.ok) {
        console.error(
          "Customer booking confirmation failed",
          "error" in confirmationResult ? confirmationResult.error : "Confirmation email was skipped.",
        );
      }
      // WhatsApp confirmation to the customer (mirrors the email). Best-effort.
      await notifyCustomerBookingConfirmation(payload).catch((err) =>
        console.error("WhatsApp booking confirmation failed", err),
      );
    }

    // Internal WhatsApp alert to the team for every lead. Best-effort; never
    // blocks the response (a WhatsApp misconfig must not drop a website lead).
    await notifyTeamNewLead(payload).catch((err) =>
      console.error("WhatsApp team alert failed", err),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to process lead." },
      { status: 500 },
    );
  }
}
