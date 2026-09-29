import type { Page } from "@playwright/test";

import { isIgnoredConsoleMessage } from "./routes";

/**
 * The measuring instruments the audits share.
 *
 * Extracted from route-sweep.spec.ts when the dashboard sweep was added: two
 * audits that disagree about what counts as a broken image or a dead control are
 * worse than one audit, because the difference is invisible in the report.
 */

export type ImageFailure = { url: string; reason: string };
export type DeadControl = { tag: string; text: string; classes: string };

export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
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
export async function collectBrokenImages(page: Page): Promise<ImageFailure[]> {
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
export async function collectDeadControls(page: Page): Promise<DeadControl[]> {
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

/**
 * Wires console, page-error and image listeners onto a page and returns the arrays
 * they fill. Attach before the first navigation, or early errors are missed.
 */
export function watchPage(page: Page): { consoleErrors: string[]; imageFailures: ImageFailure[] } {
  const consoleErrors: string[] = [];
  const imageFailures: ImageFailure[] = [];

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

  return { consoleErrors, imageFailures };
}
