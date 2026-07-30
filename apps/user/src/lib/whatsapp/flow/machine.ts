import { isValidPhoneNumber, isValidPincode } from "@/src/lib/bookings";
import { companyName, supportPhoneDisplay } from "@/src/lib/company";
import { getCctvServiceLabel } from "@/src/lib/cctv-booking";
import type { CatalogServiceType } from "@/src/lib/data/catalog";
import type { BuybackServiceType } from "@/src/lib/data/buyback";

import {
  cancelBooking,
  computeBuybackEstimate,
  findBookingByCode,
  getBuybackDeviceOptions,
  getSavedProfile,
  isSelfServiceEditable,
  listRecentBookings,
  rescheduleBooking,
  searchDevices,
  type SellQuestion,
  type TrackedBooking,
} from "../booking";
import { sendButtons, sendList, sendText, type ListRow } from "../client";
import { clearFlow, setFlow } from "../store";
import {
  listBrands,
  listModels,
  listRepairCategories,
  listRepairServices,
  listScreenGuards,
  listSeries,
  paginate,
  type PickerOption,
} from "./catalog-nav";
import {
  CAMERA_COUNT_OPTIONS,
  DVR_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  OS_OPTIONS,
  RAM_OPTIONS,
  SELL_CATEGORIES,
  SERVICE_LABELS,
  SERVICE_MENU,
  STORAGE_OPTIONS,
  TIME_SLOTS,
  cctvBrandOptions,
  cctvServiceOptions,
} from "./constants";
import { NAV, optionId, parseId } from "./ids";
import { clearDownstream, nextStep, parseTypedDate, prevStep, sequenceFor } from "./steps";
import { submitBooking } from "./submit";
import { buildConfirmSummary, deviceLabel, formatDate, inr, seriesLabel } from "./summary";
import type { FlowContext, FlowStep } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// The guided booking wizard.
//
// Every inbound message is a fresh serverless invocation, so the wizard is a
// pure(ish) state machine: (step, context, input) → (step, context) → rendered
// prompt. `step` + `context` live on whatsapp_conversations, never in memory.
//
// Two rules keep it robust against how WhatsApp actually behaves:
//   1. Old messages stay tappable forever. So a tap carries the step that
//      produced it, and tapping an OLD option rewinds to that step and
//      re-answers it (clearing anything downstream) instead of erroring.
//   2. A list holds ten rows total. Every picker paginates (8 options + nav).
// ─────────────────────────────────────────────────────────────────────────────

const BACK_ROW = (step: FlowStep): ListRow => ({ id: optionId(step, NAV.back), title: "⬅️ Back" });
const MENU_ROW: ListRow = { id: NAV.menu, title: "🏠 Main menu" };

// ─── Entry points ────────────────────────────────────────────────────────────

// The main menu is split across two pages. A WhatsApp list holds TEN rows in
// total, and nine services plus "My orders" and "Talk to our team" is eleven —
// which Meta would silently truncate, hiding the handoff option.
const PRIMARY_SERVICE_COUNT = 6;

export async function showMainMenu(waId: string, note?: string, page = 0): Promise<void> {
  await clearFlow(waId);

  const toRow = (entry: (typeof SERVICE_MENU)[number]): ListRow => ({
    id: optionId("service", entry.id),
    title: entry.title,
    description: entry.description,
  });

  if (page > 0) {
    await sendList(
      waId,
      {
        body: withNote(note, "Here's everything else we do 👇"),
        buttonLabel: "Choose a service",
        header: "More services",
        sections: [
          {
            rows: [
              ...SERVICE_MENU.slice(PRIMARY_SERVICE_COUNT).map(toRow),
              { id: NAV.menu, title: "⬅️ Back to main menu" },
            ],
          },
        ],
      },
      "menu-more",
    );
    return;
  }

  const body = [
    note,
    note ? "" : null,
    `Hi! 👋 Welcome to *${companyName}* — doorstep repairs, screen guards, CCTV and device buyback in Bengaluru.`,
    "",
    "Tap *Choose a service* below and I'll take you through it step by step.",
  ]
    .filter((line) => line !== null && line !== undefined)
    .join("\n");

  await sendList(
    waId,
    {
      body,
      buttonLabel: "Choose a service",
      header: companyName,
      footer: "You can type 'menu' anytime",
      sections: [
        {
          title: "Book a service",
          rows: SERVICE_MENU.slice(0, PRIMARY_SERVICE_COUNT).map(toRow),
        },
        {
          title: "More",
          rows: [
            {
              id: optionId("service", NAV.more),
              title: "🧰 Other services",
              description: "Desktop, managed IT, WiFi",
            },
            { id: optionId("service", "track"), title: "📦 My orders", description: "Track, reschedule or cancel" },
            { id: NAV.agent, title: "💬 Talk to our team", description: "Hand over to a human" },
          ],
        },
      ],
    },
    "menu",
  );
}

// Seeds the wizard from outside — used by the AI lane when a customer describes
// what they want in free text ("book iPhone 12 screen"), so they land straight
// on the right picker instead of starting from the menu.
export async function startFlowAt(
  waId: string,
  step: FlowStep,
  context: FlowContext,
  note?: string,
): Promise<void> {
  await setFlow(waId, step, context);
  await renderStep(waId, step, context, note);
}

// ─── Rendering ───────────────────────────────────────────────────────────────

type PickerConfig = {
  body: string;
  buttonLabel: string;
  header?: string;
  footer?: string;
  sectionTitle?: string;
};

// Renders one page of a paginated picker as an interactive list, always leaving
// room for the nav rows.
async function sendPicker(
  waId: string,
  step: FlowStep,
  options: PickerOption[],
  context: FlowContext,
  config: PickerConfig,
): Promise<void> {
  const page = paginate(options, context.page ?? 0);
  const rows: ListRow[] = page.items.map((option) => ({
    id: optionId(step, option.id),
    title: option.title,
    description: option.description,
  }));

  if (page.hasMore) {
    rows.push({
      id: optionId(step, NAV.more),
      title: "▸ Show more",
      description: `Page ${page.page + 1} of ${page.pageCount}`,
    });
  }
  if (prevStep(step, context)) rows.push(BACK_ROW(step));

  const footer =
    config.footer ?? (page.pageCount > 1 ? `Page ${page.page + 1} of ${page.pageCount} · or type a name` : undefined);

  await sendList(
    waId,
    {
      body: config.body,
      buttonLabel: config.buttonLabel,
      header: config.header,
      footer,
      sections: [{ title: config.sectionTitle, rows }],
    },
    `flow-${step}`,
  );
}

// Fixed (non-paginated) choice list built from plain string options.
async function sendChoices(
  waId: string,
  step: FlowStep,
  values: readonly string[],
  context: FlowContext,
  config: PickerConfig,
): Promise<void> {
  const rows: ListRow[] = values.map((value) => ({ id: optionId(step, value), title: value }));
  if (prevStep(step, context)) rows.push(BACK_ROW(step));
  await sendList(
    waId,
    {
      body: config.body,
      buttonLabel: config.buttonLabel,
      header: config.header,
      footer: config.footer,
      sections: [{ title: config.sectionTitle, rows }],
    },
    `flow-${step}`,
  );
}

function withNote(note: string | undefined, body: string): string {
  return note ? `${note}\n\n${body}` : body;
}

// The next 8 days, the same window the website's date picker offers.
function dateOptions(): PickerOption[] {
  const out: PickerOption[] = [];
  for (let offset = 0; offset < 8; offset++) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const iso = date.toISOString().split("T")[0];
    const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : formatDate(iso);
    out.push({ id: iso, title: label, description: offset <= 1 ? formatDate(iso) : undefined });
  }
  return out;
}

// Customer-facing wording for the internal status values used across admin,
// operator and technician apps.
const STATUS_LABELS: Record<string, string> = {
  pending: "Received — we'll confirm shortly",
  confirmed: "Confirmed",
  assigned: "Technician assigned",
  in_progress: "In progress",
  picked_up: "Device picked up",
  completed: "Completed",
  cancelled: "Cancelled",
  paid: "Paid",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[String(status || "").toLowerCase()] || status;
}

function buildStatusSummary(booking: TrackedBooking): string {
  const lines = [
    `*${booking.bookingCode}*`,
    "",
    `*Status:* ${statusLabel(booking.status)}`,
    `*Service:* ${SERVICE_LABELS[booking.serviceType] || booking.serviceType}`,
  ];
  if (booking.deviceLabel) lines.push(`*Device:* ${booking.deviceLabel}`);
  if (booking.quotedAmount !== null) lines.push(`*Quoted:* ${inr(booking.quotedAmount)}`);
  if (booking.scheduledDate) {
    lines.push(`*Scheduled:* ${formatDate(booking.scheduledDate)}${booking.timeSlot ? ` · ${booking.timeSlot}` : ""}`);
  }
  if (booking.location) lines.push(`*Address:* ${booking.location}`);
  if (booking.assignedRider) lines.push(`*Technician:* ${booking.assignedRider}`);
  return lines.join("\n");
}

export async function renderStep(
  waId: string,
  step: FlowStep,
  context: FlowContext,
  note?: string,
): Promise<void> {
  const device = deviceLabel(context);

  switch (step) {
    case "service":
      await showMainMenu(waId, note, context.page ?? 0);
      return;

    case "sell_category":
      await sendPicker(
        waId,
        "sell_category",
        SELL_CATEGORIES.map((category) => ({ id: category.id, title: category.title })),
        context,
        {
          body: withNote(note, "What would you like to sell? 💰"),
          buttonLabel: "Choose category",
          header: "Sell your device",
        },
      );
      return;

    case "brand": {
      const brands = await listBrands((context.catalogType || "mobile") as CatalogServiceType);
      await sendPicker(waId, "brand", brands, context, {
        body: withNote(note, "Which *brand* is your device? 📱\n\nYou can also just type the model name (e.g. _iPhone 13_)."),
        buttonLabel: "Choose brand",
        header: "Select brand",
      });
      return;
    }

    case "series": {
      const series = await listSeries(context.brandId || "");
      if (series.length === 0) {
        await sendText(waId, "Hmm, I couldn't load that brand's line-up. Type your model name and I'll find it.", "flow-series-empty");
        return;
      }
      await sendPicker(waId, "series", series, context, {
        body: withNote(note, `Which *${context.brandName}* series? 📱`),
        buttonLabel: "Choose series",
        header: context.brandName || "Select series",
      });
      return;
    }

    case "model": {
      const models = await listModels(context.seriesId || "");
      if (models.length === 0) {
        await sendText(waId, "I couldn't load models for that series. Type your model name and I'll find it.", "flow-model-empty");
        return;
      }
      await sendPicker(waId, "model", models, context, {
        body: withNote(note, `Which *${seriesLabel(context)}* model?`),
        buttonLabel: "Choose model",
        header: context.seriesName || "Select model",
      });
      return;
    }

    case "repair_category": {
      const categories = await listRepairCategories(
        context.dbServiceType === "laptop_repair" ? "laptop" : "mobile",
      );
      await sendPicker(waId, "repair_category", categories, context, {
        body: withNote(note, `What kind of problem does your *${device}* have? 🔧`),
        buttonLabel: "Choose problem",
        header: "Repair category",
      });
      return;
    }

    case "repair_service": {
      const services = await listRepairServices(
        context.dbServiceType === "laptop_repair" ? "laptop" : "mobile",
        context.repairCategoryId || "",
        context.modelId || "",
      );
      if (services.length === 0) {
        await sendText(
          waId,
          `We don't have a listed price for that on your ${device} yet — our team will confirm it. Let's carry on with the booking.`,
          "flow-repair-empty",
        );
        const skipped = { ...context, repairSubcategoryName: context.repairCategoryName, price: null, priceVisible: false };
        await startFlowAt(waId, nextStep("repair_service", skipped), skipped);
        return;
      }
      await sendPicker(waId, "repair_service", services, context, {
        body: withNote(note, `Choose the exact repair for your *${device}*.\n\nPrices below are for your model.`),
        buttonLabel: "Choose repair",
        header: context.repairCategoryName || "Repair",
      });
      return;
    }

    case "guard": {
      const guards = await listScreenGuards(context.modelId || "");
      if (guards.length === 0) {
        await sendText(
          waId,
          `We don't have screen guards listed for the ${device} yet. Our team will confirm availability — let's take your details.`,
          "flow-guard-empty",
        );
        const skipped = { ...context, guardType: "Screen guard", guardPrice: null };
        await startFlowAt(waId, nextStep("guard", skipped), skipped);
        return;
      }
      await sendPicker(waId, "guard", guards, context, {
        body: withNote(note, `Which screen guard for your *${device}*? 🛡`),
        buttonLabel: "Choose guard",
        header: "Screen guards",
      });
      return;
    }

    case "laptop_ram":
      await sendChoices(waId, "laptop_ram", RAM_OPTIONS, context, {
        body: withNote(note, "How much *RAM* does the laptop have? 💻\n\nThis helps us send the right parts."),
        buttonLabel: "Choose RAM",
        header: "Laptop specs",
      });
      return;

    case "laptop_storage":
      await sendChoices(waId, "laptop_storage", STORAGE_OPTIONS, context, {
        body: withNote(note, "What *storage* does it use?"),
        buttonLabel: "Choose storage",
        header: "Laptop specs",
      });
      return;

    case "laptop_os":
      await sendChoices(waId, "laptop_os", OS_OPTIONS, context, {
        body: withNote(note, "Which *operating system*?"),
        buttonLabel: "Choose OS",
        header: "Laptop specs",
      });
      return;

    case "cctv_service":
      await sendPicker(
        waId,
        "cctv_service",
        cctvServiceOptions.map((option) => ({ id: option.value, title: option.label })),
        context,
        {
          body: withNote(note, "What do you need for CCTV? 🎥"),
          buttonLabel: "Choose service",
          header: "CCTV",
        },
      );
      return;

    case "cctv_brand":
      await sendPicker(
        waId,
        "cctv_brand",
        cctvBrandOptions.map((brand) => ({ id: brand, title: brand })),
        context,
        {
          body: withNote(note, "Which camera *brand* do you prefer?"),
          buttonLabel: "Choose brand",
          header: "CCTV brand",
        },
      );
      return;

    case "cctv_cameras":
      await sendChoices(waId, "cctv_cameras", CAMERA_COUNT_OPTIONS, context, {
        body: withNote(note, "How many cameras do you need?"),
        buttonLabel: "Choose count",
        header: "CCTV setup",
      });
      return;

    case "cctv_location":
      await sendChoices(waId, "cctv_location", LOCATION_TYPE_OPTIONS, context, {
        body: withNote(note, "Where will they be installed?"),
        buttonLabel: "Choose location",
        header: "CCTV setup",
      });
      return;

    case "cctv_dvr":
      await sendChoices(waId, "cctv_dvr", DVR_OPTIONS, context, {
        body: withNote(note, "DVR or NVR? (tap *Not sure* and we'll advise)"),
        buttonLabel: "Choose type",
        header: "CCTV setup",
      });
      return;

    case "sell_variant": {
      const options = await getBuybackDeviceOptions(
        context.modelId || "",
        (context.catalogType || "mobile") as BuybackServiceType,
        context.brandName || "",
      );
      await sendPicker(
        waId,
        "sell_variant",
        options.variants.map((variant) => ({
          id: variant.id,
          title: variant.label || "Standard",
        })),
        context,
        {
          body: withNote(note, `Which *variant* is your ${device}?`),
          buttonLabel: "Choose variant",
          header: "Storage / variant",
        },
      );
      return;
    }

    case "sell_question": {
      const question = await currentSellQuestion(context);
      if (!question) {
        // No condition questions configured for this category — quote on the
        // variant's base price alone rather than showing an empty quote.
        await startFlowAt(waId, "sell_quote", await recomputeSellQuote(context), note);
        return;
      }
      const selected = context.sellAnswers?.[question.id] ?? [];
      // Eight options max, leaving room for the Done/Back rows within the
      // ten-row list limit.
      const rows: ListRow[] = question.options.slice(0, 8).map((option) => ({
        id: optionId("sell_question", option.id),
        title: selected.includes(option.id) ? `✅ ${option.label}` : option.label,
      }));
      if (question.type === "multi") {
        rows.push({ id: optionId("sell_question", NAV.skip), title: "➡️ Done / none" });
      }
      rows.push(BACK_ROW("sell_question"));

      await sendList(
        waId,
        {
          body: withNote(
            note,
            question.type === "multi"
              ? `${question.title}\n\n_Tap each one that applies, then tap Done._`
              : question.title,
          ),
          buttonLabel: "Choose",
          header: "Device condition",
          sections: [{ rows }],
        },
        "flow-sell_question",
      );
      return;
    }

    case "sell_quote": {
      const quote = context.sellQuote ?? null;
      const body =
        quote === null
          ? `We don't have a live price for the *${device}* yet — our team will quote it after a quick inspection. Shall we arrange a free pickup?`
          : [
              `Here's your offer for the *${device}*${context.sellVariantLabel ? ` (${context.sellVariantLabel})` : ""}:`,
              "",
              `💰 *${inr(quote)}*`,
              "",
              "_Final amount is confirmed when our executive inspects the device. Pickup is free._",
            ].join("\n");

      await sendButtons(
        waId,
        withNote(note, body),
        [
          { id: optionId("sell_quote", "book"), title: "Book free pickup" },
          { id: optionId("sell_quote", "redo"), title: "Change answers" },
          { id: NAV.menu, title: "Main menu" },
        ],
        "flow-sell_quote",
      );
      return;
    }

    case "notes": {
      const prompt =
        context.kind === "repair"
          ? "Anything else we should know about the problem? 📝\n\nType it below, or tap *Skip*."
          : context.kind === "sell"
            ? "Anything we should know about the device? Type it below, or tap *Skip*."
            : "Tell us briefly what you need 📝\n\nType it below, or tap *Skip*.";
      await sendButtons(
        waId,
        withNote(note, prompt),
        [
          { id: optionId("notes", NAV.skip), title: "Skip" },
          { id: optionId("notes", NAV.back), title: "⬅️ Back" },
        ],
        "flow-notes",
      );
      return;
    }

    case "name": {
      // The website pre-fills the details step from the customer's saved
      // profile. WhatsApp has no login, so we offer back the details from this
      // number's last booking — one tap instead of five questions.
      if (!context.name) {
        const saved = await getSavedProfile(waId);
        if (saved?.name && saved.address) {
          await sendButtons(
            waId,
            withNote(
              note,
              [
                "Welcome back! 👋 Shall I use the details from your last booking?",
                "",
                `*${saved.name}* · ${saved.phone}`,
                `${[saved.address, saved.city, saved.pincode].filter(Boolean).join(", ")}`,
              ].join("\n"),
            ),
            [
              { id: optionId("name", "__saved"), title: "Use these details" },
              { id: optionId("name", "__new"), title: "Enter new details" },
            ],
            "flow-name-saved",
          );
          return;
        }
      }
      await sendText(waId, withNote(note, "What's your *name*? 🙂"), "flow-name");
      return;
    }

    case "track_code": {
      const recent = await listRecentBookings(waId, 5);
      if (recent.length > 0) {
        await sendList(
          waId,
          {
            body: withNote(note, "Here are your recent orders. Tap one to see its status, or type a booking ID."),
            buttonLabel: "Choose an order",
            header: "My orders",
            sections: [
              {
                rows: [
                  ...recent
                    .filter((booking) => booking.bookingCode)
                    .map<ListRow>((booking) => ({
                      id: optionId("track_code", booking.bookingCode),
                      title: booking.bookingCode,
                      description: `${SERVICE_LABELS[booking.serviceType] || booking.serviceType} · ${statusLabel(booking.status)}`,
                    })),
                  MENU_ROW,
                ],
              },
            ],
          },
          "flow-track",
        );
        return;
      }
      await sendText(
        waId,
        withNote(note, "Send me your *booking ID* (it looks like `MOB-260730-ABC123`) and I'll pull up the status."),
        "flow-track-empty",
      );
      return;
    }

    case "manage_booking": {
      const booking = context.bookingCode ? await findBookingByCode(context.bookingCode, waId) : null;
      if (!booking) {
        await sendText(
          waId,
          withNote(note, "I couldn't find that booking on this number. Double-check the ID, or type *menu*."),
          "flow-manage-missing",
        );
        return;
      }
      const body = buildStatusSummary(booking);
      if (!isSelfServiceEditable(booking.status)) {
        await sendButtons(
          waId,
          withNote(note, `${body}\n\nNeed a change? Our team can help.`),
          [
            { id: NAV.agent, title: "Talk to our team" },
            { id: NAV.menu, title: "Main menu" },
          ],
          "flow-manage-locked",
        );
        return;
      }
      await sendButtons(
        waId,
        withNote(note, body),
        [
          { id: optionId("manage_booking", "reschedule"), title: "📅 Reschedule" },
          { id: optionId("manage_booking", "cancel"), title: "❌ Cancel order" },
          { id: NAV.menu, title: "🏠 Main menu" },
        ],
        "flow-manage",
      );
      return;
    }

    case "reschedule_date":
      await sendPicker(waId, "reschedule_date", dateOptions(), context, {
        body: withNote(note, `Pick a new date for *${context.bookingCode}* 📅`),
        buttonLabel: "Choose a day",
        header: "Reschedule",
      });
      return;

    case "reschedule_slot":
      await sendChoices(waId, "reschedule_slot", TIME_SLOTS, context, {
        body: withNote(note, `And the time slot for ${formatDate(context.scheduledDate)}? ⏰`),
        buttonLabel: "Choose a slot",
        header: "Reschedule",
      });
      return;

    case "cancel_confirm":
      await sendButtons(
        waId,
        withNote(note, `Are you sure you want to cancel *${context.bookingCode}*?`),
        [
          { id: optionId("cancel_confirm", "yes"), title: "Yes, cancel it" },
          { id: optionId("cancel_confirm", "no"), title: "No, keep it" },
        ],
        "flow-cancel-confirm",
      );
      return;

    case "phone":
      await sendButtons(
        waId,
        withNote(note, "What's the best *phone number* to reach you on?"),
        [
          { id: optionId("phone", NAV.skip), title: "Use this number" },
          { id: optionId("phone", NAV.back), title: "⬅️ Back" },
        ],
        "flow-phone",
      );
      return;

    case "address":
      await sendText(
        waId,
        withNote(note, "What's your *address*? 🏠\n\nHouse/flat, street and landmark — we come to you."),
        "flow-address",
      );
      return;

    case "city":
      await sendText(waId, withNote(note, "Which *city / area* are you in?"), "flow-city");
      return;

    case "pincode":
      await sendText(waId, withNote(note, "And your 6-digit *pincode*? 📮"), "flow-pincode");
      return;

    case "date":
      await sendPicker(waId, "date", dateOptions(), context, {
        body: withNote(
          note,
          context.kind === "sell" ? "When should we pick it up? 📅" : "When would you like our technician to visit? 📅",
        ),
        buttonLabel: "Choose a day",
        header: "Pick a date",
        footer: "Or type a date like 2 Aug",
      });
      return;

    case "slot":
      await sendChoices(waId, "slot", TIME_SLOTS, context, {
        body: withNote(note, `Great — ${formatDate(context.scheduledDate)}. Which *time slot* suits you? ⏰`),
        buttonLabel: "Choose a slot",
        header: "Pick a time",
      });
      return;

    case "confirm":
      await sendButtons(
        waId,
        withNote(note, buildConfirmSummary(context)),
        [
          { id: optionId("confirm", "yes"), title: "✅ Confirm" },
          { id: optionId("confirm", "edit"), title: "✏️ Change something" },
          { id: NAV.cancel, title: "❌ Cancel" },
        ],
        "flow-confirm",
      );
      return;

    default:
      await showMainMenu(waId, note);
  }
}

// ─── Sell helpers ────────────────────────────────────────────────────────────

async function sellQuestions(context: FlowContext): Promise<SellQuestion[]> {
  if (!context.modelId) return [];
  const options = await getBuybackDeviceOptions(
    context.modelId,
    (context.catalogType || "mobile") as BuybackServiceType,
    context.brandName || "",
  );
  return options.questions;
}

async function currentSellQuestion(context: FlowContext): Promise<SellQuestion | null> {
  const questions = await sellQuestions(context);
  const index = context.sellQuestionIndex ?? 0;
  return questions[index] ?? null;
}

// Recomputes the quote with the SAME engine the website uses — never an
// approximation, and never cached from an earlier answer set.
async function recomputeSellQuote(context: FlowContext): Promise<FlowContext> {
  if (!context.modelId) return context;
  const estimate = await computeBuybackEstimate(
    context.modelId,
    (context.catalogType || "mobile") as BuybackServiceType,
    context.brandName || "",
    context.sellVariantId ?? null,
    context.sellAnswers ?? {},
  );
  if (!estimate) return { ...context, sellQuote: undefined, sellPriced: false };
  return {
    ...context,
    sellBasePrice: estimate.basePrice,
    sellQuote: estimate.finalQuote,
    sellVariantLabel: context.sellVariantLabel || estimate.variantLabel,
    sellPriced: true,
  };
}

// ─── Transitions ─────────────────────────────────────────────────────────────

export type FlowInput = {
  /** Raw text the customer typed (empty for taps). */
  text: string;
  /** Interactive id of a tapped row/button, if any. */
  interactiveId: string | null;
};

type Transition = { step: FlowStep; context: FlowContext; note?: string };

// The sender id is E.164 without '+' ("919876543210"); store it the way the
// website stores phone numbers so admin search and dedupe behave the same.
function formatWaPhone(waId: string): string {
  const digits = String(waId || "").replace(/\D/g, "");
  return digits.length > 10 ? `+${digits}` : digits;
}

// Applies one tapped option to the wizard. Returns where to go next.
async function applyOption(
  waId: string,
  step: FlowStep,
  value: string,
  incoming: FlowContext,
): Promise<Transition> {
  const context = clearDownstream(step, incoming);
  delete context.page;

  switch (step) {
    case "service": {
      if (value === "track") {
        return { step: "track_code", context: { ...context, kind: "track" } };
      }
      const entry = SERVICE_MENU.find((option) => option.id === value);
      if (!entry) return { step: "service", context };
      const seeded: FlowContext = {
        ...context,
        kind: entry.kind,
        dbServiceType: entry.dbServiceType,
        catalogType: entry.catalogType,
      };
      return { step: sequenceFor(seeded)[0] ?? "confirm", context: seeded };
    }

    case "sell_category": {
      const category = SELL_CATEGORIES.find((option) => option.id === value);
      if (!category) return { step: "sell_category", context };
      const seeded = { ...context, catalogType: category.id as FlowContext["catalogType"] };
      return { step: nextStep("sell_category", seeded), context: seeded };
    }

    case "brand": {
      const brands = await listBrands((context.catalogType || "mobile") as CatalogServiceType);
      const brand = brands.find((option) => option.id === value);
      if (!brand) return { step: "brand", context };
      const seeded = { ...context, brandId: brand.id, brandName: brand.title };
      return { step: nextStep("brand", seeded), context: seeded };
    }

    case "series": {
      const series = await listSeries(context.brandId || "");
      const match = series.find((option) => option.id === value);
      if (!match) return { step: "series", context };
      const seeded = { ...context, seriesId: match.id, seriesName: match.title };
      return { step: nextStep("series", seeded), context: seeded };
    }

    case "model": {
      const models = await listModels(context.seriesId || "");
      const match = models.find((option) => option.id === value);
      if (!match) return { step: "model", context };
      return applyModel({ ...context, modelId: match.id, modelName: match.title });
    }

    case "repair_category": {
      const categories = await listRepairCategories(
        context.dbServiceType === "laptop_repair" ? "laptop" : "mobile",
      );
      const match = categories.find((option) => option.id === value);
      if (!match) return { step: "repair_category", context };
      const seeded = { ...context, repairCategoryId: match.id, repairCategoryName: match.title };
      return { step: nextStep("repair_category", seeded), context: seeded };
    }

    case "repair_service": {
      const services = await listRepairServices(
        context.dbServiceType === "laptop_repair" ? "laptop" : "mobile",
        context.repairCategoryId || "",
        context.modelId || "",
      );
      const match = services.find((option) => option.id === value);
      if (!match) return { step: "repair_service", context };
      const seeded = {
        ...context,
        repairSubcategoryId: match.id,
        repairSubcategoryName: match.title,
        price: match.price,
        priceVisible: match.priceVisible,
      };
      const note =
        match.priceVisible && match.price
          ? `*${match.title}* for your ${deviceLabel(seeded)} — *${inr(match.price)}*.`
          : `*${match.title}* noted. Our team will confirm the exact price.`;
      return { step: nextStep("repair_service", seeded), context: seeded, note };
    }

    case "guard": {
      const guards = await listScreenGuards(context.modelId || "");
      const match = guards.find((option) => option.id === value);
      if (!match) return { step: "guard", context };
      const seeded = { ...context, guardType: match.guardType, guardPrice: match.price };
      const note = match.price ? `*${match.title}* — *${inr(match.price)}*.` : `*${match.title}* selected.`;
      return { step: nextStep("guard", seeded), context: seeded, note };
    }

    case "laptop_ram": {
      const seeded = { ...context, laptopRam: value };
      return { step: nextStep("laptop_ram", seeded), context: seeded };
    }
    case "laptop_storage": {
      const seeded = { ...context, laptopStorage: value };
      return { step: nextStep("laptop_storage", seeded), context: seeded };
    }
    case "laptop_os": {
      const seeded = { ...context, laptopOs: value };
      return { step: nextStep("laptop_os", seeded), context: seeded };
    }

    case "cctv_service": {
      const seeded = { ...context, cctvService: value, cctvServiceLabel: getCctvServiceLabel(value) };
      return { step: nextStep("cctv_service", seeded), context: seeded };
    }
    case "cctv_brand": {
      const seeded = { ...context, cctvBrand: value };
      return { step: nextStep("cctv_brand", seeded), context: seeded };
    }
    case "cctv_cameras": {
      const seeded = { ...context, cctvCameraCount: value };
      return { step: nextStep("cctv_cameras", seeded), context: seeded };
    }
    case "cctv_location": {
      const seeded = { ...context, cctvLocationType: value };
      return { step: nextStep("cctv_location", seeded), context: seeded };
    }
    case "cctv_dvr": {
      const seeded = { ...context, cctvDvrPreference: value };
      return { step: nextStep("cctv_dvr", seeded), context: seeded };
    }

    case "sell_variant": {
      const options = await getBuybackDeviceOptions(
        context.modelId || "",
        (context.catalogType || "mobile") as BuybackServiceType,
        context.brandName || "",
      );
      const variant = options.variants.find((option) => option.id === value);
      if (!variant) return { step: "sell_variant", context };
      const seeded: FlowContext = {
        ...context,
        sellVariantId: variant.id,
        sellVariantLabel: variant.label || "Standard",
        sellAnswers: {},
        sellQuestionIndex: 0,
      };
      return { step: nextStep("sell_variant", seeded), context: seeded };
    }

    case "sell_question": {
      const question = await currentSellQuestion(context);
      if (!question) return { step: "sell_quote", context: await recomputeSellQuote(context) };

      const answers: Record<string, string[]> = { ...(context.sellAnswers ?? {}) };
      const current = answers[question.id] ?? [];

      if (value === NAV.skip) {
        // "Done" on a multi-select question — move on with whatever is ticked.
        answers[question.id] = current;
      } else if (question.type === "multi") {
        answers[question.id] = current.includes(value)
          ? current.filter((id) => id !== value)
          : [...current, value];
        // Stay on the same question so more options can be ticked.
        return { step: "sell_question", context: { ...context, sellAnswers: answers } };
      } else {
        answers[question.id] = [value];
      }

      const questions = await sellQuestions(context);
      const nextIndex = (context.sellQuestionIndex ?? 0) + 1;
      const seeded: FlowContext = { ...context, sellAnswers: answers, sellQuestionIndex: nextIndex };
      if (nextIndex < questions.length) return { step: "sell_question", context: seeded };
      return { step: "sell_quote", context: await recomputeSellQuote(seeded) };
    }

    case "sell_quote": {
      if (value === "redo") {
        const seeded = { ...context, sellQuestionIndex: 0, sellAnswers: {} };
        return { step: "sell_question", context: seeded };
      }
      // "Book free pickup". Not routed through nextStep: recomputing the quote
      // can flip sellPriced to false, which drops sell_quote out of the sequence
      // — and an unknown step would restart the journey. Details always begin at
      // the name step in every sell sequence.
      return { step: context.editing ? "confirm" : "name", context };
    }

    case "notes": {
      if (value === NAV.skip) return { step: nextStep("notes", context), context };
      return { step: "notes", context };
    }

    case "name": {
      if (value === "__saved") {
        const saved = await getSavedProfile(waId);
        if (!saved) return { step: "name", context, note: "Let's start fresh — what's your name?" };
        const seeded: FlowContext = {
          ...context,
          name: saved.name,
          phone: saved.phone || formatWaPhone(waId),
          address: saved.address,
          city: saved.city,
          pincode: saved.pincode,
        };
        // Details are complete — jump straight to scheduling (or back to the
        // review screen if the customer is editing).
        return { step: context.editing ? "confirm" : "date", context: seeded, note: "Great, using your saved details ✅" };
      }
      return { step: "name", context, note: "No problem — what's your *name*?" };
    }

    case "phone": {
      if (value === NAV.skip) {
        // "Use this number" — the WhatsApp sender id IS a verified phone number.
        const seeded = { ...context, phone: formatWaPhone(waId) };
        return { step: nextStep("phone", seeded), context: seeded };
      }
      return { step: "phone", context };
    }

    case "manage_booking": {
      if (value === "reschedule") return { step: "reschedule_date", context };
      if (value === "cancel") return { step: "cancel_confirm", context };
      return { step: "manage_booking", context };
    }

    case "track_code":
      // Tapping one of the recent orders.
      return { step: "manage_booking", context: { ...context, bookingCode: value } };

    case "reschedule_date":
      return { step: "reschedule_slot", context: { ...context, scheduledDate: value } };

    case "reschedule_slot": {
      const seeded = { ...context, timeSlot: value };
      const result = await rescheduleBooking(
        seeded.bookingCode || "",
        waId,
        seeded.scheduledDate || "",
        value,
      );
      if (!result.ok) {
        return {
          step: "manage_booking",
          context: seeded,
          note:
            result.reason === "locked"
              ? "That order is already being worked on, so I can't move it here — our team will help."
              : "I couldn't reschedule that just now. Our team will sort it out.",
        };
      }
      return {
        step: "manage_booking",
        context: seeded,
        note: `Done ✅ Rescheduled to *${formatDate(seeded.scheduledDate)} · ${value}*.`,
      };
    }

    case "cancel_confirm": {
      if (value !== "yes") return { step: "manage_booking", context, note: "No problem — keeping it as it is." };
      const result = await cancelBooking(context.bookingCode || "", waId);
      if (!result.ok) {
        return {
          step: "manage_booking",
          context,
          note:
            result.reason === "locked"
              ? "That order has already moved ahead — our team will help you with it."
              : "I couldn't cancel that just now. Our team will follow up.",
        };
      }
      return {
        step: "manage_booking",
        context,
        note: `Cancelled *${context.bookingCode}*. Sorry to see it go — we're here whenever you need us.`,
      };
    }

    case "date": {
      const seeded = { ...context, scheduledDate: value };
      return { step: nextStep("date", seeded), context: seeded };
    }
    case "slot": {
      const seeded = { ...context, timeSlot: value };
      return { step: nextStep("slot", seeded), context: seeded };
    }

    case "confirm":
      // Handled by the caller (it performs the booking / opens the edit list).
      return { step: "confirm", context };

    default:
      return { step, context };
  }
}

// After a model is chosen the sell branch has to look up whether the model is
// even priced, so it can skip the variant/condition steps for unpriced models
// (the website shows a "we'll quote you" CTA in the same situation).
export async function applyModel(context: FlowContext): Promise<Transition> {
  if (context.kind !== "sell") {
    return { step: nextStep("model", context), context };
  }
  const options = await getBuybackDeviceOptions(
    context.modelId || "",
    (context.catalogType || "mobile") as BuybackServiceType,
    context.brandName || "",
  );
  if (!options.priced) {
    const seeded: FlowContext = { ...context, sellPriced: false, sellQuote: undefined };
    return {
      step: nextStep("model", seeded),
      context: seeded,
      note: "We don't have a live price for that model yet — our team will quote it after inspection.",
    };
  }
  const seeded: FlowContext = { ...context, sellPriced: true, sellAnswers: {}, sellQuestionIndex: 0 };
  // A single unlabelled variant needs no question — take it and move on.
  if (options.variants.length === 1) {
    const only = options.variants[0];
    const withVariant = { ...seeded, sellVariantId: only.id, sellVariantLabel: only.label || "Standard" };
    return { step: nextStep("sell_variant", withVariant), context: withVariant };
  }
  return { step: nextStep("model", seeded), context: seeded };
}

// Free text typed at a step: either the answer to a text field, or a device
// name typed at a picker (which jumps straight to that model).
async function applyText(
  waId: string,
  step: FlowStep,
  text: string,
  context: FlowContext,
): Promise<Transition> {
  const value = text.trim();

  switch (step) {
    case "name":
      if (value.length < 2) {
        return { step: "name", context, note: "That name looks a bit short — what should we call you?" };
      }
      return { step: nextStep("name", { ...context, name: value }), context: { ...context, name: value } };

    case "phone":
      if (!isValidPhoneNumber(value)) {
        return { step: "phone", context, note: "That doesn't look like a valid phone number." };
      }
      return { step: nextStep("phone", { ...context, phone: value }), context: { ...context, phone: value } };

    case "address":
      if (value.length < 6) {
        return { step: "address", context, note: "Could you share a bit more of the address?" };
      }
      return {
        step: nextStep("address", { ...context, address: value }),
        context: { ...context, address: value },
      };

    case "city":
      if (value.length < 2) return { step: "city", context, note: "Which city or area is that?" };
      return { step: nextStep("city", { ...context, city: value }), context: { ...context, city: value } };

    case "pincode":
      if (!isValidPincode(value)) {
        return { step: "pincode", context, note: "A pincode is 6 digits — could you check it?" };
      }
      return {
        step: nextStep("pincode", { ...context, pincode: value }),
        context: { ...context, pincode: value },
      };

    case "notes":
      return { step: nextStep("notes", { ...context, notes: value }), context: { ...context, notes: value } };

    case "track_code": {
      const code = value.toUpperCase();
      const booking = await findBookingByCode(code, waId);
      if (!booking) {
        return {
          step: "track_code",
          context,
          note: `I couldn't find *${code}* on this number. Check the ID, or tap one of your orders below.`,
        };
      }
      return { step: "manage_booking", context: { ...context, bookingCode: booking.bookingCode } };
    }

    // Typing a device name at any catalog picker jumps straight to that model —
    // the escape hatch for customers who don't want to page through 567 models.
    case "brand":
    case "series":
    case "model": {
      const matches = await searchDevices(value, (context.catalogType || "mobile") as CatalogServiceType, 1);
      const match = matches[0];
      if (!match) {
        return { step, context, note: `I couldn't find "${value}" in our catalogue. Try the list below.` };
      }
      // Carry the brand/series ids too, so Back from here still works.
      const seeded: FlowContext = {
        ...context,
        brandId: match.brandId ?? undefined,
        brandName: match.brandName,
        seriesId: match.seriesId ?? undefined,
        seriesName: match.seriesName,
        modelId: match.modelId,
        modelName: match.modelName,
      };
      const transition = await applyModel(seeded);
      return { ...transition, note: transition.note ?? `Found it — *${match.label}* ✅` };
    }

    case "date": {
      const parsed = parseTypedDate(value);
      if (!parsed) {
        return { step: "date", context, note: "I didn't catch that date — pick one from the list below." };
      }
      return {
        step: nextStep("date", { ...context, scheduledDate: parsed }),
        context: { ...context, scheduledDate: parsed },
      };
    }

    default:
      // Any other step is tap-only: re-render it rather than guessing.
      return { step, context, note: "Please pick one of the options below 👇" };
  }
}

// ─── The step the customer can jump back to from the confirm screen ──────────

const EDITABLE_FIELDS: Array<{ id: string; title: string; step: FlowStep }> = [
  { id: "date", title: "📅 Date", step: "date" },
  { id: "slot", title: "⏰ Time slot", step: "slot" },
  { id: "address", title: "🏠 Address", step: "address" },
  { id: "pincode", title: "📮 Pincode", step: "pincode" },
  { id: "name", title: "🙂 Name", step: "name" },
  { id: "phone", title: "📞 Phone", step: "phone" },
  { id: "notes", title: "📝 Notes", step: "notes" },
];

async function sendEditMenu(waId: string, context: FlowContext): Promise<void> {
  const rows: ListRow[] = EDITABLE_FIELDS.map((field) => ({
    id: optionId("confirm", `edit:${field.id}`),
    title: field.title,
  }));
  rows.push({ id: optionId("confirm", "review"), title: "⬅️ Back to review" });
  rows.push({ id: NAV.restart, title: "🔄 Start over" });

  await sendList(
    waId,
    {
      body: "What would you like to change?",
      buttonLabel: "Change",
      header: "Edit booking",
      sections: [{ rows }],
    },
    "flow-edit",
  );
}

// ─── Public entry point ──────────────────────────────────────────────────────

// Handles one inbound message for a customer who is inside the wizard.
// Returns false when the message isn't ours to handle (so the caller can fall
// back to the AI lane).
export async function handleFlowMessage(
  waId: string,
  currentStep: FlowStep,
  storedContext: FlowContext,
  input: FlowInput,
): Promise<boolean> {
  const parsed = parseId(input.interactiveId);

  // Global navigation works from anywhere, including from a stale message.
  if (parsed?.kind === "nav") {
    switch (parsed.value) {
      case NAV.menu:
      case NAV.restart:
        await showMainMenu(waId);
        return true;
      case NAV.cancel:
        await clearFlow(waId);
        await sendText(
          waId,
          `No problem — I've cancelled that. Type *menu* whenever you'd like to start again, or call us on ${supportPhoneDisplay}.`,
          "flow-cancel",
        );
        return true;
      default:
        return false; // e.g. nav:agent — the router owns handoff.
    }
  }

  // A tap on an older message rewinds to that step and re-answers it, clearing
  // everything that was derived from the old answer.
  const step: FlowStep = parsed?.kind === "option" ? parsed.step : currentStep;
  const context: FlowContext = { ...storedContext };

  // Back / pagination are per-step and handled before the step's own logic.
  if (parsed?.kind === "option") {
    if (parsed.value === NAV.back) {
      const previous = prevStep(step, context);
      const target = previous ?? "service";
      const rewound = { ...context, page: 0, editing: false };
      await setFlow(waId, target, rewound);
      await renderStep(waId, target, rewound);
      return true;
    }
    if (parsed.value === NAV.more) {
      const paged = { ...context, page: (context.page ?? 0) + 1 };
      await setFlow(waId, step, paged);
      await renderStep(waId, step, paged);
      return true;
    }
  }

  // The confirm screen owns booking submission and the edit menu.
  if (step === "confirm" && parsed?.kind === "option") {
    return handleConfirm(waId, parsed.value, context);
  }

  const transition =
    parsed?.kind === "option"
      ? await applyOption(waId, step, parsed.value, context)
      : await applyText(waId, step, input.text, context);

  const nextContext = { ...transition.context };
  // Leaving an edited field returns to the review screen.
  if (nextContext.editing && transition.step === "confirm") delete nextContext.editing;
  if (transition.step !== step) delete nextContext.page;

  await setFlow(waId, transition.step, nextContext);
  await renderStep(waId, transition.step, nextContext, transition.note);
  return true;
}

async function handleConfirm(waId: string, value: string, context: FlowContext): Promise<boolean> {
  if (value === "edit") {
    await sendEditMenu(waId, context);
    return true;
  }
  if (value === "review") {
    await renderStep(waId, "confirm", context);
    return true;
  }
  if (value.startsWith("edit:")) {
    const field = EDITABLE_FIELDS.find((entry) => entry.id === value.slice("edit:".length));
    if (!field) {
      await renderStep(waId, "confirm", context);
      return true;
    }
    const editing = { ...context, editing: true, page: 0 };
    await setFlow(waId, field.step, editing);
    await renderStep(waId, field.step, editing);
    return true;
  }
  if (value !== "yes") {
    await renderStep(waId, "confirm", context);
    return true;
  }

  // Already booked from this session — a redelivered tap must not book twice.
  if (context.bookedCode) {
    await sendText(
      waId,
      `You're all set — booking *${context.bookedCode}* is already confirmed. Type *menu* for anything else.`,
      "flow-already-booked",
    );
    return true;
  }

  const result = await submitBooking(waId, context);
  if (!result.ok) {
    await sendText(
      waId,
      `Sorry — something went wrong saving that booking. Please try again, or call us on ${supportPhoneDisplay} and we'll sort it out right away.`,
      "flow-book-failed",
    );
    await renderStep(waId, "confirm", context);
    return true;
  }

  await setFlow(waId, "manage_booking", { ...context, bookedCode: result.bookingCode, bookingCode: result.bookingCode });
  await sendText(
    waId,
    [
      "*Booking confirmed!* ✅",
      "",
      result.bookingCode ? `Your booking ID is *${result.bookingCode}*.` : "",
      `We'll call you on ${context.phone} to confirm the visit.`,
      "",
      "Type *track* anytime to check its status, or *menu* to book something else.",
    ]
      .filter(Boolean)
      .join("\n"),
    "flow-booked",
  );
  return true;
}

