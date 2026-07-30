import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clearDownstream,
  nextStep,
  paginate,
  parseTypedDate,
  prevStep,
  sequenceFor,
} from "../apps/user/src/lib/whatsapp/flow/steps.ts";
import { NAV, optionId, parseId } from "../apps/user/src/lib/whatsapp/flow/ids.ts";

// Unit tests for the pure core of the WhatsApp booking wizard.
// Run with:  node --test scripts/whatsapp-flow.test.ts
// (Node 22.18+ strips the TypeScript types natively — no build step.)

describe("sequenceFor", () => {
  it("puts a mobile repair through the website's step order", () => {
    const steps = sequenceFor({ kind: "repair", dbServiceType: "mobile_repair" });
    assert.deepEqual(steps.slice(0, 6), [
      "brand",
      "series",
      "model",
      "repair_category",
      "repair_service",
      "notes",
    ]);
    assert.equal(steps.at(-1), "confirm");
  });

  it("adds the laptop-spec steps only for laptop repairs", () => {
    const laptop = sequenceFor({ kind: "repair", dbServiceType: "laptop_repair" });
    const mobile = sequenceFor({ kind: "repair", dbServiceType: "mobile_repair" });
    assert.ok(laptop.includes("laptop_ram"));
    assert.ok(laptop.includes("laptop_storage"));
    assert.ok(laptop.includes("laptop_os"));
    assert.ok(!mobile.includes("laptop_ram"));
  });

  it("routes a screen guard past the repair pickers", () => {
    const steps = sequenceFor({ kind: "guard" });
    assert.ok(steps.includes("guard"));
    assert.ok(!steps.includes("repair_category"));
  });

  it("walks CCTV through its five config questions", () => {
    const steps = sequenceFor({ kind: "cctv" });
    assert.deepEqual(steps.slice(0, 5), [
      "cctv_service",
      "cctv_brand",
      "cctv_cameras",
      "cctv_location",
      "cctv_dvr",
    ]);
  });

  it("skips variant + condition questions when a sell model has no price", () => {
    const priced = sequenceFor({ kind: "sell" });
    const unpriced = sequenceFor({ kind: "sell", sellPriced: false });
    assert.ok(priced.includes("sell_variant") && priced.includes("sell_quote"));
    assert.ok(!unpriced.includes("sell_variant") && !unpriced.includes("sell_quote"));
    // An unpriced model still books a pickup, so the details steps remain.
    assert.ok(unpriced.includes("date") && unpriced.at(-1) === "confirm");
  });
});

describe("nextStep / prevStep", () => {
  it("are exact inverses across a whole journey", () => {
    const context = { kind: "repair" as const, dbServiceType: "laptop_repair" };
    const steps = sequenceFor(context);
    for (let index = 0; index < steps.length - 1; index++) {
      const step = steps[index];
      const next = nextStep(step, context);
      assert.equal(next, steps[index + 1], `next after ${step}`);
      assert.equal(prevStep(next, context), step, `prev before ${next}`);
    }
  });

  it("has no previous step at the start of a journey", () => {
    assert.equal(prevStep("brand", { kind: "repair" }), null);
  });

  it("returns to the review screen while editing one field", () => {
    assert.equal(nextStep("address", { kind: "repair", editing: true }), "confirm");
    assert.equal(nextStep("date", { kind: "sell", editing: true }), "confirm");
  });

  it("ends every journey on confirm", () => {
    assert.equal(nextStep("slot", { kind: "repair" }), "confirm");
    assert.equal(nextStep("confirm", { kind: "repair" }), "confirm");
  });
});

describe("clearDownstream", () => {
  const full = {
    kind: "repair" as const,
    brandId: "b1",
    brandName: "Apple",
    seriesId: "s1",
    seriesName: "iPhone 12",
    modelId: "m1",
    modelName: "iPhone 12",
    repairCategoryId: "c1",
    repairSubcategoryId: "sc1",
    price: 4999,
    name: "Asha",
    pincode: "560002",
  };

  it("drops the series, model and price when the brand changes", () => {
    const cleared = clearDownstream("brand", full);
    assert.equal(cleared.seriesId, undefined);
    assert.equal(cleared.modelId, undefined);
    assert.equal(cleared.repairSubcategoryId, undefined);
    assert.equal(cleared.price, undefined);
  });

  it("keeps customer details when only the device changes", () => {
    const cleared = clearDownstream("model", full);
    assert.equal(cleared.name, "Asha");
    assert.equal(cleared.pincode, "560002");
    assert.equal(cleared.repairSubcategoryId, undefined);
  });

  it("keeps the model when only the repair category changes", () => {
    const cleared = clearDownstream("repair_category", full);
    assert.equal(cleared.modelId, "m1");
    assert.equal(cleared.repairSubcategoryId, undefined);
  });

  it("resets the sell answers when the variant changes", () => {
    const cleared = clearDownstream("sell_variant", {
      kind: "sell",
      sellVariantId: "v1",
      sellAnswers: { q1: ["o1"] },
      sellQuote: 12000,
    });
    assert.equal(cleared.sellAnswers, undefined);
    assert.equal(cleared.sellQuote, undefined);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 19 }, (_, index) => index);

  it("fits eight options per page, leaving room for the nav rows", () => {
    const page = paginate(items, 0);
    assert.equal(page.items.length, 8);
    assert.equal(page.pageCount, 3);
    assert.equal(page.hasMore, true);
  });

  it("reports the last page correctly", () => {
    const page = paginate(items, 2);
    assert.equal(page.items.length, 3);
    assert.equal(page.hasMore, false);
  });

  it("clamps an out-of-range page instead of returning nothing", () => {
    assert.equal(paginate(items, 99).page, 2);
    assert.equal(paginate(items, -5).page, 0);
  });

  it("handles an empty catalogue", () => {
    const page = paginate([], 0);
    assert.equal(page.items.length, 0);
    assert.equal(page.pageCount, 1);
    assert.equal(page.hasMore, false);
  });
});

describe("parseTypedDate", () => {
  const now = new Date(2026, 6, 30); // 30 Jul 2026

  it("reads today and tomorrow", () => {
    assert.equal(parseTypedDate("today", now), "2026-07-30");
    assert.equal(parseTypedDate("Tomorrow", now), "2026-07-31");
  });

  it("reads a written date", () => {
    assert.equal(parseTypedDate("2 Aug", now), "2026-08-02");
    assert.equal(parseTypedDate("2nd August", now), "2026-08-02");
  });

  it("reads a numeric date as day/month", () => {
    assert.equal(parseTypedDate("02/08", now), "2026-08-02");
    assert.equal(parseTypedDate("2-8-2026", now), "2026-08-02");
  });

  it("rolls a past date into next year rather than booking the past", () => {
    assert.equal(parseTypedDate("5 Jan", now), "2027-01-05");
  });

  it("passes an ISO date straight through", () => {
    assert.equal(parseTypedDate("2026-09-15", now), "2026-09-15");
  });

  it("returns null for anything it can't read confidently", () => {
    assert.equal(parseTypedDate("sometime next week", now), null);
    assert.equal(parseTypedDate("31 Feb", now), null);
    assert.equal(parseTypedDate("", now), null);
  });
});

describe("interactive ids", () => {
  it("round-trips a step and value", () => {
    const parsed = parseId(optionId("model", "9f3c-uuid"));
    assert.deepEqual(parsed, { kind: "option", step: "model", value: "9f3c-uuid" });
  });

  it("recognises global navigation", () => {
    assert.deepEqual(parseId(NAV.menu), { kind: "nav", value: "nav:menu" });
    assert.deepEqual(parseId(NAV.agent), { kind: "nav", value: "nav:agent" });
  });

  it("ignores ids that aren't ours", () => {
    assert.equal(parseId("random-button"), null);
    assert.equal(parseId(null), null);
    assert.equal(parseId(""), null);
  });
});
