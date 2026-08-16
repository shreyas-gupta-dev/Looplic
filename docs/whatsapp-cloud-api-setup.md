# Looplic WhatsApp Bot — Go‑Live Guide (Meta Cloud API)

This is the step‑by‑step to take the WhatsApp bot from code to two live,
auto‑replying WhatsApp numbers.

> **Status (2026‑07‑30): the code is merged and deployed.** PR #62 (the bot +
> the guided booking wizard) and PR #63 (the Amplify runtime‑env fix) are both on
> `master`, and both RDS migrations have been run. Everything in **Part A** below
> is still outstanding — the bot stays inert until real Meta credentials exist.
> See **Part B** for what's already done vs. what's left.

Decision made (2026‑07‑30, revised): **run the bot on BOTH numbers** —
`+91 88844 45924` (8884445924) and `+91 98865 79923` (9886579923) — under one
Meta app/WABA. Both need migrating from the WhatsApp **Business app** onto the
**Cloud API** (Part A, once per number). The site's numbers are now split:

| Purpose | Number | Where it's used |
|---|---|---|
| WhatsApp booking (bot) | **8884445924** | `whatsappPhone` / "Book on WhatsApp" buttons |
| Phone support (calls only) | **8884445206** | `supportPhone` / "Call us" links, JSON‑LD |
| WhatsApp booking (bot, 2nd number) | **9886579923** | not linked from the site; reachable directly |

> ⚠️ **Read this first — what migration means.** A phone number can be on the
> WhatsApp **Business app** OR the **Cloud API**, never both. Moving either
> number to the Cloud API means:
> - **That number's current WhatsApp Business account is destroyed.** 8884445924
>   is presently branded **"Skill Up Training Institute"**; 9886579923 was
>   branded **"Numunix"**. Either account's profile and branding go away —
>   confirm neither is still needed under its old name.
> - The number **stops working in the WhatsApp Business phone app.** All messages
>   then flow through the bot/webhook (and are logged to the DB / future admin view).
> - **Existing chat history in the Business app does not carry over.** Back up
>   anything you need first (Business app → Settings → Chats → Export).
> - This is reversible later (you can move a number back off the API), but plan
>   for it to be API‑only while the bot runs.

> ✅ **`company.ts` landmine — resolved.** All four apps' `company.ts` now read
> `whatsappPhone = 8884445924` and `supportPhone = 8884445206` (the JSON‑LD
> `telephone` in `apps/user/app/layout.tsx` was updated to match). 9886579923
> deliberately has no website link — it only needs to exist on the Cloud API for
> customers who already have it saved.

> 🧩 **Code change: one webhook now answers for two numbers.** The bot used to
> assume a single `WHATSAPP_PHONE_NUMBER_ID`. It now reads the
> `phone_number_id` Meta attaches to every inbound message
> (`apps/user/app/api/whatsapp/webhook/route.ts`) and threads it through the
> whole reply — via `AsyncLocalStorage` in `phone-context.ts` — so a customer
> who messages 9886579923 always gets replies from 9886579923, never from the
> other number. `WHATSAPP_PHONE_NUMBER_ID` remains as the default/fallback used
> only for sends that don't originate from an inbound WhatsApp message (the
> website's booking-confirmation ping in `notify.ts`).

---

## Part A — What you do in Meta (I can't; needs your account)

### 1. Business + Developer accounts
1. Have a **Meta Business account**: https://business.facebook.com
2. Create a **Meta app**: https://developers.facebook.com → *My Apps* → *Create App*
   → type **Business** → add the **WhatsApp** product.

### 2. Free BOTH numbers from their WhatsApp Business apps
8884445924 is currently on the "Skill Up Training Institute" Business app;
9886579923 is on the "Numunix" Business app. Do this once per number, before it
can join the Cloud API:
1. Export/backup chats you care about (Business app → Settings → Chats → Export chat).
2. **Delete the WhatsApp Business account for that number** (Business app → Settings
   → Account → Delete my account) — this releases the number. (You keep the SIM/phone;
   you're only removing it from the consumer app.)
   - Alternatively Meta may offer an in‑flow "migrate existing number" option during
     step 3 that sends the OTP directly — if so, you can skip the manual delete.

### 3. Register both numbers on the Cloud API — same app
1. In the Meta app → **WhatsApp → API Setup**.
2. Under *From*, click **Add phone number**, enter `+91 88844 45924`, complete the
   business‑profile fields, and verify via the **SMS/voice OTP** sent to it.
3. Click **Add phone number** again for `+91 98865 79923` and repeat. Both numbers
   now live under the *same* app/WABA — you'll get two different **phone number
   IDs**, but only one set of the other three credentials below.

### 4. Collect the credentials the bot needs
From the same **API Setup** / app settings:
1. **Phone number ID for each number** — shown in API Setup when you select a
   number in the *From* dropdown (a long number; NOT the phone number itself).
   Put the one you want as the default in `WHATSAPP_PHONE_NUMBER_ID` — it's only
   used as a fallback for sends that don't originate from an inbound WhatsApp
   message (see the code‑change note above), so either number works; 8884445924
   is the natural pick since it's the one linked from the site.
2. **Permanent access token** — *Business Settings → Users → System users* → create a
   system user → *Add assets* (assign the WhatsApp app / WABA — this grants access
   to every number under it, not just one) → *Generate token* with
   `whatsapp_business_messaging` + `whatsapp_business_management` scopes. **Use this
   permanent token, not the 24‑hour temporary one shown in API Setup.**
   → `WHATSAPP_ACCESS_TOKEN` (shared by both numbers)
3. **App secret** — *App → Settings → Basic → App Secret* → `WHATSAPP_APP_SECRET`
   (shared by both numbers)
4. **Verify token** — invent any random string (e.g. `looplic-wa-9f3k2`) → you'll paste
   the SAME value in two places (Amplify env + Meta webhook config) → `WHATSAPP_VERIFY_TOKEN`
   (shared by both numbers — there's only one webhook URL for the whole app)

### 4b. Set the display name on both numbers to "Looplic"
The name shown on the chat header **and on the `wa.me` / `api.whatsapp.com/send`
click-to-chat page** is each number's own **WhatsApp display name** — it comes
from Meta, NOT from the website. Repeat for both numbers:
1. **WhatsApp Manager** (business.facebook.com/wa/manage) → **Phone numbers** →
   select the number → **Settings → Profile → Business/Display name**.
2. Enter **`Looplic`** and submit. Meta reviews display-name changes (usually minutes
   to ~a day); until approved, the old name ("Skill Up Training Institute" /
   "Numunix") keeps showing.
3. Once approved + the profile script has run for that number, its chat header and
   click-to-chat page will show **Looplic** with the Looplic logo.

> There is **no code change** for this — the website is already correct. Only the
> Meta display name needs updating, for each number.

### 5. (Later, for messaging real customers)
- Complete **Meta Business Verification** to lift the test‑number limit and raise
  messaging tier.
- To message customers **outside the 24‑hour window** (e.g. a confirmation hours
  later), submit a **message template** for approval and set `WHATSAPP_BOOKING_TEMPLATE`.
  Within 24h of a customer's message, free‑text/image replies work with no template.

---

## Part B — Deployment

### ✅ Already done (2026‑07‑30)

- **Both RDS migrations are run** on prod: the base
  `whatsapp_conversations` / `whatsapp_messages` DDL *and*
  `scripts/migrate-whatsapp-flow.sql` (wizard state + the
  `whatsapp_processed_messages` idempotency ledger).
- **PR #62 merged to `master`** — the webhook is live at
  `https://www.looplic.com/api/whatsapp/webhook` and answers Meta's verification.
- **PR #63 merged to `master`** — `amplify.yml` now copies `WHATSAPP_*` and
  `ANTHROPIC_API_KEY` into `.env.production` at build time. Without it, variables
  set in the Amplify console never reach the request‑time Lambda and the bot is
  silent with no error anywhere. **Any new server‑side env var must be added to
  that grep or it won't exist at runtime.**

### ⬜ Remaining (needs your Meta account + AWS console)

1. **Get the credentials** from Meta — Part A above (one phone number ID per
   number, one shared access token/app secret/verify token). Note the
   placeholders currently sitting in `apps/user/.env.local` are dummies
   (`WHATSAPP_ACCESS_TOKEN=DUMM…`); replace them for local testing.
2. **Set the env vars in Amplify** (user app): `WHATSAPP_PHONE_NUMBER_ID` (the
   default number — see 4 above), `WHATSAPP_ACCESS_TOKEN`,
   `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_TEAM_NUMBERS`
   (staff alert numbers), and optionally `ANTHROPIC_API_KEY` (free‑text AI lane)
   and `WHATSAPP_BOOKING_TEMPLATE` / `WHATSAPP_STATUS_TEMPLATE` (approved
   templates). Nothing else is needed for the second number — the webhook reads
   which one a message arrived on directly from Meta's payload (see the
   code‑change note above), it isn't a separate env var.
3. **Redeploy the user app** so the build bakes those variables in. Setting them
   without a rebuild changes nothing.
4. **Register the webhook in Meta** (WhatsApp → Configuration):
   - Callback URL: `https://www.looplic.com/api/whatsapp/webhook`
   - Verify token: your `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to the **messages** field.
   - This is app‑level, done once — it covers both numbers automatically.
5. **Set the Looplic business profile via the Cloud API** — run
   `node scripts/whatsapp-set-profile.mjs` **for each number** (the profile
   picture, about text, address, email and website are per‑number, not
   per‑app), so both chats show Looplic branding. (The verified *display name*
   change is a separate Meta review — see 4b.)
6. **Place one real booking yourself, from each number**, before publicising
   either. Every other path has been exercised against the live catalogue, but
   the Confirm tap — which writes a booking and sends the lead email — has
   never run for real.

---

## After go‑live — how to test
1. From any phone, message `+91 88844 45924` **and separately** `+91 98865 79923`
   with "hi" → both should get the service menu, and replies should come back
   from whichever number you messaged.
2. On each number, tap through a service → brand → model → repair: you get the
   real price and a booking code.
3. Book on the website → you get a branded WhatsApp confirmation + the team gets
   an alert.

## Notes
- Without `ANTHROPIC_API_KEY`, the guided booking wizard still works end‑to‑end;
  only the free‑text AI lane falls back to a canned reply. Add the key to enable the agent.
- The bot quotes prices **only** from the database, and honours the global
  repair‑price visibility switch in `app_settings`.

> **The tap‑driven booking flow** (service → brand → model → repair → address →
> slot → confirm, plus tracking/reschedule/cancel and buyback quotes) is
> documented separately in [`whatsapp-guided-booking.md`](./whatsapp-guided-booking.md).
> It needs one extra migration: `scripts/migrate-whatsapp-flow.sql`.
