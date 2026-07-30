# Google Ads Campaign Blueprint — Looplic (Bangalore)

Ready-to-execute guide for launching the first Search campaign from the new Google Ads
account (tag `AW-18323182413`). Follow it top to bottom inside [ads.google.com](https://ads.google.com);
everything is pre-written so the account work takes ~30–45 minutes.

The site already sends page views and these events to the new tag on every deploy:
`booking_form_submit`, `sell_form_submit`, `contact_form_submit`, `whatsapp_click`,
`thank_you_page_view` (see `apps/user/src/lib/gtag.ts`).

---

## 0. Account hygiene — do this first

1. **Change the Gmail password.** It was shared in plain text over chat, which means it
   should be considered compromised. Pick a new one and store it in a password manager.
2. **Enable 2-Step Verification** on the Google account (myaccount.google.com → Security).
3. Instead of sharing the password again, go to **Admin → Access and security** in Google
   Ads and invite other people's own Google accounts with *Standard* access. Access can be
   revoked per-person later; a shared password can't.

## 1. Policy pre-flight (read before anything goes live)

Google reviews every ad and keyword. The rules that actually matter for Looplic:

- **Misrepresentation** — every claim in an ad must be true and visible on the landing
  page. Don't write "Same-day pickup", "6-month warranty", "Cash on the spot", or a price
  unless the site says exactly that. Fake urgency ("Today only!") is a violation.
- **Trademarks** — *descriptive* use of brand names is allowed: "iPhone screen
  replacement", "Sell your Samsung" are fine because they describe the service. Never
  imply affiliation: no "Apple authorized", "Official Samsung service", or brand logos.
- **Editorial** — no ALL CAPS words (acronyms OK), no repeated punctuation ("!!"), no
  phone numbers inside ad text (use a call asset instead), correct spelling.
- **Destination requirements** — landing pages must load, match the ad's promise, and be
  mobile-friendly. The privacy policy link in the footer satisfies the data-collection
  requirement since the forms collect name/phone.
- **What happens on violation** — the ad shows "Disapproved" with a reason; fix the text
  and it re-reviews automatically. Repeated deliberate violations can suspend the
  account, so when in doubt, soften the claim.

Full text: search "Google Ads policies" → policies.google.com/ads.

## 2. Conversion tracking setup (do this before building the campaign)

Goal: teach the account which events count as a "conversion" so bidding can optimize
toward them. Two paths — do **Path A now**, switch to **Path B** once GA4 is live (§8).

### Path A — event-based conversion actions in Google Ads (works today)

Google Ads: **Goals → Conversions → Summary → + New conversion action → Website**.
Enter `www.looplic.com`, let it scan, then choose **Add an event manually** and create
one conversion action per event below. The *event name* must match exactly — the site is
already firing these to the tag:

| Conversion action name | Event name           | Category      | Count | Primary/Secondary |
|---|---|---|---|---|
| Sell form submit       | `sell_form_submit`    | Submit lead form | One   | **Primary** |
| Booking form submit    | `booking_form_submit` | Submit lead form | One   | **Primary** |
| Contact form submit    | `contact_form_submit` | Contact          | One   | **Primary** |
| WhatsApp click         | `whatsapp_click`      | Contact          | One   | Secondary |
| Thank-you page view    | `thank_you_page_view` | Page view        | One   | Secondary |

Primary actions drive bidding; secondary are observation-only. Verify under
**Goals → Conversions**: status should move from "Inactive" to "Recording conversions"
within ~24h of a real form submit (test with one yourself).

### Path B — GA4 key-event import (after GA4 is live, §8)

Mark the same events as *key events* in GA4, link GA4 ↔ Google Ads, then import them as
conversions. GA4 import gives better cross-session attribution; when you switch, demote
the Path A duplicates to Secondary so conversions aren't double-counted.

## 3. Keyword research (the learning part)

Tool: **Tools → Planning → Keyword Planner → Discover new keywords** (only usable inside
the account — this is where real Bangalore volumes and CPC estimates live).

How to use it:
1. Enter seed terms per service, e.g. `sell old phone`, `phone screen replacement`,
   `cctv installation`. Set location = **Bengaluru, Karnataka** and language English.
2. Sort by *Avg. monthly searches*; note *Top of page bid (low/high)* — that's your CPC
   reality check for budgeting.
3. Look at the "Refine keywords" panel: it clusters by brand, condition ("broken",
   "used"), and intent — great for spotting negatives (e.g. "how to sell phone" = info
   intent, exclude).
4. Add winners to the plan → it forecasts clicks/cost at a given budget.

**Intent rule of thumb:** transactional words (*sell, repair, replacement, installation,
near me, price, doorstep*) convert; informational words (*how to, why, best way, DIY*)
don't — those become negatives.

## 4. Campaign structure

One Search campaign, three ad groups (one per service, each with its own tightly-matched
keywords + ads + landing page — this is what keeps Quality Score high):

```
Campaign: Looplic — Search — Bangalore
├── Ad group: Sell / Buyback      → https://www.looplic.com/sell
├── Ad group: Mobile & Laptop Repair → https://www.looplic.com/
└── Ad group: CCTV Installation   → https://www.looplic.com/service/cctv
```

### Campaign-level settings

| Setting | Value | Why |
|---|---|---|
| Campaign type | **Search** (uncheck Display Network + Search partners) | Keeps budget on high-intent Google searches only |
| Location | Bengaluru, Karnataka | Service area |
| Location option | **Presence: people in or regularly in** (under Location options — NOT the default "presence or interest") | Default wastes money on people elsewhere *searching about* Bangalore |
| Language | English (+ Hindi optional) | Matches site |
| Bidding | **Maximize clicks** with max CPC limit (see §6) | Right starting strategy pre-conversion-data |
| Daily budget | See §6 | |
| Ad schedule | Start 24/7; restrict later using data | Don't guess before you have hour-of-day data |
| Ad rotation | Optimize | Default is fine |

Skip every "add Display", "broad match all keywords", and "auto-apply recommendations"
upsell during creation — decline auto-apply under **Recommendations → Auto-apply**.

### Ad group 1 — Sell / Buyback

Keywords (phrase `"…"` and exact `[…]` match — do **not** use broad match in week 1):

```
"sell old phone"            [sell old phone bangalore]
"sell used mobile"          [sell my phone online]
"phone buyback"             [sell old mobile for cash]
"sell old laptop"           [sell used laptop bangalore]
"sell iphone"               "sell samsung phone"
"old phone pickup"          "sell phone online instant payment"
```

### Ad group 2 — Mobile & Laptop Repair

```
"phone screen replacement"      [mobile screen replacement bangalore]
"doorstep mobile repair"        [phone repair at home]
"iphone screen replacement"     "samsung screen replacement"
"laptop repair home service"    [laptop repair bangalore]
"mobile repair near me"         "phone battery replacement"
```

### Ad group 3 — CCTV Installation

```
"cctv installation"             [cctv installation bangalore]
"cctv camera installation"      "home security camera installation"
"cctv installation for home"    "cctv setup for office"
"ip camera installation"        [cctv installation near me]
```

### Negative keywords (campaign level)

**Tools → Shared library → Negative keyword lists** → create "Looplic — core negatives",
attach to the campaign:

```
free            job             jobs            salary          course
training        DIY             "how to"        wallpaper       app download
second hand buy buy used phone  olx             flipkart        amazon
repair shop for sale (franchise) cctv camera price only-shopping terms
under 500       under 1000      wholesale       distributor     dealer
```

(For the Sell group, *buy*-intent terms like "buy used phone" are negatives — those
searchers are your inventory buyers, not sellers. Review weekly via the search-terms
report, §7.)

## 5. Ad copies (paste-ready RSAs)

One Responsive Search Ad per ad group. Limits: **headlines ≤ 30 chars (up to 15),
descriptions ≤ 90 chars (up to 4)**. All lines below fit. Google mixes and matches;
pin only where noted. ⚠ marked lines make claims — confirm the site supports them
before using, or drop them.

### RSA — Sell / Buyback (final URL: `/sell`, display path: `looplic.com/sell`)

Headlines:
1. Sell Your Old Phone Fast *(pin to position 1)*
2. Instant Price Quote Online
3. Free Doorstep Pickup ⚠ *(confirm pickup is free)*
4. Sell Old Phones in Bangalore
5. Sell Your Laptop for Cash
6. Get a Quote in 2 Minutes
7. Fair Condition-Based Prices
8. Old Phone Lying Around?
9. Turn Old Gadgets Into Cash
10. Sell iPhone or Android
11. Quick Payment on Pickup ⚠ *(confirm payment timing)*
12. Looplic Phone Buyback
13. Book a Pickup Slot Online
14. No Haggling, Clear Pricing
15. Trusted Bangalore Buyback

Descriptions:
1. Answer a few questions about your device and get an instant quote. Book a free pickup.
2. Sell your old phone or laptop in Bangalore. Fair prices, quick payment, zero hassle.
3. Transparent condition-based pricing. Pick a pickup slot that suits your schedule.
4. Looplic buys used mobiles and laptops across Bangalore. Get your quote now.

### RSA — Mobile & Laptop Repair (final URL: `/`, display path: `looplic.com/repair`)

Headlines:
1. Doorstep Mobile Repair *(pin to position 1)*
2. Phone Screen Replacement
3. Laptop Repair at Home
4. Device Repair in Bangalore
5. iPhone Screen Repair
6. Samsung Screen Repair
7. Book a Repair in Minutes
8. Transparent Repair Prices
9. We Come to Your Doorstep
10. Skilled Repair Technicians
11. Mobile & Laptop Repairs
12. Screens, Batteries & More
13. Skip the Service Center
14. Repair at Home or Office
15. Looplic Device Repair

Descriptions:
1. Book a technician to your home or office in Bangalore. Screens, batteries and more.
2. Doorstep mobile and laptop repair with upfront pricing. Book online in minutes.
3. Screen replacement for iPhone, Samsung, OnePlus and more brands, at your doorstep.
4. Skip the service center queue. Looplic technicians repair at your location.

### RSA — CCTV Installation (final URL: `/service/cctv`, display path: `looplic.com/cctv`)

Headlines:
1. CCTV Installation Bangalore *(pin to position 1)*
2. Home Security Cameras
3. CCTV for Home & Office
4. Professional Installation
5. Book a CCTV Site Visit
6. HD & IP Camera Setup
7. Get a CCTV Quote Today
8. Trusted CCTV Installers
9. Secure Your Property
10. End-to-End CCTV Setup

Descriptions:
1. Professional CCTV installation for homes, shops and offices across Bangalore.
2. End-to-end setup: cameras, wiring, recording and mobile viewing. Book online.
3. Get expert advice on the right camera setup for your space. Transparent pricing.
4. Book a site visit online in minutes. Looplic handles the rest.

### Assets (extensions) — add at campaign level

- **Sitelinks:** Sell Your Phone → `/sell` · iPhone Screen Repair → `/iphone-screen-replacement` ·
  Samsung Screen Repair → `/samsung-screen-replacement` · Contact Us → `/contact-us`
- **Callouts:** Doorstep Service · Bangalore Wide · Online Booking · Upfront Pricing
- **Structured snippet:** *Services*: Phone Repair, Laptop Repair, CCTV Installation, Phone Buyback
- **Call asset:** business phone number (this is the policy-correct way to show a number)

Aim for ad strength "Good" or better — the editor shows it live as you paste.

## 6. Bidding & budget (the bidding-methods lesson)

The main strategies and when each applies:

| Strategy | What it does | When to use |
|---|---|---|
| Manual CPC | You set every bid yourself | Full control; only worth it at large scale |
| **Maximize clicks** | Auto-bids for most clicks in budget | **Start here** — no conversion history exists yet |
| Maximize conversions | Auto-bids toward conversions | After ~30 conversions recorded (needs data to learn) |
| Target CPA | Conversions at a set cost-per-lead | After Max conversions stabilizes and you know your CPA |
| Target ROAS | Bids on revenue value | Needs revenue-per-conversion data — later, if ever |

**The path:** launch on *Maximize clicks* with a **max CPC bid limit** (set it from the
Keyword Planner "top of page bid (low)" numbers — typically ₹15–₹60 for these Bangalore
service terms). After **~30 conversions**, switch to *Maximize conversions*; two weeks
later, review the actual cost-per-lead and consider Target CPA at that number.

**Budget:** daily budget = loaded amount ÷ intended days of learning. E.g. ₹10,000 over
3 weeks ≈ **₹450–500/day**. Below ~₹300/day the data trickles in too slowly to learn
from. Google may spend up to 2× the daily budget on a given day but never exceeds
(daily × 30.4) in a month.

## 7. Launch checklist + monitoring

Launch order: conversions (§2) → negative list (§4) → campaign + ad groups + keywords →
RSAs + assets (§5) → bidding/budget (§6) → **double-check location option = Presence** →
enable. Billing: **Admin → Billing** must have a payment method even with credit loaded.

**Daily (week 1):**
- **Insights & reports → Search terms** — the single highest-value report: shows real
  queries that triggered ads. Add irrelevant ones as negatives immediately.
- Check ad status (approved?) and that impressions/clicks are flowing.
- Watch Goals → Conversions for first recorded conversions.

**Weekly:**
- Pause keywords with 100+ clicks and 0 conversions.
- Compare ad-group CTRs (healthy Search CTR: 3–8%); improve low-CTR ad copy.
- Check *Auction insights* to see who you're bidding against.
- Review hour-of-day / day-of-week performance (Reports) → tighten ad schedule.

## 8. GA4 setup (the Google Analytics half)

The codebase now supports GA4 natively — every page view and all the events above are
sent to GA4 automatically once one env var is set. Steps:

1. **Create the property:** [analytics.google.com](https://analytics.google.com) (same
   Google login) → Admin → **Create property** → name "Looplic", timezone India, currency
   INR → platform **Web** → URL `https://www.looplic.com` → keep Enhanced measurement ON
   (auto-tracks scrolls, outbound clicks, site search, video, downloads).
2. Copy the **Measurement ID** (`G-XXXXXXXXXX`) from the web stream details.
3. **AWS Amplify Console** → the `looplic-user` app → Environment variables → add
   `NEXT_PUBLIC_GA4_MEASUREMENT_ID = G-XXXXXXXXXX` → save → **redeploy** the branch
   (the value is baked in at build time).
4. Verify: GA4 → Reports → **Realtime** while you browse looplic.com; your visit and
   events (`sell_form_submit` on a test submit, etc.) should appear within seconds.
   For event-level debugging use Admin → DebugView with the Google Analytics Debugger
   browser extension.
5. **Mark key events:** Admin → Events → toggle "Mark as key event" on
   `sell_form_submit`, `booking_form_submit`, `contact_form_submit`.
6. **Link to Google Ads:** GA4 Admin → Product links → Google Ads link → select the new
   account. Then in Google Ads: Goals → Conversions → New → **Import → GA4 key events**.
   Demote the §2 Path-A duplicates to Secondary after import (avoid double counting).

What GA4 adds over the Ads tag alone: full user journeys (landing page → pages → form),
audience building (e.g. "visited /sell but didn't submit" for remarketing), engagement
metrics per page, and free BigQuery export — the raw-data foundation for the automation
and AI analysis work planned next.

---

*Doc owner: generated for the Looplic Ads learning project, July 2026. The tracking code
this doc references lives in `apps/user/src/lib/gtag.ts` and `apps/user/app/layout.tsx`.*
