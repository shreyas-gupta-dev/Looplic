import { NextResponse } from "next/server";

import { sendCustomerBookingConfirmation, sendLeadEmail } from "@/src/lib/email/resend";
import type { LeadPayload } from "@/src/lib/leads/types";

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
      const confirmationResult = await sendCustomerBookingConfirmation(payload);
      if (!confirmationResult.ok) {
        console.error(
          "Customer booking confirmation failed",
          "error" in confirmationResult ? confirmationResult.error : "Confirmation email was skipped.",
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to process lead." },
      { status: 500 },
    );
  }
}
