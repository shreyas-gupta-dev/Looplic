import { NextResponse } from "next/server";
import { findAuthUserByEmail, isPhoneIdentifier, normalizeIdentifier } from "@/src/lib/auth/admin-users";
import { db } from "@/src/lib/db";
import { customerProfiles } from "@/src/lib/db/schema";
import { ilike, or } from "drizzle-orm";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ exists: false });
    }

    const trimmed = identifier.trim();
    const isPhone = isPhoneIdentifier(trimmed) || /^\d{10,12}$/.test(trimmed.replace(/[\s+-]/g, ""));

    if (isPhone) {
      const digits = trimmed.replace(/[^0-9]/g, "").slice(-10);
      try {
        const rows = await db
          .select({ fullName: customerProfiles.fullName })
          .from(customerProfiles)
          .where(
            or(
              ilike(customerProfiles.phone, `%${digits}%`),
              ilike(customerProfiles.phone, `%${digits}`)
            )
          )
          .limit(1);

        if (rows.length > 0) {
          return NextResponse.json({
            exists: true,
            isPhone: true,
            name: rows[0].fullName || null,
          });
        }
      } catch (err) {
        console.warn("[check-account] Error searching phone:", err);
      }

      return NextResponse.json({ exists: false, isPhone: true });
    }

    if (!hasServiceRole) {
      return NextResponse.json({ exists: false });
    }

    const admin = getAdminSupabase();
    const normalizedEmail = normalizeIdentifier(trimmed);
    const existingUser = await findAuthUserByEmail(admin, normalizedEmail);

    const providers = existingUser?.app_metadata?.providers ?? (existingUser?.app_metadata?.provider ? [existingUser.app_metadata.provider] : []);

    return NextResponse.json({
      exists: Boolean(existingUser),
      isPhone: false,
      email: normalizedEmail,
      providers,
      name: existingUser?.user_metadata?.full_name || existingUser?.user_metadata?.name || null,
    });
  } catch (err: unknown) {
    return NextResponse.json({ exists: false });
  }
}
