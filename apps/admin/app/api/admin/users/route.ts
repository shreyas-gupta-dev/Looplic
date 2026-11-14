import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getServerSession } from "@/src/lib/auth/cognito-server";
import { db } from "@/src/lib/db";
import * as schema from "@/src/lib/db/schema";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

async function verifyAdminAuth() {
  const session = await getServerSession();
  if (!session.user) {
    return { error: "Authentication required", status: 401 };
  }

  const roleRows = await db
    .select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .where(and(eq(schema.userRoles.userId, session.user.id), eq(schema.userRoles.role, "admin")));

  if (roleRows.length === 0) {
    return { error: "Admin role required", status: 403 };
  }

  return { currentUserId: session.user.id };
}

/**
 * GET /api/admin/users
 * Lists all registered accounts joined with their roles and customer profiles.
 */
export async function GET() {
  const auth = await verifyAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!hasServiceRole) {
    return NextResponse.json({ error: "Server service role not configured" }, { status: 500 });
  }

  try {
    const admin = getAdminSupabase();

    // 1. Fetch all Supabase auth users (paginated up to 1,000)
    let allAuthUsers: any[] = [];
    let page = 1;
    while (page <= 5) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) {
        console.error("[admin:users] listUsers error:", error.message);
        break;
      }
      if (!data?.users || data.users.length === 0) break;
      allAuthUsers = allAuthUsers.concat(data.users);
      if (data.users.length < 200) break;
      page++;
    }

    // 2. Fetch all roles and customer profiles from RDS PostgreSQL
    const [roles, profiles] = await Promise.all([
      db.select().from(schema.userRoles),
      db.select().from(schema.customerProfiles),
    ]);

    const roleMap = new Map<string, string>();
    roles.forEach((r) => roleMap.set(r.userId, r.role));

    const profileMap = new Map<string, typeof schema.customerProfiles.$inferSelect>();
    profiles.forEach((p) => profileMap.set(p.userId, p));

    // 3. Merge into unified user list
    const users = allAuthUsers.map((u) => {
      const profile = profileMap.get(u.id);
      const assignedRole = roleMap.get(u.id) || "user";
      const metadata = (u.user_metadata as Record<string, any>) || {};

      return {
        id: u.id,
        email: u.email || "",
        phone: u.phone || profile?.phone || "",
        fullName: profile?.fullName || metadata.full_name || metadata.name || "",
        role: assignedRole,
        emailConfirmed: Boolean(u.email_confirmed_at),
        lastSignInAt: u.last_sign_in_at || null,
        createdAt: u.created_at || null,
        address: profile?.address || "",
        city: profile?.city || "",
      };
    });

    return NextResponse.json({ success: true, users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load users";
    console.error("[admin:users] GET threw:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Creates a new user/staff account with specified role.
 */
export async function POST(request: Request) {
  const auth = await verifyAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!hasServiceRole) {
    return NextResponse.json({ error: "Server service role not configured" }, { status: 500 });
  }

  try {
    const { email, password, fullName, phone, role } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const admin = getAdminSupabase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (fullName || "").trim();
    const cleanPhone = (phone || "").trim();
    const targetRole = (role || "user").trim();

    // 1. Create Supabase auth user
    const { data, error } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: password.trim(),
      email_confirm: true,
      user_metadata: { full_name: cleanName },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user.id;

    // 2. Insert customer profile
    try {
      await db
        .insert(schema.customerProfiles)
        .values({
          userId,
          fullName: cleanName || null,
          phone: cleanPhone || null,
        })
        .onConflictDoUpdate({
          target: schema.customerProfiles.userId,
          set: {
            fullName: cleanName || null,
            phone: cleanPhone || null,
            updatedAt: new Date(),
          },
        });
    } catch (dbErr) {
      console.warn("[admin:users] Profile insert error:", dbErr);
    }

    // 3. Set staff role if not 'user'
    if (targetRole && targetRole !== "user") {
      try {
        await db.insert(schema.userRoles).values({
          userId,
          role: targetRole as any,
        });
      } catch (roleErr) {
        console.warn("[admin:users] Role insert error:", roleErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      userId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Updates a user's assigned role or profile information.
 */
export async function PATCH(request: Request) {
  const auth = await verifyAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { userId, role, fullName, phone } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 1. Update role
    if (role !== undefined) {
      const validRoles = ["admin", "operation", "technician", "user"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
      }

      // Remove existing role assignments for this user
      await db.delete(schema.userRoles).where(eq(schema.userRoles.userId, userId));

      // If assigning a staff role, insert new row
      if (role !== "user") {
        await db.insert(schema.userRoles).values({
          userId,
          role: role as any,
        });
      }
    }

    // 2. Update profile details if provided
    if (fullName !== undefined || phone !== undefined) {
      const cleanName = fullName ? String(fullName).trim() : null;
      const cleanPhone = phone ? String(phone).trim() : null;

      await db
        .insert(schema.customerProfiles)
        .values({
          userId,
          fullName: cleanName,
          phone: cleanPhone,
        })
        .onConflictDoUpdate({
          target: schema.customerProfiles.userId,
          set: {
            ...(fullName !== undefined ? { fullName: cleanName } : {}),
            ...(phone !== undefined ? { phone: cleanPhone } : {}),
            updatedAt: new Date(),
          },
        });

      if (cleanName && hasServiceRole) {
        try {
          const admin = getAdminSupabase();
          await admin.auth.admin.updateUserById(userId, {
            user_metadata: { full_name: cleanName },
          });
        } catch {
          // ignore metadata sync error
        }
      }
    }

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/users
 * Resets/changes password for a user.
 */
export async function PUT(request: Request) {
  const auth = await verifyAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!hasServiceRole) {
    return NextResponse.json({ error: "Server service role not configured" }, { status: 500 });
  }

  try {
    const { userId, newPassword } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const admin = getAdminSupabase();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword.trim(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reset password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users
 * Deletes user account and associated role records.
 */
export async function DELETE(request: Request) {
  const auth = await verifyAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!hasServiceRole) {
    return NextResponse.json({ error: "Server service role not configured" }, { status: 500 });
  }

  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (userId === auth.currentUserId) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    const admin = getAdminSupabase();
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Clean up role and profile in RDS
    await Promise.all([
      db.delete(schema.userRoles).where(eq(schema.userRoles.userId, userId)),
      db.delete(schema.customerProfiles).where(eq(schema.customerProfiles.userId, userId)),
    ]);

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
