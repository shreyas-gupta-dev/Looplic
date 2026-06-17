import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import * as schema from "@/src/lib/db/schema";
import { and, eq } from "drizzle-orm";

// Public endpoint — no auth required. Only exposes whether a given Supabase
// user UUID holds a specific role (no PII, UUID space is not guessable).
export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ hasRole: false });
    }

    const rows = await db
      .select({ id: schema.userRoles.id })
      .from(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, String(userId)),
          eq(schema.userRoles.role, role as "admin" | "operation" | "technician" | "user")
        )
      );

    return NextResponse.json({ hasRole: rows.length > 0 });
  } catch (err: any) {
    console.error("[check-role]", err?.message);
    return NextResponse.json({ hasRole: false }, { status: 500 });
  }
}
