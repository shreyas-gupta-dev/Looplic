import type { SupabaseClient } from "@supabase/supabase-js";

// Server-side only. The `server-only` package cannot be used here because it
// throws outside Next.js's react-server condition, which would make these
// helpers untestable; this guard gives the same protection and still runs.
if (typeof window !== "undefined") {
  throw new Error("admin-users.ts is server-only and must not be imported by client code");
}

/**
 * Paginated Supabase auth user lookup.
 *
 * `admin.auth.admin.listUsers()` returns only the FIRST page (50 users by
 * default). Calling it without pagination silently fails to find every user
 * created after the first page, which produced two real defects:
 *
 *   - /api/auth/signup treated an existing passwordless user as new, called
 *     createUser, got "already been registered" and told the customer to sign in
 *     with a password they had never set — a permanent lockout.
 *   - /api/auth/confirm-user reported "User not found" for anyone past page 1.
 *
 * Always go through these helpers instead of calling listUsers directly.
 */

const PER_PAGE = 200;
const MAX_PAGES = 100; // 20k users; a hard stop so a bug can never loop forever.

export type AuthUserLike = {
  id: string;
  email?: string | null;
  phone?: string | null;
};

/**
 * Walks every page of the auth user list and returns the first user matching
 * `predicate`, or null.
 */
export async function findAuthUser(
  admin: SupabaseClient,
  predicate: (user: AuthUserLike) => boolean,
): Promise<AuthUserLike | null> {
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw error;

    const users = (data?.users ?? []) as AuthUserLike[];
    const match = users.find(predicate);
    if (match) return match;

    // A short page means we have reached the end of the list.
    if (users.length < PER_PAGE) return null;
  }
  return null;
}

export function findAuthUserByEmail(admin: SupabaseClient, email: string): Promise<AuthUserLike | null> {
  const normalized = email.trim().toLowerCase();
  return findAuthUser(admin, (user) => user.email?.toLowerCase() === normalized);
}

export function findAuthUserByPhone(admin: SupabaseClient, phone: string): Promise<AuthUserLike | null> {
  const normalized = normalizePhone(phone);
  return findAuthUser(admin, (user) => normalizePhone(user.phone ?? "") === normalized);
}

/**
 * Looks up by whichever identifier type was supplied. `+` prefix means phone,
 * matching the convention used across the auth routes.
 */
export function findAuthUserByIdentifier(admin: SupabaseClient, identifier: string): Promise<AuthUserLike | null> {
  return isPhoneIdentifier(identifier)
    ? findAuthUserByPhone(admin, identifier)
    : findAuthUserByEmail(admin, identifier);
}

export function isPhoneIdentifier(identifier: string): boolean {
  return identifier.trim().startsWith("+");
}

/**
 * Normalizes an identifier the same way everywhere: phones keep only digits (so
 * "+91 98765 43210" and "+919876543210" compare equal), emails are lowercased.
 */
export function normalizeIdentifier(identifier: string): string {
  return isPhoneIdentifier(identifier) ? `+${normalizePhone(identifier)}` : identifier.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}
