# WhatsApp Guided Booking — how it works & how to ship it

The WhatsApp number now runs the **same booking flow as the website**, driven by
tappable options instead of typing. A customer picks a service, brand, model,
the exact repair (with the real price from the database), their address, a date
and a time slot — then taps **Confirm** and gets a booking code. The booking
lands in the same `bookings` table with `order_source = "whatsapp"`, so admin
Order Management shows it exactly like a website booking.

This document covers what shipped, what you must do to switch it on, and how to
test it without a phone.

See also: [`whatsapp-cloud-api-setup.md`](./whatsapp-cloud-api-setup.md) for the
Meta account setup (that guide's steps still apply).

---

## 1. What the customer can do

| Journey | Steps (mirrors the website) |
| --- | --- |
| **Mobile / laptop repair** | brand → series → model → repair category → exact repair *(with the model's price)* → laptop specs *(laptop only)* → notes → name → phone → address → city → pincode → date → slot → confirm |
| **Screen guard** | brand → series → model → guard *(with price)* → notes → details → schedule → confirm |
| **CCTV** | service type → camera brand → camera count → indoor/outdoor → DVR vs NVR → notes → details → schedule → confirm |
| **IT support / desktop / managed IT / WiFi** | notes → details → schedule → confirm |
| **Sell a device (buyback)** | category → brand → series → model → variant → condition questions → **exact quote** → details → pickup date/slot → confirm |
| **My orders** | list recent orders → status → **reschedule** or **cancel** |

Plus, from anywhere in the conversation:

- `menu`, `cancel`, `back` (a row on every picker), `track`, `agent`/`human`
- `STOP` to opt out, `START` to opt back in
- Typing a model name at any device picker jumps straight to that model
- Typing free text like *"my iPhone 12 screen is cracked"* drops the customer
  onto the repair picker for that exact model
- Anything the wizard can't classify falls through to the existing Claude agent

### Parity guarantees

- Prices come only from the database — per-model override if one exists, else the
  base price — and honour the global price-visibility switch in `app_settings`.
  If prices are hidden on the website, they're hidden here.
- Buyback quotes use `computeBuybackQuote`, the same engine as the website Sell
  flow, so the number matches to the rupee.
- Booking notes are built by a mirror of the website's `buildBookingNotes()` —
  same laptop spec line, same CCTV config line, same visiting-charge sentence.
- Confirming a booking fires the same five notifications the website does: the
  booking row, the internal lead email, the customer's confirmation email, the
  team's WhatsApp alert, and the customer's WhatsApp confirmation.

---

## 2. What you must do to switch it on

### a. Run the database migration (required)

```bash
psql "$DATABASE_URL" -f scripts/migrate-whatsapp-flow.sql
```

It adds the wizard state columns to `whatsapp_conversations` and creates
`whatsapp_processed_messages` (webhook idempotency). It is safe to re-run, and
it also creates the base WhatsApp tables if the original migration was never run.

**Until this runs**, the bot still replies but can't remember a conversation —
the wizard will restart on every message. The code degrades quietly (it treats
"missing table/column" as "no memory yet") rather than erroring at the customer.

### b. Environment variables (Amplify → user app)

Already required by the existing bot:

| Variable | Purpose |
| --- | --- |
| `WHATSAPP_PHONE_NUMBER_ID` | Cloud API sender |
| `WHATSAPP_ACCESS_TOKEN` | Cloud API token |
| `WHATSAPP_VERIFY_TOKEN` | Webhook handshake |
| `WHATSAPP_APP_SECRET` | Verifies each webhook signature |
| `WHATSAPP_TEAM_NUMBERS` | Comma-separated staff numbers for alerts |
| `ANTHROPIC_API_KEY` | The free-text AI lane (the wizard works without it) |

New / optional:

| Variable | Purpose |
| --- | --- |
| `WHATSAPP_BOOKING_TEMPLATE` | Approved template for booking confirmations outside the 24h window |
| `WHATSAPP_STATUS_TEMPLATE` | Approved template for status-change updates (new) |
| `WHATSAPP_LOGO_URL` | Override the branded confirmation image |
| `WHATSAPP_SIMULATOR` | Set to `1` in **development only** to enable the simulator route |

### c. Message templates to get approved in Meta

Free-text only reaches a customer within 24 hours of their last message. For
anything proactive you need approved templates:

1. **Booking confirmation** — `{{1}}` name, `{{2}}` service, `{{3}}` booking code.
   Set the approved name as `WHATSAPP_BOOKING_TEMPLATE`.
2. **Status update** — `{{1}}` booking code, `{{2}}` status, `{{3}}` service.
   Set the approved name as `WHATSAPP_STATUS_TEMPLATE`.

---

## 3. Testing without a phone (the simulator)

```bash
# .env.local
WHATSAPP_SIMULATOR=1
```

Then drive the conversation over HTTP. Each response lists every message the bot
would have sent, including the tappable option ids, so you chain the next call:

```bash
curl -s localhost:3000/api/whatsapp/simulate \
  -H 'content-type: application/json' \
  -d '{"waId":"919999900001","text":"hi"}' | jq

curl -s localhost:3000/api/whatsapp/simulate \
  -H 'content-type: application/json' \
  -d '{"waId":"919999900001","buttonId":"f:service:mobile_repair"}' | jq
```

The simulator runs the **real** router, state machine, catalogue and pricing —
only the send to Meta is stubbed. It refuses to run when `NODE_ENV=production`.

> ⚠️ It writes to whatever `DATABASE_URL` points at, including real bookings if
> you drive it to Confirm. Use a scratch database or a throwaway `waId`.

### Unit tests

```bash
node --test scripts/whatsapp-flow.test.ts
```

26 tests covering step ordering, back/forward symmetry, context invalidation,
pagination, typed-date parsing and interactive-id encoding. No build step —
Node 22.18+ strips the types natively.

---

## 4. How it's built

```
apps/user/src/lib/whatsapp/
  config.ts            env + feature detection
  client.ts            Cloud API sends: text, image, buttons, LIST, CTA-URL,
                       templates, signature check, simulation capture
  store.ts             conversation + wizard state, idempotency, opt-out, handoff
  booking.ts           catalogue search, pricing, booking creation, tracking,
                       reschedule/cancel, saved profile, buyback quoting
  notify.ts            customer confirmation, team alerts, handoff + status pings
  bot.ts               the inbound router (lanes: compliance → idempotency →
                       handoff → global words → wizard → intent → AI)
  ai.ts                the Claude agent (unchanged free-text lane)
  flow/
    types.ts           FlowStep / FlowContext
    steps.ts           PURE core: step order, back/next, context invalidation,
                       pagination, date parsing  ← unit-tested
    ids.ts             interactive id encoding (f:<step>:<value>)
    constants.ts       option sets mirroring UniversalBookingFlow.tsx
    catalog-nav.ts     paginated brand/series/model/repair/guard lookups
    machine.ts         rendering + transitions (the I/O around steps.ts)
    summary.ts         confirm screen + booking notes (mirrors the website)
    submit.ts          booking creation + the five notifications
    intent.ts          free text → wizard hand-in
apps/user/app/api/whatsapp/
  webhook/route.ts     Meta webhook (verify + messages)
  simulate/route.ts    dev-only conversation simulator
```

Two design rules worth knowing before you change anything:

1. **Old messages stay tappable forever in WhatsApp.** Every option id carries
   the step that produced it. Tapping an old option rewinds to that step and
   re-answers it, clearing everything downstream (`clearDownstream`), instead of
   erroring at the customer.
2. **An interactive list holds ten rows total.** Every picker paginates at eight
   options plus "Show more" and "Back". `sendList` truncates defensively — an
   over-long row would otherwise be a 400 from Meta, i.e. a customer who gets no
   reply at all.

### Duplicate protection

Meta redelivers a webhook whenever our `200` is slow or lost. Before doing any
work, `bot.ts` claims the message id in `whatsapp_processed_messages`; a
redelivery is dropped. The confirm step additionally refuses to book twice for
the same wizard session (`context.bookedCode`).

---

## 5. Known gaps / decisions left open

- **Language:** English only. The copy is centralised in `flow/machine.ts` and
  `flow/constants.ts`, so Hindi/Kannada can be layered on later, but no i18n
  framework was added.
- **Payments:** not wired. There is no payment provider in the repo today
  (`PaymentsTab` records bills; it doesn't collect money), so WhatsApp can't take
  an advance yet.
- **Status notifications** ship as a function (`notifyCustomerStatusChange`) but
  are **not yet called** from admin/operator — hook it into wherever a booking's
  status changes when you want customers pinged automatically.
- **Admin Conversations tab:** not built. Transcripts are in `whatsapp_messages`
  and handoff state is on `whatsapp_conversations`, ready for a UI.
- **WhatsApp Flows** (Meta's native multi-step forms) were evaluated and skipped:
  they need extra Meta configuration and an endpoint, and interactive lists cover
  the same ground with no external dependency.
