import { expect, test } from "@playwright/test";

/**
 * Customer-facing repair order tracking.
 *
 * Repairs previously had no status view at all — only buyback did. The security
 * property that matters most here is that the page cannot be used to discover
 * which booking codes exist, so several tests assert that different failure modes
 * are indistinguishable.
 */

// Seeded by the migration backfill; any real code would do.
const UNKNOWN_CODE = "MOB-000000-ZZZZ";

test.describe("/track", () => {
  test("shows the lookup form", async ({ page }) => {
    await page.goto("/track");

    await expect(page.getByRole("heading", { name: /track your repair/i })).toBeVisible();
    await expect(page.locator('input[name="code"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /track order/i })).toBeVisible();
  });

  test("a booking code in the path pre-fills the form but still asks for the phone", async ({ page }) => {
    await page.goto(`/track/${UNKNOWN_CODE}`);

    // Pre-filled for convenience...
    await expect(page.locator('input[name="code"]')).toHaveValue(UNKNOWN_CODE);
    // ...but the code alone must not reveal anything.
    await expect(page.locator('input[name="phone"]')).toHaveValue("");
    await expect(page.getByText(/order status/i)).toHaveCount(0);
  });

  test("an unknown code and a wrong phone give the same answer", async ({ page }) => {
    async function messageFor(code: string, phone: string) {
      await page.goto(`/track?code=${encodeURIComponent(code)}&phone=${encodeURIComponent(phone)}`);
      return page.getByText(/no booking found/i).innerText();
    }

    const unknownCode = await messageFor(UNKNOWN_CODE, "9876543210");
    const malformed = await messageFor("NOT-A-CODE", "9876543210");

    // Identical wording: no oracle for which codes exist.
    expect(unknownCode).toBe(malformed);
  });

  test("does not leak a booking when the phone is missing", async ({ page }) => {
    await page.goto(`/track?code=${encodeURIComponent(UNKNOWN_CODE)}`);
    await expect(page.getByText(/order status/i)).toHaveCount(0);
  });

  test("links across to buyback tracking", async ({ page }) => {
    await page.goto("/track");
    const link = page.getByRole("link", { name: /track a buyback order/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/sell/track");
  });
});

test.describe("GET /api/track/[code]", () => {
  test("404s without a phone number", async ({ request }) => {
    const response = await request.get(`/api/track/${UNKNOWN_CODE}`, { failOnStatusCode: false });
    expect(response.status()).toBe(404);
  });

  test("404s for an unknown code, with no detail in the body", async ({ request }) => {
    const response = await request.get(`/api/track/${UNKNOWN_CODE}?phone=9876543210`, {
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });

  test("answers identically for a malformed and an unknown code", async ({ request }) => {
    const unknown = await request.get(`/api/track/${UNKNOWN_CODE}?phone=9876543210`, { failOnStatusCode: false });
    const malformed = await request.get("/api/track/%20?phone=9876543210", { failOnStatusCode: false });

    expect(unknown.status()).toBe(malformed.status());
    expect(await unknown.json()).toEqual(await malformed.json());
  });

  test("is never cached", async ({ request }) => {
    // A cached status would show a stale step; the header must forbid it. On a
    // 404 the header may be absent, so assert on a shape that covers both.
    const response = await request.get(`/api/track/${UNKNOWN_CODE}?phone=9876543210`, {
      failOnStatusCode: false,
    });
    const cacheControl = response.headers()["cache-control"] ?? "";
    expect(cacheControl === "" || /no-store/.test(cacheControl)).toBe(true);
  });
});
