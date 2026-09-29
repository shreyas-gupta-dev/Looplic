import { test } from "@playwright/test";

/**
 * Not an assertion — a visual capture so the illustration set can be eyeballed.
 * Run: npx playwright test tests/manual/capture-homepage.spec.ts
 */
test("capture the service and sell grids", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(1500);

  const services = page.locator("section", { has: page.getByRole("heading", { name: "Our Services" }) });
  await services.scrollIntoViewIfNeeded();
  await services.screenshot({ path: "test-results/visual-our-services.png" });

  const sell = page.locator("section", { has: page.getByRole("heading", { name: /Sell Your Old Device Now/i }) });
  await sell.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await sell.screenshot({ path: "test-results/visual-sell-categories.png" });
});
