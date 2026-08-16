import { NextResponse } from "next/server";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

/**
 * POST /api/auth/confirm-user
 * Confirms an unverified user's email so they can sign in.
 * Called when signInWithPassword fails due to unconfirmed email.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!hasServiceRole) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const admin = getAdminSupabase();

    // Find the user by email
    const { data: users, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const user = users.users.find(
      (u: any) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Confirm the user's email
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, confirmed: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to confirm user" }, { status: 500 });
  }
}
