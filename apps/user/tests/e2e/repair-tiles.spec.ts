import { expect, test } from "@playwright/test";

/**
 * "What needs fixing?" tiles on the service landing pages.
 *
 * These tiles previously rendered as plain <div>s with a hover shadow: they
 * looked clickable and did nothing. They are now links driven by the real
 * repair_categories rows, and each one carries its category id down the catalog
 * path so the booking flow opens with that repair preselected.
 */

const SERVICE_PATHS = ["/service/mobile-repair", "/service/laptop-repair"];

for (const servicePath of SERVICE_PATHS) {
  test.describe(`${servicePath} repair tiles`, () => {
    test("every tile is a link with a destination", async ({ page }) => {
      await page.goto(servicePath);

      const section = page.locator("section", { has: page.getByRole("heading", { name: /what needs fixing/i }) });
      await expect(section).toBeVisible();

      const tiles = section.getByRole("link");
      const count = await tiles.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i += 1) {
        const href = await tiles.nth(i).getAttribute("href");
        // Must point at the brand chooser and carry a repair category id.
        expect(href, `tile ${i} href`).toBeTruthy();
        expect(href!).toContain("/brands");
        expect(href!).toMatch(/category=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      }
    });

    test("each tile has an accessible name", async ({ page }) => {
      await page.goto(servicePath);

      const section = page.locator("section", { has: page.getByRole("heading", { name: /what needs fixing/i }) });
      const tiles = section.getByRole("link");

      for (let i = 0; i < (await tiles.count()); i += 1) {
        const name = await tiles.nth(i).getAttribute("aria-label");
        expect(name, `tile ${i} aria-label`).toBeTruthy();
      }
    });

    test("a tile is reachable and activatable by keyboard", async ({ page }) => {
      await page.goto(servicePath);

      const section = page.locator("section", { has: page.getByRole("heading", { name: /what needs fixing/i }) });
      const firstTile = section.getByRole("link").first();

      await firstTile.focus();
      await expect(firstTile).toBeFocused();

      await page.keyboard.press("Enter");
      await page.waitForURL(/\/brands\?category=/, { timeout: 30_000 });
      expect(page.url()).toMatch(/category=/);
    });

    test("clicking a tile carries the repair selection into the booking flow", async ({ page }) => {
      await page.goto(servicePath);

      const section = page.locator("section", { has: page.getByRole("heading", { name: /what needs fixing/i }) });
      const firstTile = section.getByRole("link").first();
      const tileHref = await firstTile.getAttribute("href");
      const categoryId = new URL(tileHref!, page.url()).searchParams.get("category");
      expect(categoryId).toBeTruthy();

      await firstTile.click();
      await page.waitForURL(/\/brands\?category=/, { timeout: 30_000 });

      // Brand → the selection must survive the hop.
      const brandLink = page.locator(`a[href*="category=${categoryId}"]`).first();
      await expect(brandLink).toBeVisible({ timeout: 30_000 });
      await brandLink.click();

      // Depending on the brand this lands on a series list or straight on models;
      // either way the selection must still be in the URL.
      await page.waitForURL(new RegExp(`category=${categoryId}`), { timeout: 30_000 });
      expect(page.url()).toContain(`category=${categoryId}`);
    });

    /**
     * The test above proves one tile works. This one proves *every* tile does.
     *
     * The failure it exists to catch is a tile whose category id is stale or
     * belongs to the other service: it would still render, still link to
     * /brands, and still look correct, but the brand chooser would offer nothing
     * that carries that category onward — so the customer would silently lose
     * their repair selection one hop later. Checking only the first tile cannot
     * see that.
     */
    test("every tile, not just the first, survives the hop to the brand chooser", async ({ page }) => {
      await page.goto(servicePath);

      const section = page.locator("section", { has: page.getByRole("heading", { name: /what needs fixing/i }) });
      const tiles = section.getByRole("link");
      await expect(tiles.first()).toBeVisible({ timeout: 30_000 });

      const plan = await tiles.evaluateAll((nodes) =>
        nodes.map((node) => ({
          label: (node.querySelector("h3")?.textContent ?? node.getAttribute("aria-label") ?? "").trim(),
          href: node.getAttribute("href") ?? "",
        })),
      );
      expect(plan.length).toBeGreaterThan(0);

      for (const tile of plan) {
        const categoryId = new URL(tile.href, page.url()).searchParams.get("category");

        await test.step(`${tile.label || tile.href} → brands`, async () => {
          expect(categoryId, "tile carries a category id").toBeTruthy();

          await page.goto(tile.href);
          expect(page.url()).toContain(`category=${categoryId}`);

          // At least one brand must carry this exact category onward. An empty
          // brand list, or brands linking without the param, both mean the
          // selection dies here.
          const onward = page.locator(`a[href*="category=${categoryId}"]`);
          await expect(onward.first()).toBeVisible({ timeout: 30_000 });
        });
      }
    });

    /**
     * The end of the journey: the booking flow must open on the repair step with
     * the tile's category already chosen, for every tile.
     *
     * The model URL is discovered once by walking the catalog, rather than
     * hardcoded, so this does not break when the seeded catalog changes.
     */
    test("every tile preselects its own repair category in the booking flow", async ({ page }) => {
      await page.goto(servicePath);

      const section = page.locator("section", { has: page.getByRole("heading", { name: /what needs fixing/i }) });
      const tiles = section.getByRole("link");
      await expect(tiles.first()).toBeVisible({ timeout: 30_000 });

      const plan = await tiles.evaluateAll((nodes) =>
        nodes.map((node) => ({
          label: (node.querySelector("h3")?.textContent ?? "").trim(),
          href: node.getAttribute("href") ?? "",
        })),
      );

      // Walk one tile down to a bookable model to learn a real booking URL.
      const first = plan[0];
      const firstCategory = new URL(first.href, page.url()).searchParams.get("category")!;

      /**
       * All in-page hrefs whose path has exactly `depth` segments under
       * /service/<type>/. Matching on shape rather than clicking the first link
       * that happens to carry the category param matters: breadcrumbs and the
       * "all brands" link also carry it, so a click-the-first-match walk goes
       * round in circles instead of descending.
       */
      async function hrefsAtDepth(depth: number, mustInclude: string): Promise<string[]> {
        return page.locator("a[href]").evaluateAll(
          (nodes, { depth: d, mustInclude: needle }) =>
            nodes
              .map((node) => node.getAttribute("href") ?? "")
              .filter((href) => href.startsWith("/service/") && href.includes(needle))
              .filter((href) => {
                const path = href.split("?")[0].replace(/\/$/, "");
                return path.split("/").filter(Boolean).length === d;
              }),
          { depth, mustInclude },
        );
      }

      // /service/<type>/brands?category=... → a brand
      await page.goto(first.href);
      const [brandHref] = await hrefsAtDepth(4, "/brands/");
      expect(brandHref, "brands page offers a brand").toBeTruthy();

      // → a series (or, for some brands, models directly)
      await page.goto(brandHref);
      let bookHref = (await hrefsAtDepth(6, "/book/"))[0];
      if (!bookHref) {
        const [seriesHref] = await hrefsAtDepth(5, "/brands/");
        expect(seriesHref, "brand page offers a series").toBeTruthy();
        await page.goto(seriesHref);
        bookHref = (await hrefsAtDepth(6, "/book/"))[0];
      }

      expect(bookHref, "found a bookable model by walking the catalog").toBeTruthy();
      const bookPath = new URL(bookHref, page.url()).pathname;
      // The walk itself must not have dropped the selection.
      expect(page.url()).toContain(`category=${firstCategory}`);

      for (const tile of plan) {
        const categoryId = new URL(tile.href, page.url()).searchParams.get("category")!;

        await test.step(`${tile.label} preselected at the booking step`, async () => {
          await page.goto(`${bookPath}?category=${categoryId}`);

          // Arriving with a category means the flow skips "Choose Repair
          // Category" and opens on the service list for that category.
          await expect(page.getByRole("heading", { name: /choose repair service/i })).toBeVisible({
            timeout: 30_000,
          });

          // And the category shown is the tile's own, not a default or the
          // previous iteration's.
          await expect(page.getByText(tile.label, { exact: true }).first()).toBeVisible({
            timeout: 30_000,
          });
        });
      }
    });
  });
}

test("the mobile and laptop pages offer different repair categories", async ({ page }) => {
  async function tileNames(path: string) {
    await page.goto(path);
    const section = page.locator("section", { has: page.getByRole("heading", { name: /what needs fixing/i }) });
    const links = section.getByRole("link");
    // Wait for the section to actually render before reading it.
    await expect(links.first()).toBeVisible({ timeout: 30_000 });
    return links.evaluateAll((nodes) =>
      nodes.map((n) => (n.querySelector("h3")?.textContent ?? "").trim()),
    );
  }

  const mobile = await tileNames("/service/mobile-repair");
  const laptop = await tileNames("/service/laptop-repair");

  expect(mobile.length).toBeGreaterThan(0);
  expect(laptop.length).toBeGreaterThan(0);
  // The old hardcoded list showed identical mobile-only categories on both pages,
  // including ones (like Camera) that do not exist for laptops.
  expect(mobile).not.toEqual(laptop);
});
