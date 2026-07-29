import Anthropic from "@anthropic-ai/sdk";

import { sendLeadEmail } from "@/src/lib/email/resend";
import type { LeadPayload } from "@/src/lib/leads/types";
import { companyName, supportEmail, supportPhoneDisplay } from "@/src/lib/company";

import {
  computeBuybackEstimate,
  createBuybackPickup,
  createRepairBooking,
  createServiceBooking,
  getBuybackDeviceOptions,
  getRepairPricing,
  searchDevices,
  type RepairServiceType,
} from "./booking";
import type { BuybackServiceType } from "@/src/lib/data/buyback";
import type { CatalogServiceType } from "@/src/lib/data/catalog";
import { notifyTeamNewLead } from "./notify";
import { setLastBookingCode, setState, type SimpleMessage } from "./store";

// The conversational brain of the WhatsApp bot. It mirrors the website: it reads
// the SAME catalog + pricing and creates the SAME booking records (order_source
// "whatsapp") that show up in admin Order Management. It can:
//   • identify a device and quote EXACT repair prices from the DB
//   • book a repair, a buyback pickup, and CCTV/IT/desktop service enquiries
// Every booking pings the team (email + WhatsApp alert) like a website lead.

const MODEL = "claude-opus-4-8";

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_PROMPT = `You are the WhatsApp assistant for ${companyName}, a doorstep device repair, buyback and IT-services business in Bengaluru, India.

STYLE: This is WhatsApp — keep replies short (a few lines), warm, and clear. Light emoji is fine. Ask for one or two things at a time, not a long form. Use *bold* (single asterisks) for key values like prices and booking IDs.

WHAT YOU CAN DO (use the tools — never guess prices or make up a booking):
1. Repair booking (mobile & laptop): identify the device with search_devices, confirm the exact model with the customer, then call get_repair_prices to quote the EXACT price from our database. To book, collect name, phone, full address + pincode in Bengaluru, and a preferred date + time, then call book_repair.
2. Buyback / sell: use search_devices to find the model, then get_sell_options to get its storage variants + condition questions. Ask the customer the variant and each condition question (present the option labels), then call get_sell_quote with their choices to get the EXACT quote (same as the website). Share the quote, then call book_buyback_pickup (pass quotedAmount) to arrange a free pickup. Tell them the final amount is confirmed at inspection. If a model has no configured price, book the pickup and say the team will confirm the price.
3. CCTV / IT support / desktop assembly / managed IT / WiFi: collect what they need + name, phone, address, preferred time, then call book_service.
4. Pricing questions: use search_devices + get_repair_prices and quote the exact price. If a device or issue isn't in the catalog, say the team will confirm and offer to note their details.

RULES:
- Quote ONLY prices returned by get_repair_prices — never estimate or round. Prices are in Indian Rupees (₹).
- Confirm the device and the specific issue before booking a repair.
- Always read back the booking ID after a successful booking.
- ${companyName} serves Bengaluru with doorstep pickup. Always collect an address + pincode for a booking.
- If a tool fails or you're unsure, be honest and share support contact: ${supportPhoneDisplay} / ${supportEmail}.
- Don't promise timelines, warranty terms, or policies you don't know — say the team will confirm.

Keep every reply under about 900 characters.`;

const tools: Anthropic.Tool[] = [
  {
    name: "search_devices",
    description:
      "Find matching device models in the Looplic catalog from a free-text name like 'iPhone 12' or 'Galaxy S21'. Returns candidate models with modelId and brandName. Use serviceType 'mobile'/'laptop' for repairs; buyback also supports 'tablet','smartwatch','audio'.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Device name the customer mentioned" },
        serviceType: {
          type: "string",
          enum: ["mobile", "laptop", "tablet", "smartwatch", "audio"],
          description: "Device category. Repairs are only mobile/laptop.",
        },
      },
      required: ["query", "serviceType"],
    },
  },
  {
    name: "get_repair_prices",
    description:
      "Get the exact, model-specific repair services and prices for a modelId returned by search_devices. Use this to quote prices — never estimate.",
    input_schema: {
      type: "object",
      properties: {
        modelId: { type: "string", description: "modelId from search_devices" },
        serviceType: { type: "string", enum: ["mobile", "laptop"] },
      },
      required: ["modelId", "serviceType"],
    },
  },
  {
    name: "book_repair",
    description:
      "Create a real repair booking. Call only after confirming the exact model, the specific repair (subcategory), and collecting name, phone, address+pincode, and a preferred date + time slot.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        modelId: { type: "string", description: "from search_devices" },
        serviceType: { type: "string", enum: ["mobile", "laptop"] },
        repairSubcategoryId: { type: "string", description: "subcategoryId from get_repair_prices" },
        repairCategoryId: { type: "string", description: "categoryId from get_repair_prices" },
        issue: { type: "string", description: "Short description of the repair (e.g. 'Screen Replacement')" },
        address: { type: "string", description: "Full pickup address in Bengaluru" },
        pincode: { type: "string" },
        scheduledDate: { type: "string", description: "Preferred date (as the customer said it)" },
        timeSlot: { type: "string", description: "Preferred time slot" },
      },
      required: ["name", "phone", "modelId", "serviceType", "repairSubcategoryId", "address", "scheduledDate", "timeSlot"],
    },
  },
  {
    name: "book_service",
    description:
      "Create a real service booking for CCTV, IT support, desktop assembly, managed IT, or WiFi network installation (non-device services). Collect name, phone, address+pincode, preferred time, and what they need first.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        serviceType: {
          type: "string",
          enum: ["cctv", "it_support", "desktop_assembly", "managed_it_services", "wifi_network_installation"],
        },
        details: { type: "string", description: "What the customer needs (e.g. '4 CCTV cameras, outdoor')" },
        address: { type: "string" },
        pincode: { type: "string" },
        scheduledDate: { type: "string" },
        timeSlot: { type: "string" },
      },
      required: ["name", "phone", "serviceType", "address"],
    },
  },
  {
    name: "get_sell_options",
    description:
      "For a device the customer wants to SELL, get the storage variants and the condition questions to ask. Use the modelId + brandName from search_devices. Present the variant choices and each question's options to the customer, then call get_sell_quote with their answers.",
    input_schema: {
      type: "object",
      properties: {
        modelId: { type: "string" },
        deviceType: { type: "string", enum: ["mobile", "laptop", "tablet", "smartwatch", "audio"] },
        brandName: { type: "string", description: "brandName from search_devices (needed for Apple vs Android pricing)" },
      },
      required: ["modelId", "deviceType", "brandName"],
    },
  },
  {
    name: "get_sell_quote",
    description:
      "Compute the EXACT buyback quote (same as the website) for the customer's chosen variant + condition answers. Pass the variantId and, for each question, the chosen optionId(s) from get_sell_options.",
    input_schema: {
      type: "object",
      properties: {
        modelId: { type: "string" },
        deviceType: { type: "string", enum: ["mobile", "laptop", "tablet", "smartwatch", "audio"] },
        brandName: { type: "string" },
        variantId: { type: "string", description: "chosen variant id from get_sell_options (use the only one if unlabelled)" },
        answers: {
          type: "array",
          description: "One entry per answered question",
          items: {
            type: "object",
            properties: {
              questionId: { type: "string" },
              optionIds: { type: "array", items: { type: "string" } },
            },
            required: ["questionId", "optionIds"],
          },
        },
      },
      required: ["modelId", "deviceType", "brandName", "variantId", "answers"],
    },
  },
  {
    name: "book_buyback_pickup",
    description:
      "Arrange a free buyback pickup after quoting. Pass the quotedAmount from get_sell_quote and the chosen variant label. The final price is confirmed at inspection.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        brandName: { type: "string" },
        modelName: { type: "string" },
        variant: { type: "string", description: "Chosen variant label, e.g. '128 GB'" },
        deviceType: { type: "string", enum: ["mobile", "laptop", "tablet", "smartwatch", "audio"] },
        quotedAmount: { type: "number", description: "The estimate from get_sell_quote (₹), if one was given" },
        address: { type: "string" },
        pickupDate: { type: "string" },
        timeSlot: { type: "string" },
      },
      required: ["name", "phone", "brandName", "modelName"],
    },
  },
];

// Fires the same team notifications a website lead does, so staff hear about a
// WhatsApp booking immediately (the booking row itself already shows in admin).
async function alertTeam(payload: LeadPayload): Promise<void> {
  await Promise.all([
    sendLeadEmail(payload).catch((e) => console.error("[whatsapp:ai] lead email failed", e)),
    notifyTeamNewLead(payload).catch((e) => console.error("[whatsapp:ai] team alert failed", e)),
  ]);
}

async function runTool(waId: string, name: string, input: any): Promise<string> {
  switch (name) {
    case "search_devices": {
      const matches = await searchDevices(String(input.query || ""), input.serviceType as CatalogServiceType);
      if (matches.length === 0) return JSON.stringify({ matches: [], note: "No catalog match — ask the customer to confirm the exact model name." });
      return JSON.stringify({
        matches: matches.map((m) => ({ modelId: m.modelId, label: m.label, brandName: m.brandName })),
      });
    }
    case "get_sell_options": {
      const opts = await getBuybackDeviceOptions(
        String(input.modelId),
        input.deviceType as BuybackServiceType,
        String(input.brandName || ""),
      );
      if (!opts.priced) {
        return JSON.stringify({
          priced: false,
          note: "No buyback price configured for this model. Offer to book a pickup — the team will confirm the price after inspection.",
          questions: opts.questions,
        });
      }
      return JSON.stringify(opts);
    }
    case "get_sell_quote": {
      const selected: Record<string, string[]> = {};
      for (const a of (input.answers as Array<{ questionId: string; optionIds: string[] }>) || []) {
        if (a?.questionId) selected[a.questionId] = Array.isArray(a.optionIds) ? a.optionIds : [];
      }
      const est = await computeBuybackEstimate(
        String(input.modelId),
        input.deviceType as BuybackServiceType,
        String(input.brandName || ""),
        input.variantId ?? null,
        selected,
      );
      if (!est) {
        return JSON.stringify({ priced: false, note: "No price configured — book a pickup and the team confirms after inspection." });
      }
      return JSON.stringify({
        currency: "INR",
        variant: est.variantLabel,
        basePrice: est.basePrice,
        quote: est.finalQuote,
        note: "This is an estimate; the final amount is confirmed at inspection.",
      });
    }
    case "get_repair_prices": {
      const prices = await getRepairPricing(String(input.modelId), input.serviceType as RepairServiceType);
      if (prices.length === 0) return JSON.stringify({ prices: [], note: "No listed prices for this model — the team will confirm. Offer to capture details." });
      return JSON.stringify({
        currency: "INR",
        prices: prices.map((p) => ({
          categoryId: p.categoryId,
          category: p.categoryName,
          subcategoryId: p.subcategoryId,
          service: p.subcategoryName,
          price: p.price,
        })),
      });
    }
    case "book_repair": {
      const { bookingCode } = await createRepairBooking({
        waId,
        customerName: input.name,
        customerPhone: input.phone,
        modelId: input.modelId,
        serviceType: input.serviceType as RepairServiceType,
        repairCategoryId: input.repairCategoryId ?? null,
        repairSubcategoryId: input.repairSubcategoryId ?? null,
        location: input.address ?? null,
        pincode: input.pincode ?? null,
        scheduledDate: input.scheduledDate ?? null,
        timeSlot: input.timeSlot ?? null,
        notes: input.issue ? `WhatsApp repair: ${input.issue}` : "WhatsApp repair booking",
      });
      await setLastBookingCode(waId, bookingCode);
      await setState(waId, "ai");
      await alertTeam({
        source: "whatsapp-booking",
        title: `WhatsApp repair ${bookingCode} — ${input.issue || "repair"}`,
        bookingCode,
        customer: { name: input.name, phone: input.phone },
        service: { type: input.serviceType, label: input.issue || "Repair" },
        address: input.address ?? null,
        schedule: { date: input.scheduledDate ?? null, timeSlot: input.timeSlot ?? null },
        metadata: { channel: "whatsapp", waId },
      });
      return JSON.stringify({ ok: true, bookingCode });
    }
    case "book_service": {
      const { bookingCode } = await createServiceBooking({
        waId,
        customerName: input.name,
        customerPhone: input.phone,
        serviceType: String(input.serviceType),
        location: input.address ?? null,
        pincode: input.pincode ?? null,
        scheduledDate: input.scheduledDate ?? null,
        timeSlot: input.timeSlot ?? null,
        cctvService: input.serviceType === "cctv" ? input.details ?? null : null,
        notes: input.details ? `WhatsApp ${input.serviceType}: ${input.details}` : `WhatsApp ${input.serviceType} enquiry`,
      });
      await setLastBookingCode(waId, bookingCode);
      await setState(waId, "ai");
      await alertTeam({
        source: "whatsapp-booking",
        title: `WhatsApp ${input.serviceType} ${bookingCode}`,
        bookingCode,
        customer: { name: input.name, phone: input.phone },
        service: { type: String(input.serviceType), label: String(input.serviceType) },
        address: input.address ?? null,
        schedule: { date: input.scheduledDate ?? null, timeSlot: input.timeSlot ?? null },
        notes: input.details ?? null,
        metadata: { channel: "whatsapp", waId },
      });
      return JSON.stringify({ ok: true, bookingCode });
    }
    case "book_buyback_pickup": {
      const quotedAmount =
        typeof input.quotedAmount === "number" && Number.isFinite(input.quotedAmount) ? input.quotedAmount : null;
      const { bookingCode } = await createBuybackPickup({
        waId,
        customerName: input.name,
        customerPhone: input.phone,
        brandName: input.brandName,
        modelName: input.modelName,
        variantLabel: input.variant ?? null,
        serviceType: input.deviceType ?? "mobile",
        quotedAmount,
        quoteBreakdown: quotedAmount ? "WhatsApp estimate (confirmed at inspection)" : null,
        address: input.address ?? null,
        pickupDate: input.pickupDate ?? null,
        timeSlot: input.timeSlot ?? null,
      });
      await setLastBookingCode(waId, bookingCode);
      await setState(waId, "ai");
      await alertTeam({
        source: "whatsapp-buyback",
        title: `WhatsApp buyback pickup ${bookingCode} — ${input.brandName} ${input.modelName}${quotedAmount ? ` @ ₹${quotedAmount}` : ""}`,
        bookingCode,
        customer: { name: input.name, phone: input.phone },
        service: { type: "buyback", label: "Buyback pickup", price: quotedAmount },
        device: { brand: input.brandName, model: input.modelName },
        address: input.address ?? null,
        schedule: { date: input.pickupDate ?? null, timeSlot: input.timeSlot ?? null },
        metadata: { channel: "whatsapp", waId, variant: input.variant ?? "", quotedAmount },
      });
      return JSON.stringify({ ok: true, bookingCode, note: "Final buyback price confirmed after inspection." });
    }
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

// Runs one assistant turn against the conversation history (oldest-first, ending
// with the customer's latest message). Returns the reply text, or null if the AI
// is unavailable so the caller can fall back to a canned message.
export async function runAiTurn(waId: string, history: SimpleMessage[]): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  if (history.length === 0) return null;

  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.text }));

  try {
    for (let hop = 0; hop < 8; hop++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        thinking: { type: "adaptive" },
        output_config: { effort: "low" },
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      if (response.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: response.content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const block of response.content) {
          if (block.type !== "tool_use") continue;
          let resultText: string;
          try {
            resultText = await runTool(waId, block.name, block.input as any);
          } catch (err) {
            console.error(`[whatsapp:ai] tool ${block.name} failed:`, err);
            resultText = JSON.stringify({ error: "Something went wrong. Ask the customer to try again or share support contact." });
          }
          results.push({ type: "tool_result", tool_use_id: block.id, content: resultText });
        }
        messages.push({ role: "user", content: results });
        continue;
      }

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return text || null;
    }
    return null;
  } catch (err) {
    console.error(`[whatsapp:ai] turn failed: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}
