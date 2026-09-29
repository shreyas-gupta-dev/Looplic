import { createHmac } from "node:crypto";

import { expect, test } from "@playwright/test";

import { findAuthUserByEmail, findAuthUserByPhone, normalizeIdentifier } from "@/src/lib/auth/admin-users";
import { mintVerificationToken, verifyVerificationToken } from "@/src/lib/auth/verification-token";

/**
 * Unit tests for the auth helpers that the login/signup defect came down to.
 *
 * These run in Playwright's Node environment (no browser) because the repo has
 * no separate unit runner and adding one for four files is not worth the extra
 * toolchain.
 */

process.env.AUTH_OTP_HMAC_SECRET ??= "test-secret-for-unit-tests";

/**
 * Minimal stand-in for the Supabase admin client, paginated the same way the
 * real one is: `perPage` items per page, a short final page.
 */
function fakeAdmin(users: { id: string; email?: string; phone?: string }[]) {
  const calls: { page: number; perPage: number }[] = [];
  return {
    calls,
    client: {
      auth: {
        admin: {
          listUsers: async ({ page, perPage }: { page: number; perPage: number }) => {
            calls.push({ page, perPage });
            const start = (page - 1) * perPage;
            return { data: { users: users.slice(start, start + perPage) }, error: null };
          },
        },
      },
    } as never,
  };
}

test.describe("findAuthUserByEmail", () => {
  test("finds a user on the first page", async () => {
    const users = Array.from({ length: 10 }, (_, i) => ({ id: `id-${i}`, email: `user${i}@example.com` }));
    const { client } = fakeAdmin(users);

    const found = await findAuthUserByEmail(client, "user3@example.com");
    expect(found?.id).toBe("id-3");
  });

  test("finds a user beyond the first page — the lockout bug", async () => {
    // 450 users across 3 pages of 200. The old unpaginated listUsers() only ever
    // saw the first page, so anyone past it was treated as non-existent.
    const users = Array.from({ length: 450 }, (_, i) => ({ id: `id-${i}`, email: `user${i}@example.com` }));
    const { client, calls } = fakeAdmin(users);

    const found = await findAuthUserByEmail(client, "user430@example.com");

    expect(found?.id).toBe("id-430");
    expect(calls.map((c) => c.page)).toEqual([1, 2, 3]);
  });

  test("returns null for an unknown address without looping forever", async () => {
    const users = Array.from({ length: 450 }, (_, i) => ({ id: `id-${i}`, email: `user${i}@example.com` }));
    const { client, calls } = fakeAdmin(users);

    const found = await findAuthUserByEmail(client, "nobody@example.com");

    expect(found).toBeNull();
    // Stops at the short final page rather than paging to the hard limit.
    expect(calls.length).toBe(3);
  });

  test("is case insensitive", async () => {
    const { client } = fakeAdmin([{ id: "id-1", email: "Mixed.Case@Example.COM" }]);
    const found = await findAuthUserByEmail(client, "mixed.case@example.com");
    expect(found?.id).toBe("id-1");
  });
});

test.describe("findAuthUserByPhone", () => {
  test("matches regardless of separators", async () => {
    const { client } = fakeAdmin([{ id: "id-9", phone: "+919876543210" }]);
    const found = await findAuthUserByPhone(client, "+91 98765 43210");
    expect(found?.id).toBe("id-9");
  });
});

test.describe("normalizeIdentifier", () => {
  test("lowercases emails and strips phone separators", () => {
    expect(normalizeIdentifier("  USER@Example.com ")).toBe("user@example.com");
    expect(normalizeIdentifier("+91 98765-43210")).toBe("+919876543210");
  });
});

test.describe("verification token", () => {
  test("round-trips for the identifier it was minted for", () => {
    const token = mintVerificationToken("customer@example.com");
    const result = verifyVerificationToken(token, "customer@example.com");
    expect(result.valid).toBe(true);
  });

  test("tolerates identifier formatting differences", () => {
    const token = mintVerificationToken("+91 98765 43210");
    expect(verifyVerificationToken(token, "+919876543210").valid).toBe(true);
  });

  test("rejects a token minted for a different identifier", () => {
    const token = mintVerificationToken("attacker@example.com");
    const result = verifyVerificationToken(token, "victim@example.com");
    expect(result).toEqual({ valid: false, reason: "identifier_mismatch" });
  });

  test("rejects a tampered signature", () => {
    const token = mintVerificationToken("customer@example.com");
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    decoded.hmac = decoded.hmac.replace(/^./, (c: string) => (c === "a" ? "b" : "a"));
    const tampered = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    const result = verifyVerificationToken(tampered, "customer@example.com");
    expect(result).toEqual({ valid: false, reason: "bad_signature" });
  });

  test("rejects a token whose timestamp was tampered with", () => {
    const token = mintVerificationToken("customer@example.com");
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    // Shift back one minute: still inside the 10 minute TTL, so the freshness
    // guard passes and the signature check is what has to reject it.
    decoded.timestamp = decoded.timestamp - 60 * 1000;
    const forged = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    expect(verifyVerificationToken(forged, "customer@example.com")).toEqual({
      valid: false,
      reason: "bad_signature",
    });
  });

  test("rejects a token dated in the future", () => {
    const token = mintVerificationToken("customer@example.com");
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    decoded.timestamp = decoded.timestamp + 60 * 60 * 1000;
    const forged = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    // Caught by the negative-age guard before the signature is even compared.
    expect(verifyVerificationToken(forged, "customer@example.com")).toEqual({
      valid: false,
      reason: "expired",
    });
  });

  test("rejects an expired token", () => {
    const elevenMinutesAgo = Date.now() - 11 * 60 * 1000;
    const identifier = "customer@example.com";
    const secret = process.env.AUTH_OTP_HMAC_SECRET!;
    // Sign a genuinely old token so expiry, not the signature, is what fails.
    const hmac = createHmac("sha256", secret).update(`${identifier}:${elevenMinutesAgo}`).digest("hex");
    const expired = Buffer.from(
      JSON.stringify({ identifier, timestamp: elevenMinutesAgo, hmac }),
    ).toString("base64url");

    expect(verifyVerificationToken(expired, identifier)).toEqual({ valid: false, reason: "expired" });
  });

  test("rejects garbage", () => {
    expect(verifyVerificationToken("not-a-token", "customer@example.com").valid).toBe(false);
  });
});
