import Anthropic from "@anthropic-ai/sdk";

import { sendLeadEmail } from "@/src/lib/email/resend";
import type { LeadPayload } from "@/src/lib/leads/types";
import { companyName, supportEmail, supportPhoneDisplay } from "@/src/lib/company";

import { notifyTeamNewLead } from "./notify";
import { setLastBookingCode, setState, type SimpleMessage } from "./store";

// The conversational brain of the WhatsApp bot. Powered by Claude with two
// tools: one grounds it in what Looplic actually offers, the other records a
// booking/callback lead into the same pipeline the website uses (team email +
// internal WhatsApp alert). Pricing is deliberately NOT quoted by the model —
// it collects device + issue and hands the final quote to the human team, so
// the bot can never commit Looplic to a wrong repair price.

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

const SYSTEM_PROMPT = `You are the WhatsApp assistant for ${companyName}, a doorstep device repair and buyback service in Bengaluru, India.

What ${companyName} offers:
- Doorstep mobile phone repair (screen, battery, charging port, water damage, software, etc.)
- Laptop and desktop repair, and desktop/PC assembly
- CCTV installation, IT support, and managed IT services
- Device buyback / sell-your-old-phone-or-laptop (instant quote + free pickup)
- Service across Bengaluru with doorstep pickup; most repairs handled by verified technicians

Your job:
- Answer questions helpfully and briefly. This is WhatsApp — keep replies short (a few lines), warm, and use simple language. A little emoji is fine, don't overdo it.
- When a customer wants to book a repair, sell a device, or get a call back, collect their name, phone number, device (brand + model), and the issue, then use the capture_lead tool to record it. Confirm to them that the team will reach out.
- NEVER invent or promise a specific repair price or exact quote. If asked for price, explain that the exact quote depends on the device and issue, and offer to have the team share a precise quote — capture their details with capture_lead.
- Use get_service_info if you're unsure whether ${companyName} offers something.
- For anything you genuinely can't help with, share support contact: ${supportPhoneDisplay} / ${supportEmail}.
- Do not make up policies, timelines, or warranty terms you don't know. It's fine to say the team will confirm.

Keep every reply under about 900 characters.`;

const tools: Anthropic.Tool[] = [
  {
    name: "get_service_info",
    description:
      "Look up whether Looplic offers a given service and get accurate high-level details (service areas, pickup, general scope). Use before answering questions about what Looplic does.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "What the customer is asking about, e.g. 'mobile screen repair', 'sell laptop', 'CCTV'.",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "capture_lead",
    description:
      "Record a booking or callback request so the Looplic team can follow up. Call this once you have at least the customer's name and phone number and know what they want (repair, buyback, or callback).",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Customer name" },
        phone: { type: "string", description: "Customer phone number" },
        intent: {
          type: "string",
          enum: ["repair", "buyback", "callback"],
          description: "What the customer wants",
        },
        deviceBrand: { type: "string", description: "Device brand, if known" },
        deviceModel: { type: "string", description: "Device model, if known" },
        issue: { type: "string", description: "Reported issue or what they want to sell" },
        address: { type: "string", description: "Address or area in Bengaluru, if provided" },
        preferredTime: { type: "string", description: "Preferred date/time for the visit, if provided" },
      },
      required: ["name", "phone", "intent"],
    },
  },
];

function serviceInfo(topic: string): string {
  const t = topic.toLowerCase();
  const facts: string[] = [];
  if (/(mobile|phone|screen|battery|charg|display)/.test(t))
    facts.push("Doorstep mobile repair: screen, battery, charging port, water damage, software. Verified technicians, warranty on repairs.");
  if (/(laptop|desktop|pc|computer|assembl)/.test(t))
    facts.push("Laptop & desktop repair and custom PC assembly are offered.");
  if (/(cctv|camera|surveillance)/.test(t)) facts.push("CCTV installation and support is offered.");
  if (/(it support|managed it|network|server)/.test(t)) facts.push("IT support and managed IT services are offered.");
  if (/(sell|buyback|buy back|old phone|exchange|quote)/.test(t))
    facts.push("Buyback: get an instant estimate and free doorstep pickup for phones and laptops. Final price confirmed after inspection.");
  if (facts.length === 0)
    facts.push("Looplic offers doorstep mobile/laptop/desktop repair, PC assembly, CCTV, IT support, and device buyback in Bengaluru.");
  facts.push("Service area: Bengaluru, with doorstep pickup. Exact repair prices are confirmed by the team based on device and issue.");
  return facts.join(" ");
}

function makeBookingCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `LWB-${suffix}`; // Looplic WhatsApp Booking
}

async function captureLead(waId: string, input: Record<string, any>): Promise<string> {
  const bookingCode = makeBookingCode();
  const intent = String(input.intent || "callback");
  const serviceType = intent === "buyback" ? "buyback" : intent === "repair" ? "repair" : "callback";
  const device = [input.deviceBrand, input.deviceModel].filter(Boolean).join(" ");

  const payload: LeadPayload = {
    source: "whatsapp-bot",
    title: `WhatsApp ${intent} ${bookingCode}${device ? ` — ${device}` : ""}`,
    bookingCode,
    customer: { name: input.name ?? null, phone: input.phone ?? String(waId) },
    service: { type: serviceType, label: `WhatsApp ${intent}` },
    device: { brand: input.deviceBrand ?? null, model: input.deviceModel ?? null },
    schedule: { date: input.preferredTime ?? null },
    address: input.address ?? null,
    notes: input.issue ?? null,
    metadata: { channel: "whatsapp", waId, intent },
  };

  // Fire both notifications; failures are logged inside each helper.
  await Promise.all([
    sendLeadEmail(payload).catch((e) => console.error("[whatsapp:ai] lead email failed", e)),
    notifyTeamNewLead(payload).catch((e) => console.error("[whatsapp:ai] team alert failed", e)),
  ]);

  await setLastBookingCode(waId, bookingCode);
  return bookingCode;
}

// Runs one assistant turn against the conversation history (oldest-first,
// ending with the customer's latest message). Returns the reply text, or null
// if the AI is unavailable so the caller can fall back to a canned message.
export async function runAiTurn(waId: string, history: SimpleMessage[]): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  if (history.length === 0) return null;

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  try {
    for (let hop = 0; hop < 4; hop++) {
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
          if (block.name === "get_service_info") {
            resultText = serviceInfo(String((block.input as any)?.topic ?? ""));
          } else if (block.name === "capture_lead") {
            const code = await captureLead(waId, block.input as Record<string, any>);
            await setState(waId, "ai");
            resultText = `Lead recorded. Booking reference: ${code}. Team will follow up.`;
          } else {
            resultText = "Unknown tool.";
          }
          results.push({ type: "tool_result", tool_use_id: block.id, content: resultText });
        }
        messages.push({ role: "user", content: results });
        continue;
      }

      // Normal completion — collect the text blocks.
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
