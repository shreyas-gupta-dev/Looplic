import { NextResponse } from "next/server";
import { z } from "zod";
import { db, bookings, bookingStatusEvents } from "@/src/lib/db";
import { enforceRateLimit } from "@/src/lib/rate-limit";
import { savePreviewBooking } from "@/src/lib/data/preview-recovery-store";

export const dynamic = "force-dynamic";

const bookingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().refine((val) => val.replace(/\D/g, "").length >= 10, {
    message: "Phone number must contain at least 10 digits",
  }),
  email: z.string().trim().email("Invalid email address"),
  city: z.string().trim().min(2, "City is required").default("Bengaluru"),
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits").optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  deviceType: z.string().trim().min(1, "Storage device type is required"),
  deviceModel: z.string().trim().optional().or(z.literal("")),
  failureType: z.string().trim().min(1, "Failure issue is required"),
  priority: z.enum(["standard", "priority", "emergency"]).default("standard"),
  details: z.string().trim().optional().or(z.literal("")),
  isBusinessOnsite: z.boolean().optional().default(false),
  companyName: z.string().trim().optional().or(z.literal("")),
  designation: z.string().trim().optional().or(z.literal("")),
  gstin: z.string().trim().optional().or(z.literal("")),
  ndaRequired: z.boolean().optional().default(false),
  website: z.string().optional().or(z.literal("")), // Honeypot field
});

function generateRecoveryCode(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomSuffix = "";
  for (let i = 0; i < 6; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REC-${dateStr}-${randomSuffix}`;
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check
    const rateLimit = await enforceRateLimit(request, "data-recovery-book", 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes before submitting again." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate JSON
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid submission data";
      return NextResponse.json({ error: firstError, details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    // 3. Honeypot check (anti-bot)
    if (data.website && data.website.trim().length > 0) {
      // Fake success for bots to prevent them adapting
      return NextResponse.json({
        success: true,
        bookingCode: "REC-261114-BOTDEF",
        message: "Request received",
      });
    }

    // 4. Construct Booking Code & Metadata
    const bookingCode = generateRecoveryCode();
    const locationParts = [data.address, data.city].filter(Boolean);
    const locationString = locationParts.join(", ");
    const cleanPhone = data.phone.replace(/\D/g, "").slice(-10);

    const notesSummary = `[Data Recovery] Device: ${data.deviceType} | Model: ${data.deviceModel || "N/A"} | Issue: ${data.failureType} | Priority: ${data.priority.toUpperCase()}${data.isBusinessOnsite ? ` | Corporate: ${data.companyName} (${data.designation})` : ""}${data.details ? ` | Notes: ${data.details}` : ""}`;

    const newBookingId = crypto.randomUUID();

    // 5. Insert into bookings table (with timeout guard for local offline environments)
    try {
      const insertPromise = db
        .insert(bookings)
        .values({
          id: newBookingId,
          customerName: data.name,
          customerPhone: cleanPhone,
          serviceType: "data_recovery",
          status: "pending",
          bookingCode,
          location: locationString,
          pincode: data.pincode || null,
          notes: notesSummary,
          orderSource: data.isBusinessOnsite ? "data_recovery_corporate" : "data_recovery_portal",
        })
        .returning({ id: bookings.id, bookingCode: bookings.bookingCode });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB_TIMEOUT")), 2500)
      );

      const [insertedBooking] = (await Promise.race([insertPromise, timeoutPromise])) as any;

      // Insert initial status event
      const initialNote = data.isBusinessOnsite
        ? `On-site recovery request registered for ${data.companyName || "business client"}. Priority: ${data.priority.toUpperCase()}.`
        : `Recovery case created for ${data.deviceType}. Awaiting initial evaluation / pickup dispatch.`;

      await db
        .insert(bookingStatusEvents)
        .values({
          bookingId: insertedBooking.id,
          status: "pending",
          previousStatus: null,
          note: initialNote,
          actorRole: "customer",
        })
        .catch(() => {});
    } catch (dbError) {
      // In local preview/offline environments where RDS is unreachable, record in preview store
      savePreviewBooking({
        id: newBookingId,
        bookingCode,
        customerName: data.name,
        customerPhone: cleanPhone,
        serviceType: "data_recovery",
        status: "pending",
        location: locationString,
        notes: notesSummary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: data.priority,
        deviceType: data.deviceType,
        failureType: data.failureType,
      });
    }

    return NextResponse.json({
      success: true,
      bookingCode,
      bookingId: newBookingId,
      priority: data.priority,
      message: "Recovery case registered successfully.",
    });
  } catch (error: any) {
    console.error("Error creating data recovery booking:", error);
    return NextResponse.json(
      { error: "We were unable to process your recovery request. Please contact our lab directly." },
      { status: 500 }
    );
  }
}
