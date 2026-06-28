import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import * as schema from "@/src/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

// Public endpoint — no session cookie required.
// Accepts an optional Authorization: Bearer <access_token> header.
// When the token is present and the service-role key is configured, the user
// identity is verified server-side from the JWT (most robust path). Otherwise
// falls back to the caller-supplied userId.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role } = body;
    let userId: string | undefined = body.userId ? String(body.userId) : undefined;

    if (!role) {
      return NextResponse.json({ hasRole: false });
    }

    // Prefer server-verified identity from the JWT over caller-supplied userId.
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ") && hasServiceRole) {
      const token = authHeader.slice(7);
      try {
        const admin = getAdminSupabase();
        const { data } = await admin.auth.getUser(token);
        if (data.user?.id) {
          userId = data.user.id;
        }
      } catch {
        // fall through to caller-supplied userId
      }
    }

    if (!userId) {
      return NextResponse.json({ hasRole: false });
    }

    const rows = await db
      .select({ id: schema.userRoles.id })
      .from(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, userId),
          eq(schema.userRoles.role, role as "admin" | "operation" | "technician" | "user")
        )
      );

    return NextResponse.json({ hasRole: rows.length > 0 });
  } catch (err: any) {
    console.error("[check-role]", err?.message);
    return NextResponse.json({ hasRole: false }, { status: 500 });
  }
}
