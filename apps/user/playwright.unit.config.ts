import { defineConfig } from "@playwright/test";

/**
 * Unit-test config: same runner, no browser and no dev server.
 *
 * The repo has no separate unit-test toolchain, and adding one (vitest/jest plus
 * its own TS pipeline) for a handful of pure functions would be more moving parts
 * than it is worth. Playwright already resolves this app's tsconfig paths, so it
 * runs these fine — it just must not boot Next.js to do it.
 */
export default defineConfig({
  testDir: "./tests/unit",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  timeout: 30_000,
});
