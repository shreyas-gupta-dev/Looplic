# Order tracking and status notifications

What a customer can find out about their repair, and when they are told.

## The status vocabulary

One canonical list, in `packages/db/booking-status.ts`. Every dashboard, the
customer timeline and every notification read from it, so the wording cannot
disagree between them.

| Status | Shown to the customer as | Meaning |
| --- | --- | --- |
| `pending` | Order Placed | We have your request and are confirming the details. |
| `confirmed` | Confirmed | Your booking is confirmed and scheduled. |
| `pickup_requested` | Pickup Requested | A technician has been assigned to collect your device. |
| `picked_up` | Device Picked Up | Your device is with us and on its way to the service centre. |
| `in_progress` | Repair In Progress | Our technician is working on your device. |
| `ready` | Ready | The repair is finished and your device has passed testing. |
| `out_for_delivery` | Out For Delivery | Your device is on its way back to you. |
| `delivered` | Delivered | Your device has been returned to you. |
| `completed` | Completed | This order is complete. |
| `on_hold` | On Hold | We have paused work and will be in touch shortly. |
| `cancelled` | Cancelled | — |

`bookings.status` stays a text column rather than a Postgres enum on purpose: an
enum needs a migration and a table lock every time the journey gains a step, and
would reject the legacy values already in the table. Validation lives in the
module instead, and legacy spellings (`assigned` → `pickup_requested`) are
normalised on the way in.

`on_hold` and `cancelled` are deliberately *not* on the timeline. An order that
is not progressing does not get a progress bar; the page swaps in a single amber
or red panel instead, because a half-filled bar for a cancelled order is
misleading.

## Where a change can come from

Every status change in all four apps goes through the `update` operation of
`/api/db-proxy`, which calls `changeBookingStatus`. That is the only path, which
buys three things at once:

- an illegal transition is refused (`pending → delivered` cannot happen);
- a `booking_status_events` row is always written, so history cannot be skipped;
- the customer is always notified.

The status update and its history row are written in one transaction. A status
change with no event would be invisible to the customer; an event with no change
would be a lie.

## What the customer sees

`/track` (and `/track/<code>`) asks for the booking code **and** the phone
number. The code alone is not a bearer token — codes follow a predictable shape
(`MOB-123456-ABCD`), so a code-only URL would be guessable in bulk. Unknown code,
wrong phone and malformed input all return the same message, so the page cannot
be used to confirm which codes exist. Attempts are rate-limited per IP.

The page shows the whole expected journey, not just the current step: completed
steps ticked and timestamped from the recorded history, the current one
highlighted with its explanation, and later ones greyed and untimed. "When was my
device picked up?" and "what happens next?" are most of what a customer wants
from a tracking page, and both need the history table rather than the single
`status` column.

Contact details are masked (`Ravi K.`, `••••• 0042`) — enough to confirm the
right order, not enough to be a leak.

## Notifications

`packages/db/booking-status-notify.ts`. Composed from `BOOKING_STATUS_META`, so
the message says the same thing as the timeline the link leads to.

Fires once per *real* change: re-saving a form with an unchanged status writes no
event and sends no message, and a refused transition sends nothing. Dispatch
happens after the transaction commits and is not awaited — a slow WhatsApp send
must not hold a transaction open, and Meta having a bad minute must not make an
operator's dashboard click fail. Failures are logged and swallowed.

`pending` is not notified: the customer is looking at the confirmation screen at
that moment, and the booking-received message already covers it.

### Channels, and the limit worth knowing about

| Channel | When it is used |
| --- | --- |
| WhatsApp | Always. `bookings.customer_phone` is mandatory. |
| Email | Only when an address can be resolved. |

**There is no customer email column** on `bookings` or `customer_profiles`. The
only address Looplic holds is the Supabase auth identity, and only for a booking
placed while signed in — which most are not. So a phone-only booking gets
WhatsApp and nothing else. That is a data-model limit, not a bug; adding a
`customer_email` column to `bookings` is the fix if email needs to reach
everyone.

### Configuration

| Variable | Effect if unset |
| --- | --- |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` | No WhatsApp send. Silent no-op, not an error. |
| `WHATSAPP_STATUS_TEMPLATE` | Falls back to a free-text send. |
| `RESEND_API_KEY` | No email send. |
| `NEXT_PUBLIC_SITE_URL` | Track links fall back to `https://www.looplic.com`. |

> **`WHATSAPP_STATUS_TEMPLATE` matters in production.** A status update is
> unsolicited by definition, so it almost always falls outside WhatsApp's 24-hour
> customer-service window. Outside that window the Cloud API *accepts* a free-text
> send and then does not deliver it — no error, no message. An approved template
> with one body parameter is the only reliable way to open the conversation.

Live WhatsApp delivery has **not** been verified on this checkout: the
`WHATSAPP_ACCESS_TOKEN` in `apps/user/.env.local` is 17 characters, i.e. a
placeholder rather than a real System User token. The dispatch path, composition,
de-duplication and failure isolation are all covered by tests; the final hop to
Meta needs a real token and a live number to confirm.

## Tests

| What | Where |
| --- | --- |
| Status vocabulary, legal transitions, legacy aliases | `apps/user/tests/unit/booking-status.spec.ts` |
| Message wording, escaping, track links | `apps/user/tests/unit/booking-status-notify.spec.ts` |
| One event per change, history order, actor roles | `apps/user/tests/integration/booking-status-events.spec.ts` |
| Customer lookup as the order advances | `apps/user/tests/integration/order-tracking.spec.ts` |
| Repair selection survives onto the booking row | `apps/user/tests/integration/repair-selection.spec.ts` |
| Notify once, in order, never on a no-op, never blocking | `apps/user/tests/integration/status-notifications.spec.ts` |
| The page itself: journey, timestamps, hold/cancel, live panel | `apps/user/tests/e2e/track-page.spec.ts` |
| No oracle for which codes exist | `apps/user/tests/e2e/order-tracking.spec.ts` |

The integration and e2e specs replace the notifier with a sink, so a test run
cannot send a message to a real number.
