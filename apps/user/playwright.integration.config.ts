import { defineConfig } from "@playwright/test";

/**
 * Integration config: real database, no browser and no dev server.
 *
 * Kept separate from the unit config because these tests need credentials and are
 * therefore not safe to run in every environment, and separate from the e2e config
 * because they talk to Postgres directly rather than through the app.
 *
 * Serial by necessity: each test creates and deletes its own booking rows.
 */
export default defineConfig({
  testDir: "./tests/integration",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  timeout: 60_000,
});
