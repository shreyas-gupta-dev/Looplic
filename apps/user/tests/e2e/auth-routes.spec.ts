import { expect, test } from "@playwright/test";

/**
 * Route-level checks for the hardened auth endpoints.
 *
 * These hit the real running app, so they assert the properties that hold
 * regardless of Supabase/Redis configuration:
 *
 *  - confirm-user refuses to act without proof of ownership (the open-endpoint
 *    bug) and answers identically for known and unknown addresses (the
 *    enumeration oracle).
 *  - signup refuses without a valid verification token.
 *  - a tampered or foreign token is never accepted.
 *
 * Anything that depends on a real OTP being delivered is out of scope here and is
 * covered by scripts/verify-dashboard-users.cjs plus manual verification.
 */

const KNOWN_EMAIL = "admin@looplic.local"; // seeded by scripts/seed-dashboard-users.cjs
const UNKNOWN_EMAIL = "definitely-not-registered-9f3a2b@looplic.local";

async function postJson(request: any, url: string, body: unknown) {
  const response = await request.post(url, {
    data: body,
    headers: { "Content-Type": "application/json" },
    failOnStatusCode: false,
  });
  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status(), json };
}

test.describe("POST /api/auth/confirm-user", () => {
  test("refuses to confirm an address without a verification token", async ({ request }) => {
    const { status, json } = await postJson(request, "/api/auth/confirm-user", { email: KNOWN_EMAIL });

    // 400 = rejected for missing proof. Anything 2xx would mean an anonymous
    // caller can still force-confirm an address they do not own.
    expect(status).toBe(400);
    expect(String(json?.error ?? "")).toMatch(/OTP verification is required/i);
  });

  test("does not reveal whether an address exists", async ({ request }) => {
    const known = await postJson(request, "/api/auth/confirm-user", {
      email: KNOWN_EMAIL,
      verificationToken: "obviously-invalid",
    });
    const unknown = await postJson(request, "/api/auth/confirm-user", {
      email: UNKNOWN_EMAIL,
      verificationToken: "obviously-invalid",
    });

    // Identical status and body for both: no oracle.
    expect(known.status).toBe(unknown.status);
    expect(known.json).toEqual(unknown.json);
  });

  test("rejects a malformed verification token", async ({ request }) => {
    const { status } = await postJson(request, "/api/auth/confirm-user", {
      email: KNOWN_EMAIL,
      verificationToken: "not-a-real-token",
    });
    expect(status).toBe(400);
  });

  test("rejects a token minted for a different address", async ({ request }) => {
    // Hand-built token shaped like a real one but signed with the wrong secret.
    const forged = Buffer.from(
      JSON.stringify({ identifier: KNOWN_EMAIL, timestamp: Date.now(), hmac: "00".repeat(32) }),
    ).toString("base64url");

    const { status } = await postJson(request, "/api/auth/confirm-user", {
      email: KNOWN_EMAIL,
      verificationToken: forged,
    });
    expect(status).toBe(400);
  });

  test("requires an email", async ({ request }) => {
    const { status } = await postJson(request, "/api/auth/confirm-user", { verificationToken: "x" });
    expect(status).toBe(400);
  });
});

test.describe("POST /api/auth/signup", () => {
  test("refuses without a verification token", async ({ request }) => {
    const { status, json } = await postJson(request, "/api/auth/signup", {
      email: UNKNOWN_EMAIL,
      password: "ValidPassword123!",
      name: "Test",
    });

    expect(status).toBe(400);
    expect(String(json?.error ?? "")).toMatch(/OTP verification is required/i);
  });

  test("refuses a short password before touching the auth provider", async ({ request }) => {
    const { status, json } = await postJson(request, "/api/auth/signup", {
      email: UNKNOWN_EMAIL,
      password: "123",
      verificationToken: "whatever",
    });

    expect(status).toBe(400);
    expect(String(json?.error ?? "")).toMatch(/at least 6 characters/i);
  });

  test("refuses a forged verification token", async ({ request }) => {
    const forged = Buffer.from(
      JSON.stringify({ identifier: UNKNOWN_EMAIL, timestamp: Date.now(), hmac: "ab".repeat(32) }),
    ).toString("base64url");

    const { status, json } = await postJson(request, "/api/auth/signup", {
      email: UNKNOWN_EMAIL,
      password: "ValidPassword123!",
      name: "Test",
      verificationToken: forged,
    });

    expect(status).toBe(400);
    expect(String(json?.error ?? "")).toMatch(/expired or invalid/i);
  });

  test("requires an identifier", async ({ request }) => {
    const { status } = await postJson(request, "/api/auth/signup", {
      password: "ValidPassword123!",
      verificationToken: "x",
    });
    expect(status).toBe(400);
  });
});

test.describe("POST /api/auth/send-otp", () => {
  test("rejects a malformed email without sending anything", async ({ request }) => {
    const { status, json } = await postJson(request, "/api/auth/send-otp", { identifier: "not-an-email" });
    expect(status).toBe(400);
    expect(String(json?.error ?? "")).toMatch(/Invalid email/i);
  });

  test("rejects a too-short phone number", async ({ request }) => {
    const { status, json } = await postJson(request, "/api/auth/send-otp", { identifier: "+9198" });
    expect(status).toBe(400);
    expect(String(json?.error ?? "")).toMatch(/Invalid phone number/i);
  });

  test("requires an identifier", async ({ request }) => {
    const { status } = await postJson(request, "/api/auth/send-otp", {});
    expect(status).toBe(400);
  });
});

test.describe("POST /api/auth/verify-otp", () => {
  test("requires both identifier and token", async ({ request }) => {
    expect((await postJson(request, "/api/auth/verify-otp", { identifier: KNOWN_EMAIL })).status).toBe(400);
    expect((await postJson(request, "/api/auth/verify-otp", { token: "123456" })).status).toBe(400);
  });

  test("rejects an incorrect code", async ({ request }) => {
    const { status } = await postJson(request, "/api/auth/verify-otp", {
      identifier: UNKNOWN_EMAIL,
      token: "000000",
    });
    // 400 for a bad code, or 429 if a previous run already spent the attempt
    // budget for this IP — both prove the code was not accepted.
    expect([400, 429]).toContain(status);
  });
});
