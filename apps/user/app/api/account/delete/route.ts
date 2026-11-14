import { NextResponse } from "next/server";

import { guardRateLimit } from "@/src/lib/rate-limit";
import { getAdminSupabase, getServerSupabase, hasServiceRole } from "@/src/lib/supabase/server";

/**
 * POST /api/account/delete
 *
 * Secure server-side endpoint for user-initiated account and personal data deletion.
 *
 * Complies with Google Play User Data & Account Deletion Policy.
 * Uses SUPABASE_SERVICE_ROLE_KEY strictly on the server; never exposed to client.
 */
export async function POST(request: Request) {
  // Rate limit: 5 deletion requests per 15 minutes per IP
  const limited = await guardRateLimit(request, "account:delete", 5, 15 * 60);
  if (limited) return limited;

  if (!hasServiceRole) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to delete account. Please sign in or contact support." },
        { status: 401 },
      );
    }

    const userId = user.id;
    const userEmail = user.email;
    const admin = getAdminSupabase();

    // 1. Delete customer profile
    await admin.from("customer_profiles").delete().eq("user_id", userId);

    // 2. Delete cart items
    await admin.from("cart_items").delete().eq("user_id", userId);

    // 3. Delete user roles
    await admin.from("user_roles").delete().eq("user_id", userId);

    // 4. Delete temporary OTP entries
    if (userEmail) {
      await admin.from("auth_email_otps").delete().eq("email", userEmail);
    }

    // 5. Anonymize PII in past orders (preserving invoice and tax records for GST statutory audit compliance)
    await admin
      .from("bookings")
      .update({
        customer_name: "Deleted Account",
        customer_phone: "XXXXXXXXXX",
        location: "Redacted upon account deletion",
        user_id: null,
      } as never)
      .eq("user_id", userId);

    await admin
      .from("buyback_bookings")
      .update({
        customer_name: "Deleted Account",
        phone: "XXXXXXXXXX",
        address: "Redacted upon account deletion",
        user_id: null,
      } as never)
      .eq("user_id", userId);

    await admin
      .from("buy_orders")
      .update({
        shipping_address: "Redacted upon account deletion",
        shipping_city: "Redacted",
        shipping_pincode: "000000",
        user_id: "deleted_user",
      } as never)
      .eq("user_id", userId);

    // 6. Delete the auth user from Supabase Auth
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error("[Account Deletion] Failed to delete Supabase auth user:", deleteUserError);
      return NextResponse.json(
        { error: "Failed to complete account deletion. Please contact support." },
        { status: 500 },
      );
    }

    // 7. Sign out the user session
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Your account and associated personal data have been permanently deleted.",
    });
  } catch (err) {
    console.error("[Account Deletion] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during account deletion." },
      { status: 500 },
    );
  }
}

