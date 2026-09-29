import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { auditRoutes, isIgnoredConsoleMessage } from "./routes";

/**
 * Route audit harness.
 *
 * Sweeps every primary route in a single test and records, per route:
 *   - final HTTP status (and any redirect)
 *   - console errors / uncaught page errors
 *   - image requests that failed or decoded to 0x0
 *   - elements that look clickable but have no destination or handler
 *
 * Deliberately one test rather than one-test-per-route: a route that hangs must
 * not prevent the remaining routes from being audited, and the summary must
 * always be written. Every per-route step is time-boxed by us, not by the
 * runner, so a hang is reported as a finding instead of aborting the sweep.
 */

type ImageFailure = { url: string; reason: string };
type DeadControl = { tag: string; text: string; classes: string };

type RouteFinding = {
  name: string;
  path: string;
  status: number | null;
  redirectedTo: string | null;
  consoleErrors: string[];
  imageFailures: ImageFailure[];
  deadControls: DeadControl[];
  navigationError: string | null;
};

// Generous per-route budget: on a memory-constrained machine the first hit to a
// route pays a cold Turbopack compile, and a large page can exceed a tight budget
// even though it serves in well under a second once warm. A too-tight budget makes
// the audit flaky, which is worse than slow.
const ROUTE_BUDGET_MS = 90_000;
const SETTLE_MS = 8_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Reads back every rendered image and reports the ones the browser could not
 * decode. `naturalWidth === 0` on a complete image is the reliable signal for
 * "this src is broken", and it catches CSS-hidden and lazy images that a pure
 * network listener misses.
 */
async function collectBrokenImages(page: Page): Promise<ImageFailure[]> {
  return page.evaluate(() => {
    const results: { url: string; reason: string }[] = [];
    for (const img of Array.from(document.querySelectorAll("img"))) {
      const src = img.currentSrc || img.getAttribute("src") || "";
      if (!src) {
        results.push({ url: "(empty src)", reason: "img element has no src" });
        continue;
      }
      if (img.complete && img.naturalWidth === 0) {
        results.push({ url: src, reason: "loaded but decoded to 0x0 (broken)" });
      }
    }
    return results;
  });
}

/**
 * Heuristic for "looks clickable, does nothing". React click handlers are not
 * visible in the DOM, so we look for the hover affordance classes this codebase
 * uses on elements that are neither links/buttons nor wrapped in one.
 */
async function collectDeadControls(page: Page): Promise<DeadControl[]> {
  return page.evaluate(() => {
    const interactiveTags = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY", "LABEL", "OPTION"]);
    const affordance = /(^|\s)(cursor-pointer|hover:shadow-|hover:border-)/;
    const interactiveSelector = "a, button, [role='button'], [role='link'], [role='tab'], input, select, textarea, label";
    const results: { tag: string; text: string; classes: string }[] = [];

    for (const el of Array.from(document.querySelectorAll<HTMLElement>("div, span, li, section, article, figure"))) {
      const classes = el.getAttribute("class") ?? "";
      if (!affordance.test(classes)) continue;
      if (interactiveTags.has(el.tagName)) continue;

      const role = el.getAttribute("role");
      if (role === "button" || role === "link" || role === "tab" || role === "menuitem") continue;
      if (el.hasAttribute("onclick")) continue;
      if (el.tabIndex >= 0) continue;

      // Wrapped in, or wrapping, something interactive is fine.
      if (el.closest(interactiveSelector)) continue;
      if (el.querySelector(interactiveSelector)) continue;

      results.push({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
        classes: classes.slice(0, 160),
      });
    }
    return results;
  });
}

async function auditRoute(context: BrowserContext, route: (typeof auditRoutes)[number]): Promise<RouteFinding> {
  const consoleErrors: string[] = [];
  const imageFailures: ImageFailure[] = [];
  const finding: RouteFinding = {
    name: route.name,
    path: route.path,
    status: null,
    redirectedTo: null,
    consoleErrors,
    imageFailures,
    deadControls: [],
    navigationError: null,
  };

  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (isIgnoredConsoleMessage(text)) return;
    consoleErrors.push(text);
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(`uncaught: ${error.message}`);
  });
  page.on("requestfailed", (request) => {
    if (request.resourceType() !== "image") return;
    const reason = request.failure()?.errorText ?? "request failed";
    // Aborted images are usually the browser cancelling a lazy load on unload,
    // not a broken asset.
    if (/ABORTED/i.test(reason)) return;
    imageFailures.push({ url: request.url(), reason });
  });
  page.on("response", (response) => {
    if (response.request().resourceType() !== "image") return;
    if (response.status() < 400) return;
    imageFailures.push({ url: response.url(), reason: `HTTP ${response.status()}` });
  });

  try {
    const response = await withTimeout(
      page.goto(route.path, { waitUntil: "domcontentloaded", timeout: ROUTE_BUDGET_MS }),
      ROUTE_BUDGET_MS,
      `goto ${route.path}`,
    );
    finding.status = response?.status() ?? null;

    const finalUrl = new URL(page.url());
    if (finalUrl.pathname !== route.path) {
      finding.redirectedTo = finalUrl.pathname + finalUrl.search;
    }

    // Let lazy images and hydration settle. Dev HMR keeps a socket open, so
    // networkidle is best-effort and a plain delay is the backstop.
    await page.waitForLoadState("networkidle", { timeout: SETTLE_MS }).catch(() => undefined);
    await page.waitForTimeout(750);

    finding.imageFailures.push(...(await withTimeout(collectBrokenImages(page), 20_000, "image scan")));
    finding.deadControls = await withTimeout(collectDeadControls(page), 20_000, "dead control scan");
  } catch (error) {
    finding.navigationError = error instanceof Error ? error.message : String(error);
  } finally {
    await page.close().catch(() => undefined);
  }

  return finding;
}

test("route audit sweep", async ({ browser }, testInfo) => {
  // The sweep owns its own budget; give it room for every route plus cold
  // Next.js dev compiles on first hit.
  testInfo.setTimeout(ROUTE_BUDGET_MS * auditRoutes.length + 120_000);

  const context = await browser.newContext();
  const findings: RouteFinding[] = [];

  for (const route of auditRoutes) {
    // One retry on a cold-compile timeout: a route that only fails the first time
    // is a build-speed artifact, not a defect, and reporting it as one wastes
    // attention. A route that fails twice is reported.
    let finding = await auditRoute(context, route);
    if (finding.navigationError && /exceeded \d+ms/.test(finding.navigationError)) {
      console.log(`  ${route.path} timed out on first hit, retrying once (cold compile)`);
      finding = await auditRoute(context, route);
    }
    findings.push(finding);
    const status = finding.navigationError ? "NAV FAIL" : String(finding.status);
    console.log(
      `  ${finding.path} -> ${status} | console:${finding.consoleErrors.length} images:${finding.imageFailures.length} dead:${finding.deadControls.length}`,
    );
  }

  await context.close();

  const lines: string[] = [];
  lines.push("# Looplic user app route audit");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("| Route | Status | Console errors | Broken images | Dead controls |");
  lines.push("| --- | --- | --- | --- | --- |");

  for (const finding of findings) {
    const status = finding.navigationError
      ? "NAV FAIL"
      : finding.redirectedTo
        ? `${finding.status} -> ${finding.redirectedTo}`
        : String(finding.status ?? "-");
    lines.push(
      `| \`${finding.path}\` | ${status} | ${finding.consoleErrors.length} | ${dedupe(finding.imageFailures.map((f) => f.url)).length} | ${finding.deadControls.length} |`,
    );
  }

  const navFailures = findings
    .filter((f) => f.navigationError || (f.status !== null && f.status >= 400))
    .map((f) => `${f.path}: ${f.navigationError ?? f.status}`);
  const allBrokenImages = dedupe(findings.flatMap((f) => f.imageFailures.map((i) => `${i.url} — ${i.reason}`)));
  const allConsoleErrors = dedupe(findings.flatMap((f) => f.consoleErrors.map((e) => `${f.path}: ${e}`)));
  const allDeadControls = dedupe(
    findings.flatMap((f) => f.deadControls.map((d) => `${f.path}: <${d.tag}> "${d.text}"`)),
  );

  appendSection(lines, "Route failures", navFailures);
  appendSection(lines, "Broken images", allBrokenImages);
  appendSection(lines, "Console errors", allConsoleErrors);
  appendSection(lines, "Elements that look clickable but are not", allDeadControls);

  const reportDir = resolve(process.cwd(), "test-results");
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(resolve(reportDir, "audit-report.md"), `${lines.join("\n")}\n`, "utf8");
  writeFileSync(resolve(reportDir, "audit-report.json"), `${JSON.stringify(findings, null, 2)}\n`, "utf8");

  console.log(`\n${lines.join("\n")}\n`);

  expect(navFailures, "every audited route must respond without error").toEqual([]);
  expect(allBrokenImages, "no route may render a broken image").toEqual([]);
  expect(allConsoleErrors, "no route may log a console error").toEqual([]);
  expect(allDeadControls, "no element may look clickable without being clickable").toEqual([]);
});

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function appendSection(lines: string[], title: string, values: string[]) {
  lines.push("");
  lines.push(`## ${title} (${values.length})`);
  lines.push("");
  if (values.length === 0) {
    lines.push("None.");
    return;
  }
  for (const value of values) lines.push(`- ${value}`);
}
