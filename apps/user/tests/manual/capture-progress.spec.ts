import { test } from "@playwright/test";

/**
 * TEMPORARY — progress capture against the running dev server on :3000.
 * Delete after review. Run:
 *   npx playwright test tests/manual/capture-progress.spec.ts --reporter=line
 */
const BASE = "http://localhost:3000";
const OUT = "test-results/progress";

test.use({ baseURL: BASE });

test("capture every surface the task document asked about", async ({ page }) => {
  test.setTimeout(180_000);

  // ── Item 2: services grid ───────────────────────────────────────────────────
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  const services = page.locator("section", { has: page.getByRole("heading", { name: "Our Services" }) });
  await services.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await services.screenshot({ path: `${OUT}/01-services-grid.png` });

  // ── Item 3: sell carousel ───────────────────────────────────────────────────
  const sell = page.locator("section", { has: page.getByRole("heading", { name: /Sell Your Old Device Now/i }) });
  await sell.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await sell.screenshot({ path: `${OUT}/02-sell-carousel.png` });

  // ── Item 4: the "What needs fixing?" tiles that had to become clickable ─────
  await page.goto(`${BASE}/service/mobile-repair`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const fixing = page.locator("section", { has: page.getByRole("heading", { name: /What needs fixing/i }) });
  await fixing.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await fixing.screenshot({ path: `${OUT}/03-what-needs-fixing.png` });

  // Prove the tile navigates and carries the repair selection through.
  await page.getByRole("link", { name: /Screen Repair/i }).first().click();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/04-tile-navigated.png`, fullPage: false });

  // ── Item 6: order tracking ──────────────────────────────────────────────────
  await page.goto(`${BASE}/track`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/05-track.png`, fullPage: false });

  // ── Item 7: auth, and the cart that used to log a 401 ───────────────────────
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/06-auth.png`, fullPage: false });

  const cartErrors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") cartErrors.push(m.text()); });
  await page.goto(`${BASE}/cart`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/07-cart.png`, fullPage: false });
  console.log(`/cart console errors: ${cartErrors.length}`);

  // ── Item 3 fix: booking flow, where unguarded catalog images used to render ──
  await page.goto(`${BASE}/sell/mobile`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/08-sell-category.png`, fullPage: false });
});
