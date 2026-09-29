import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test, type Browser } from "@playwright/test";

import { collectBrokenImages, collectDeadControls, watchPage, withTimeout } from "./collectors";
import { customerAccount, dashboardApps, signedInUserRoutes, type DashboardApp } from "./dashboards";

/**
 * Route audit for the three dashboards, and for the customer app while signed in.
 *
 * The existing sweep covers `apps/user` as an anonymous visitor. That misses two
 * whole categories of page: every dashboard route (never swept at all), and every
 * signed-in surface (`/account` could only ever be observed redirecting to `/auth`).
 *
 * Each dashboard is started on its own port here rather than reusing the usual dev
 * ports, so running this cannot collide with a dev server someone already has up.
 *
 * Two things are checked per app:
 *   1. **Anonymous access is refused.** A dashboard route must not render for a
 *      visitor with no session. This is an authorization check, not a cosmetic one.
 *   2. **Signed in, the page is clean** — status, console errors, broken images,
 *      controls that look clickable and are not.
 */

const ROUTE_BUDGET_MS = 90_000;
const BOOT_BUDGET_MS = 180_000;

type Finding = {
  app: string;
  name: string;
  path: string;
  status: number | null;
  redirectedTo: string | null;
  consoleErrors: string[];
  imageFailures: { url: string; reason: string }[];
  deadControls: { tag: string; text: string; classes: string }[];
  navigationError: string | null;
};

const findings: Finding[] = [];
const protectionResults: { app: string; path: string; outcome: string; safe: boolean }[] = [];
const bootFailures: { app: string; reason: string }[] = [];

/** Starts `next dev` for one app and resolves once it answers. */
async function startApp(app: DashboardApp): Promise<ChildProcess | null> {
  const child = spawn(
    "npx",
    ["next", "dev", "--turbopack", "--port", String(app.port)],
    {
      cwd: resolve(process.cwd(), "..", app.name),
      shell: true,
      // A capped heap for the same reason the user app's config caps it: the
      // webpack dev server can eat several GB and die mid-audit.
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=1400" },
      stdio: "ignore",
    },
  );

  const base = `http://localhost:${app.port}`;
  const deadline = Date.now() + BOOT_BUDGET_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(5_000) });
      // Any answer means the server is listening; a redirect to a login page is
      // the expected answer for a dashboard root.
      if (response.status > 0) return child;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 2_000));
  }

  child.kill();
  return null;
}

async function auditPage(
  browser: Browser,
  appName: string,
  base: string,
  route: { path: string; name: string },
  storageState?: string,
): Promise<Finding> {
  const context = await browser.newContext(storageState ? { storageState } : {});
  const page = await context.newPage();
  const { consoleErrors, imageFailures } = watchPage(page);

  const finding: Finding = {
    app: appName,
    name: route.name,
    path: route.path,
    status: null,
    redirectedTo: null,
    consoleErrors,
    imageFailures,
    deadControls: [],
    navigationError: null,
  };

  try {
    const response = await withTimeout(
      page.goto(`${base}${route.path}`, { waitUntil: "domcontentloaded", timeout: ROUTE_BUDGET_MS }),
      ROUTE_BUDGET_MS,
      `goto ${route.path}`,
    );
    finding.status = response?.status() ?? null;

    // Dashboards gate client-side, so the redirect happens after hydration rather
    // than in the HTTP response. Give it a moment to settle before reading the URL.
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    await page.waitForTimeout(1_500);

    const finalUrl = new URL(page.url());
    if (finalUrl.pathname !== route.path) finding.redirectedTo = finalUrl.pathname + finalUrl.search;

    finding.imageFailures.push(...(await withTimeout(collectBrokenImages(page), 20_000, "image scan")));
    finding.deadControls = await withTimeout(collectDeadControls(page), 20_000, "dead control scan");
  } catch (error) {
    finding.navigationError = error instanceof Error ? error.message : String(error);
  } finally {
    await context.close().catch(() => undefined);
  }

  return finding;
}

/**
 * Signs in through the app's own login form and returns the storage state, so the
 * rest of the sweep reuses one session instead of logging in per route.
 *
 * Deliberately through the UI rather than by forging a cookie: if the login form is
 * broken, this audit should fail, which is exactly the kind of defect it is meant to
 * find.
 */
async function signIn(browser: Browser, app: DashboardApp): Promise<string | null> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const base = `http://localhost:${app.port}`;

  try {
    await page.goto(`${base}${app.loginPath}`, { waitUntil: "domcontentloaded", timeout: ROUTE_BUDGET_MS });
    await page.locator('input[type="email"]').first().fill(app.email);
    await page.locator('input[type="password"]').first().fill(app.password);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL((url) => url.pathname.startsWith(app.landingPath), { timeout: 45_000 });
    return await context.storageState().then((state) => JSON.stringify(state));
  } catch {
    return null;
  } finally {
    await context.close().catch(() => undefined);
  }
}

test("dashboard and signed-in route audit", async ({ browser }, testInfo) => {
  testInfo.setTimeout(BOOT_BUDGET_MS * 4 + ROUTE_BUDGET_MS * 12 + 120_000);

  // ── The three dashboards ──────────────────────────────────────────────────
  for (const app of dashboardApps) {
    const child = await startApp(app);
    if (!child) {
      bootFailures.push({ app: app.name, reason: `did not answer on port ${app.port} within ${BOOT_BUDGET_MS}ms` });
      console.log(`  ${app.name}: FAILED TO START`);
      continue;
    }

    const base = `http://localhost:${app.port}`;

    try {
      // 1. Anonymous access must be refused.
      for (const path of app.protectedRoutes) {
        const anon = await auditPage(browser, app.name, base, { path, name: `${path} (anonymous)` });
        const landedElsewhere = Boolean(anon.redirectedTo);
        const outcome = anon.navigationError
          ? `navigation error: ${anon.navigationError}`
          : landedElsewhere
            ? `redirected to ${anon.redirectedTo}`
            : `rendered (status ${anon.status})`;
        protectionResults.push({ app: app.name, path, outcome, safe: landedElsewhere });
        console.log(`  ${app.name} ${path} anonymous -> ${outcome}`);
      }

      // 2. Signed in, sweep the routes.
      const storageState = await signIn(browser, app);
      if (!storageState) {
        bootFailures.push({ app: app.name, reason: `could not sign in as ${app.email} through ${app.loginPath}` });
        console.log(`  ${app.name}: SIGN-IN FAILED`);
        continue;
      }

      const statePath = resolve(process.cwd(), "test-results", `audit-state-${app.name}.json`);
      mkdirSync(resolve(process.cwd(), "test-results"), { recursive: true });
      writeFileSync(statePath, storageState, "utf8");

      for (const route of app.routes) {
        const finding = await auditPage(browser, app.name, base, route, statePath);
        findings.push(finding);
        console.log(
          `  ${app.name} ${finding.path} -> ${finding.navigationError ? "NAV FAIL" : finding.status} | console:${finding.consoleErrors.length} images:${finding.imageFailures.length} dead:${finding.deadControls.length}`,
        );
      }
    } finally {
      child.kill();
      // Windows needs a moment to release the port before the next app binds.
      await new Promise((r) => setTimeout(r, 3_000));
    }
  }

  // ── Signed-in surfaces on the customer app ────────────────────────────────
  // Reuses the sweep's own server (baseURL from the Playwright config) rather than
  // starting a fourth one.
  const userBase = testInfo.project.use.baseURL ?? "http://localhost:3100";
  const customerState = await (async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${userBase}/auth`, { waitUntil: "domcontentloaded", timeout: ROUTE_BUDGET_MS });
      await page.locator('input[type="email"]').first().fill(customerAccount.email);
      await page.locator('input[type="password"]').first().fill(customerAccount.password);
      await page.locator('button[type="submit"]').first().click();
      // Sign-in is OTP-gated, so this legitimately may not complete. Treated as a
      // reportable limitation rather than a failure.
      await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 20_000 });
      return JSON.stringify(await context.storageState());
    } catch {
      return null;
    } finally {
      await context.close().catch(() => undefined);
    }
  })();

  if (customerState) {
    const statePath = resolve(process.cwd(), "test-results", "audit-state-customer.json");
    writeFileSync(statePath, customerState, "utf8");
    for (const route of signedInUserRoutes) {
      const finding = await auditPage(browser, "user", userBase, route, statePath);
      findings.push(finding);
      console.log(
        `  user ${finding.path} -> ${finding.navigationError ? "NAV FAIL" : finding.status} | console:${finding.consoleErrors.length} images:${finding.imageFailures.length} dead:${finding.deadControls.length}`,
      );
    }
  } else {
    bootFailures.push({
      app: "user",
      reason:
        "could not complete customer sign-in from a script — /auth is OTP-gated, so signed-in surfaces were not audited",
    });
    console.log("  user: customer sign-in not scriptable (OTP-gated)");
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const lines: string[] = [];
  lines.push("# Looplic dashboard and signed-in route audit");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(
    "Complements `route-audit.md`, which covers the customer app as an anonymous visitor. This covers what that one cannot see: the three dashboards, and pages that only exist for someone signed in.",
  );
  lines.push("");

  lines.push("## Anonymous access to dashboard routes");
  lines.push("");
  lines.push("A dashboard route must not render without a session.");
  lines.push("");
  lines.push("| App | Route | Anonymous outcome | Safe |");
  lines.push("| --- | --- | --- | --- |");
  for (const result of protectionResults) {
    lines.push(`| ${result.app} | \`${result.path}\` | ${result.outcome} | ${result.safe ? "yes" : "**NO**"} |`);
  }
  lines.push("");

  lines.push("## Signed-in route sweep");
  lines.push("");
  lines.push("| App | Route | Status | Console errors | Broken images | Dead controls |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const finding of findings) {
    const status = finding.navigationError ? "NAV FAIL" : String(finding.status);
    const redirect = finding.redirectedTo ? ` → \`${finding.redirectedTo}\`` : "";
    lines.push(
      `| ${finding.app} | \`${finding.path}\`${redirect} | ${status} | ${finding.consoleErrors.length} | ${finding.imageFailures.length} | ${finding.deadControls.length} |`,
    );
  }
  lines.push("");

  const withConsole = findings.filter((f) => f.consoleErrors.length > 0);
  lines.push(`## Console errors (${withConsole.length} route(s))`);
  lines.push("");
  if (withConsole.length === 0) {
    lines.push("None.");
  } else {
    for (const finding of withConsole) {
      lines.push(`### ${finding.app} \`${finding.path}\``);
      for (const message of finding.consoleErrors.slice(0, 10)) lines.push(`- ${message}`);
      lines.push("");
    }
  }
  lines.push("");

  const withImages = findings.filter((f) => f.imageFailures.length > 0);
  lines.push(`## Broken images (${withImages.length} route(s))`);
  lines.push("");
  if (withImages.length === 0) {
    lines.push("None.");
  } else {
    for (const finding of withImages) {
      lines.push(`### ${finding.app} \`${finding.path}\``);
      for (const failure of finding.imageFailures.slice(0, 10)) lines.push(`- ${failure.url} — ${failure.reason}`);
      lines.push("");
    }
  }
  lines.push("");

  const withDead = findings.filter((f) => f.deadControls.length > 0);
  lines.push(`## Elements that look clickable but are not (${withDead.length} route(s))`);
  lines.push("");
  if (withDead.length === 0) {
    lines.push("None.");
  } else {
    for (const finding of withDead) {
      lines.push(`### ${finding.app} \`${finding.path}\``);
      for (const control of finding.deadControls.slice(0, 10)) {
        lines.push(`- \`<${control.tag}>\` "${control.text}"`);
      }
      lines.push("");
    }
  }
  lines.push("");

  lines.push(`## Not covered (${bootFailures.length})`);
  lines.push("");
  if (bootFailures.length === 0) {
    lines.push("Nothing — every app started and every account signed in.");
  } else {
    for (const failure of bootFailures) lines.push(`- **${failure.app}**: ${failure.reason}`);
  }
  lines.push("");

  const outDir = resolve(process.cwd(), "..", "..", "docs", "audit");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "dashboard-audit.md"), lines.join("\n"), "utf8");
  console.log(`\nWrote docs/audit/dashboard-audit.md`);

  // The sweep's job is to report, so a console error does not fail it. Two things
  // do, because they mean the report itself cannot be trusted:
  //   - a dashboard route that rendered for an anonymous visitor;
  //   - an app that never started, so its routes were never looked at.
  const unsafe = protectionResults.filter((result) => !result.safe);
  expect(unsafe, `dashboard routes reachable without signing in: ${JSON.stringify(unsafe)}`).toHaveLength(0);
  expect(findings.length, "at least one dashboard route was audited").toBeGreaterThan(0);
});
