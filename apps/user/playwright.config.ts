import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the Looplic user app.
 *
 * The audit harness (tests/audit) and feature specs (tests/e2e) both run here.
 *
 * The dev server is started with Turbopack and a capped V8 heap on purpose. The
 * webpack dev server needs several GB to compile this app's larger routes and
 * dies with "JavaScript heap out of memory" on a memory-constrained machine,
 * which shows up as a hung /sell and a 500 on /service/mobile-repair rather than
 * as a real defect. Turbopack serves the same routes in ~100 MB.
 *
 * Set PLAYWRIGHT_BASE_URL to audit an already-running instance (staging,
 * production, a local `next start`); no server is started in that case.
 */
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = externalBaseUrl ?? `http://localhost:${port}`;
// Unit specs need no server; booting one just to run them wastes a minute.
const skipServer = process.env.PLAYWRIGHT_NO_SERVER === "1";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer:
    externalBaseUrl || skipServer
      ? undefined
      : {
          command: `npx next dev --turbopack --port ${port}`,
          url: `http://localhost:${port}`,
          reuseExistingServer: true,
          timeout: 240_000,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            NODE_OPTIONS: "--max-old-space-size=1400",
          },
        },
});
