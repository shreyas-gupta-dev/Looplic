import { NextResponse } from "next/server";

import { db } from "@/src/lib/db";
import { technicianApplications } from "@/src/lib/db/schema";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";
import { eq } from "drizzle-orm";

// Technician signup runs server-side with the service-role key so the account
// is created pre-confirmed. Client-side supabase.auth.signUp() depends on the
// project's confirmation email, which fails ("Error sending confirmation
// email") because no SMTP sender is configured — so no account (and no
// application row) was ever created.

function asText(value: unknown) {
  return String(value ?? "").trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    if (!hasServiceRole) {
      return NextResponse.json(
        { ok: false, error: "Technician signup is unavailable right now. Please contact Looplic support." },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = asText(body.email).toLowerCase();
    const password = String(body.password ?? "");
    const fullName = asText(body.full_name);
    const phone = asText(body.phone);
    const city = asText(body.city);
    const vehicleType = asText(body.vehicle_type);
    const experience = asText(body.experience);
    const serviceTypes = Array.isArray(body.service_types)
      ? body.service_types.map(asText).filter(Boolean)
      : [];
    const termsAccepted = body.terms_accepted === true;

    if (!isValidEmail(email) || !password || !fullName || !phone) {
      return NextResponse.json({ ok: false, error: "Add email, password, name, and phone to apply." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (serviceTypes.length === 0) {
      return NextResponse.json({ ok: false, error: "Select at least one service you can handle." }, { status: 400 });
    }
    if (!termsAccepted) {
      return NextResponse.json({ ok: false, error: "Accept the Looplic technician terms and conditions to apply." }, { status: 400 });
    }

    const existing = await db
      .select({ id: technicianApplications.id, status: technicianApplications.status })
      .from(technicianApplications)
      .where(eq(technicianApplications.email, email))
      .limit(1);
    if (existing.length > 0) {
      const status = existing[0].status;
      const message =
        status === "rejected"
          ? "An application with this email was already reviewed. Contact Looplic support to re-apply."
          : "An application with this email already exists. Admin or operator approval is required before login.";
      return NextResponse.json({ ok: false, error: message }, { status: 409 });
    }

    const admin = getAdminSupabase();
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        technician_terms_accepted: true,
        technician_terms_accepted_at: new Date().toISOString(),
      },
    });

    if (created.error) {
      const message = /already/i.test(created.error.message)
        ? "An account with this email already exists. Sign in instead, or contact Looplic support."
        : created.error.message || "Unable to create technician account.";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    const userId = created.data.user?.id ?? null;

    try {
      await db.insert(technicianApplications).values({
        userId,
        email,
        fullName,
        phone,
        city: city || null,
        vehicleType: vehicleType || null,
        experience: experience || null,
        serviceTypes,
        status: "pending",
      });
    } catch (insertError: any) {
      // Roll back the auth account so the technician can retry cleanly.
      if (userId) {
        await admin.auth.admin.deleteUser(userId).catch(() => {});
      }
      console.error("Technician application insert failed:", insertError);
      return NextResponse.json(
        { ok: false, error: "Unable to submit the application. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Technician apply error:", err);
    return NextResponse.json({ ok: false, error: "Unable to submit the application. Please try again." }, { status: 500 });
  }
}
