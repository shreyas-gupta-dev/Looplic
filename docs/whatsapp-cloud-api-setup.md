# Looplic WhatsApp Bot — Go‑Live Guide (Meta Cloud API)

This is the step‑by‑step to take the WhatsApp bot (already built, PR #62) from
code to a live, auto‑replying WhatsApp number.

Decision made: **migrate the existing number `+91 98865 79923` (9886579923)** from
the WhatsApp Business *app* (currently branded "Numunix") onto the **WhatsApp
Cloud API**.

> ⚠️ **Read this first — what migration means.** A phone number can be on the
> WhatsApp **Business app** OR the **Cloud API**, never both. Moving it to the
> Cloud API means:
> - The number **stops working in the WhatsApp Business phone app.** All messages
>   then flow through the bot/webhook (and are logged to the DB / future admin view).
> - **Existing chat history in the Business app does not carry over.** Back up
>   anything you need first (Business app → Settings → Chats → Export).
> - This is reversible later (you can move the number back off the API), but plan
>   for it to be API‑only while the bot runs.

---

## Part A — What you do in Meta (I can't; needs your account)

### 1. Business + Developer accounts
1. Have a **Meta Business account**: https://business.facebook.com
2. Create a **Meta app**: https://developers.facebook.com → *My Apps* → *Create App*
   → type **Business** → add the **WhatsApp** product.

### 2. Free the number from the WhatsApp Business app
The number is currently on the "Numunix" WhatsApp Business app. Before it can join
the Cloud API:
1. Export/backup chats you care about (Business app → Settings → Chats → Export chat).
2. **Delete the WhatsApp Business account for that number** (Business app → Settings
   → Account → Delete my account) — this releases the number. (You keep the SIM/phone;
   you're only removing it from the consumer app.)
   - Alternatively Meta may offer an in‑flow "migrate existing number" option during
     step 3 that sends the OTP directly — if so, you can skip the manual delete.

### 3. Register the number on the Cloud API
1. In the Meta app → **WhatsApp → API Setup**.
2. Under *From*, click **Add phone number**, enter `+91 98865 79923`, and complete
   business‑profile fields.
3. Verify via the **SMS/voice OTP** sent to the number. When verified, the number is
   live on the Cloud API.

### 4. Collect the 4 credentials the bot needs
From the same **API Setup** / app settings:
1. **Phone number ID** — shown in API Setup (a long number; NOT the phone number itself)
   → `WHATSAPP_PHONE_NUMBER_ID`
2. **Permanent access token** — *Business Settings → Users → System users* → create a
   system user → *Add assets* (assign the WhatsApp app / WABA) → *Generate token* with
   `whatsapp_business_messaging` + `whatsapp_business_management` scopes. **Use this
   permanent token, not the 24‑hour temporary one shown in API Setup.**
   → `WHATSAPP_ACCESS_TOKEN`
3. **App secret** — *App → Settings → Basic → App Secret* → `WHATSAPP_APP_SECRET`
4. **Verify token** — invent any random string (e.g. `looplic-wa-9f3k2`) → you'll paste
   the SAME value in two places (Amplify env + Meta webhook config) → `WHATSAPP_VERIFY_TOKEN`

### 4b. Change the display name from "Numunix" to "Looplic"
The name shown on the chat header **and on the `wa.me` / `api.whatsapp.com/send`
click-to-chat page** is the number's **WhatsApp display name** — it comes from Meta,
NOT from the website (the site already says "Looplic" and links to this number).
To change it:
1. **WhatsApp Manager** (business.facebook.com/wa/manage) → **Phone numbers** →
   select `+91 98865 79923` → **Settings → Profile → Business/Display name**.
2. Enter **`Looplic`** and submit. Meta reviews display-name changes (usually minutes
   to ~a day); until approved, the old name "Numunix" keeps showing.
3. Once approved + my profile script has run, the chat header and the click-to-chat
   page will show **Looplic** with the Looplic logo.

> There is **no code change** for this — the website is already correct. Only the
> Meta display name needs updating.

### 5. (Later, for messaging real customers)
- Complete **Meta Business Verification** to lift the test‑number limit and raise
  messaging tier.
- To message customers **outside the 24‑hour window** (e.g. a confirmation hours
  later), submit a **message template** for approval and set `WHATSAPP_BOOKING_TEMPLATE`.
  Within 24h of a customer's message, free‑text/image replies work with no template.

---

## Part B — What I do (once you give me the 4 credentials + your OK to deploy)

1. **Set the env vars in Amplify** (user app): `WHATSAPP_PHONE_NUMBER_ID`,
   `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`,
   `WHATSAPP_TEAM_NUMBERS` (staff alert numbers), and `ANTHROPIC_API_KEY` (for the AI).
2. **Run the RDS migration** (the `whatsapp_conversations` / `whatsapp_messages` DDL at
   the tail of `rds-schema.sql`).
3. **Merge PR #62 → master** so the webhook goes live at
   `https://www.looplic.com/api/whatsapp/webhook` (Amplify auto‑builds).
4. **Register the webhook in Meta** (WhatsApp → Configuration):
   - Callback URL: `https://www.looplic.com/api/whatsapp/webhook`
   - Verify token: your `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to the **messages** field.
5. **Set the Looplic business profile via the Cloud API** — profile picture (the
   colored Looplic logo), about text, address, email, website — so the chat shows
   Looplic, not Numunix. (The verified *display name* change to "Looplic" is a separate
   Meta review.)

---

## After go‑live — how to test
1. From any phone, message `+91 98865 79923` with "hi" → you should get the button menu.
2. Tap **Book a repair** / send free text → the AI agent replies and can capture a lead.
3. Book on the website → you get a branded WhatsApp confirmation + the team gets an alert.

## Notes
- Without `ANTHROPIC_API_KEY`, the bot still runs the button menu and captures leads,
  but free‑text gets a canned reply instead of the AI. Add the key to enable the agent.
- The AI intentionally never quotes exact repair prices — it collects details and
  captures a lead so the team confirms the quote.
