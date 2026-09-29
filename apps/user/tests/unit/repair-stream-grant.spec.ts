import { createHmac } from "node:crypto";

import { expect, test } from "@playwright/test";

import { mintGrant, verifyGrant } from "@/src/lib/repair-stream/grant";
import {
  DEFAULT_SESSION_MINUTES,
  MAX_SESSION_MINUTES,
  REPAIR_STAGES,
  REPAIR_STAGE_LABELS,
  isRepairStage,
  isStreamProvider,
} from "@looplic/db/repair-stream";

/**
 * Unit tests for the playback grant.
 *
 * A grant is the only thing standing between a request and video of someone's
 * device being repaired, so its failure modes are worth pinning down exactly.
 */

process.env.REPAIR_STREAM_GRANT_SECRET ??= "test-grant-secret-for-unit-tests";

const SESSION_A = "11111111-1111-1111-1111-111111111111";
const SESSION_B = "22222222-2222-2222-2222-222222222222";
const BOOKING_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const BOOKING_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

test.describe("grant round-trip", () => {
  test("a freshly minted grant verifies", () => {
    const grant = mintGrant(SESSION_A, BOOKING_A);
    const result = verifyGrant(grant);

    expect(result.valid).toBe(true);
    expect(result.sessionId).toBe(SESSION_A);
    expect(result.bookingId).toBe(BOOKING_A);
  });

  test("verifies against the session it was minted for", () => {
    const grant = mintGrant(SESSION_A, BOOKING_A);
    expect(verifyGrant(grant, SESSION_A).valid).toBe(true);
  });
});

test.describe("grant cannot be replayed elsewhere", () => {
  test("a grant for one session is rejected for another", () => {
    const grant = mintGrant(SESSION_A, BOOKING_A);
    const result = verifyGrant(grant, SESSION_B);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("session_mismatch");
  });

  test("swapping the booking id invalidates the signature", () => {
    const grant = mintGrant(SESSION_A, BOOKING_A);
    const decoded = JSON.parse(Buffer.from(grant, "base64url").toString("utf8"));
    decoded.bookingId = BOOKING_B;
    const forged = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    const result = verifyGrant(forged);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("bad_signature");
  });

  test("swapping the session id invalidates the signature", () => {
    const grant = mintGrant(SESSION_A, BOOKING_A);
    const decoded = JSON.parse(Buffer.from(grant, "base64url").toString("utf8"));
    decoded.sessionId = SESSION_B;
    const forged = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    expect(verifyGrant(forged).valid).toBe(false);
  });
});

test.describe("grant expiry", () => {
  test("an old grant is rejected", () => {
    // Sign a genuinely old grant so expiry, not the signature, is what fails.
    const issuedAt = Date.now() - 3 * 60 * 1000; // grant TTL is 2 minutes
    const secret = process.env.REPAIR_STREAM_GRANT_SECRET!;
    const hmac = createHmac("sha256", secret)
      .update(`${SESSION_A}:${BOOKING_A}:${issuedAt}`)
      .digest("hex");
    const stale = Buffer.from(
      JSON.stringify({ sessionId: SESSION_A, bookingId: BOOKING_A, issuedAt, hmac }),
    ).toString("base64url");

    const result = verifyGrant(stale);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("expired");
  });

  test("a grant dated in the future is rejected", () => {
    const grant = mintGrant(SESSION_A, BOOKING_A);
    const decoded = JSON.parse(Buffer.from(grant, "base64url").toString("utf8"));
    decoded.issuedAt = Date.now() + 60 * 60 * 1000;
    const forged = Buffer.from(JSON.stringify(decoded)).toString("base64url");

    expect(verifyGrant(forged).valid).toBe(false);
  });
});

test.describe("grant rejects malformed input", () => {
  test("garbage is rejected, not thrown on", () => {
    for (const junk of ["", "not-a-token", "e30", "!!!!"]) {
      const result = verifyGrant(junk);
      expect(result.valid, `input: ${junk}`).toBe(false);
    }
  });

  test("a token missing fields is rejected", () => {
    const partial = Buffer.from(JSON.stringify({ sessionId: SESSION_A })).toString("base64url");
    expect(verifyGrant(partial)).toEqual({ valid: false, reason: "malformed" });
  });

  test("an unsigned token is rejected", () => {
    const unsigned = Buffer.from(
      JSON.stringify({ sessionId: SESSION_A, bookingId: BOOKING_A, issuedAt: Date.now() }),
    ).toString("base64url");
    expect(verifyGrant(unsigned).valid).toBe(false);
  });
});

test.describe("session and stage vocabulary", () => {
  test("only the two known providers are accepted", () => {
    expect(isStreamProvider("stage-media")).toBe(true);
    expect(isStreamProvider("hls")).toBe(true);
    expect(isStreamProvider("rtsp")).toBe(false);
    expect(isStreamProvider("")).toBe(false);
    expect(isStreamProvider(null)).toBe(false);
  });

  test("only the known repair stages are accepted", () => {
    for (const stage of REPAIR_STAGES) expect(isRepairStage(stage)).toBe(true);
    expect(isRepairStage("whatever")).toBe(false);
    expect(isRepairStage(undefined)).toBe(false);
  });

  test("every stage has a customer-readable label", () => {
    for (const stage of REPAIR_STAGES) {
      expect(REPAIR_STAGE_LABELS[stage]?.trim().length, stage).toBeGreaterThan(0);
    }
  });

  test("session length is bounded", () => {
    // A typo must not be able to open a session for a year.
    expect(DEFAULT_SESSION_MINUTES).toBeLessThanOrEqual(MAX_SESSION_MINUTES);
    expect(MAX_SESSION_MINUTES).toBeLessThanOrEqual(24 * 60);
  });
});
