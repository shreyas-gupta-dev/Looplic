# Repair live view ("watch my repair")

Lets a customer watch work on their own device, tied to one booking, for a limited
time, with no access to anyone else's repair.

Two delivery mechanisms share one data model and one authorization boundary:

| Provider | What the customer sees | Infrastructure needed |
| --- | --- | --- |
| `stage-media` | Timestamped photos and short clips the technician captures at each repair stage | None beyond the existing S3 bucket. **Working today.** |
| `hls` | A live camera feed from the service centre | A media server converting RTSP to HLS. **Not provisioned — see below.** |

## How access works

Nothing is viewable unless *all* of these hold, re-checked on every single request:

1. **The caller proved a relationship to the booking.** Either signed in as the
   customer who owns it (`bookings.user_id`), or presenting the booking's phone
   number — the same proof `/track` requires. Most bookings are made without an
   account, so phone matching is not optional.
2. **A session exists** for that booking (`repair_stream_sessions`).
3. **The session is open** (`state = 'open'`).
4. **The session has not expired** (`expires_at > now()`).

Staff are deliberately *not* authorized on the customer-facing endpoints. They have
their own dashboards; every extra role that can reach a camera feed is extra risk.

Every denial — no session, closed, expired, wrong phone, no such booking, malformed
id — returns an identical `404 {"error":"Not found"}`. The endpoint therefore reveals
neither which bookings exist nor which are currently being worked on.

### Playback grants

`GET /api/repair-stream/[bookingId]?phone=...` issues a **two-minute** HMAC-signed
grant bound to one session and one booking.

The short lifetime is the point. A grant is a per-request capability, not a session
substitute: the client re-requests one continuously, and each request re-reads
session state from the database. So **closing a session stops playback on the next
request**, rather than whenever a long-lived token happens to expire.

A grant is rejected if it is expired, tampered with, dated in the future, or
presented for a different session or booking than it was minted for.

Secret: `REPAIR_STREAM_GRANT_SECRET`. Falls back to `AUTH_OTP_HMAC_SECRET` (then the
service-role key) with a warning, so an existing deployment keeps working, but the
two capabilities should not share a key long-term.

## `stage-media` (working)

Technician side (`apps/technician`):

- `POST /api/repair-stream` with `{action:"open", bookingId}` — starts or reuses a
  session. Idempotent: tapping the button twice does not create two sessions,
  because closing one would leave the other viewable.
- `POST /api/repair-stream` as `multipart/form-data` with `sessionId`, `stage`,
  optional `caption` and a `file` — uploads one capture. Max 15 MB;
  jpeg/png/webp/mp4/webm only. Session state is checked before the S3 write and
  again on insert, so a session that closes mid-upload cannot gain media.
- `POST /api/repair-stream` with `{action:"close", sessionId}` — ends it.

All three require an `admin`, `operation` or `technician` role. A valid customer
session gets 403.

The UI is `RepairLiveCapture`, mounted in the technician dashboard's inspect-device
dialog. It uses `capture="environment"` so it opens the camera directly, which is
the realistic case: a technician at a bench with a phone.

Customer side (`apps/user`):

- `GET /api/repair-stream/[bookingId]/media` — the list, each item carrying a path
  back through this app.
- `GET /api/repair-stream/[bookingId]/media/[mediaId]` — streams the bytes,
  proxied from S3.

`RepairLiveView` polls every 8 seconds and appears on `/track` only when a session is
open, so an order that is not being worked on shows no empty placeholder.

### ⚠️ S3 bucket policy — prepared, awaiting approval to apply

`looplic-assets` currently has this policy (`migration-capture/s3/looplic-assets-policy.json`):

```json
{ "Sid": "PublicReadGetObject", "Effect": "Allow", "Principal": "*",
  "Action": "s3:GetObject", "Resource": "arn:aws:s3:::looplic-assets/*" }
```

Every object in the bucket is world-readable to anyone who knows its key, and public
access block is fully disabled. Repair photos of customers' devices stored there are
therefore **not confidential at the storage layer**, regardless of how strictly this
application gates them.

What the code already does about it:

- media is only ever served through the grant-checked proxy route;
- the S3 URL and the object key are never returned to a client (there is a test
  asserting this);
- keys carry 128 bits of randomness (`repair-media/<bookingId>/<sessionId>/<32 hex>.<ext>`),
  so keys cannot be enumerated or guessed;
- objects are written with `Cache-Control: private, no-store`.

That is mitigation, not a fix. An unguessable URL is not an access control.

#### The fix, ready to run

`scripts/s3-repair-media-policy.cjs` narrows the policy by **adding** a Deny scoped
to the `repair-media/` prefix, leaving every other statement alone.

```bash
node scripts/s3-repair-media-policy.cjs --show      # current live policy + verdict
node scripts/s3-repair-media-policy.cjs --diff      # exactly what would change
node scripts/s3-repair-media-policy.cjs --apply     # applies it, asks first
node scripts/s3-repair-media-policy.cjs --verify    # proves the effect on a real object
node scripts/s3-repair-media-policy.cjs --rollback  # restores the captured policy
```

Why a Deny rather than narrowing the Allow to a list of public prefixes: `/api/upload`
takes the folder name from its caller (`data-client` passes the storage "bucket"
name straight through), so the set of public prefixes is open-ended. Enumerating it
would silently break uploads to a folder nobody remembered.

Two Deny statements, because they close different holes:

| Sid | Denies | Needs |
| --- | --- | --- |
| `DenyPublicReadRepairMedia` | Unsigned requests — "anyone with the URL", the actual exposure | nothing |
| `DenyCrossAccountReadRepairMedia` | Signed callers from *other* AWS accounts, which `Principal: "*"` also grants | `AWS_ACCOUNT_ID` or `--account=<id>` |

Neither denies principals inside the bucket's own account, so the proxy route keeps
serving media to authorized customers. The target policy is composed from whatever
is **live** at the time rather than from a file in this repo, so applying it cannot
revoke a statement added since the last capture.

`--verify` is the part that actually proves something: it uploads a throwaway object
under `repair-media/`, fetches it with no credentials, fetches a public control
object, and then re-fetches the private one with the app's own credentials. Expected
after the change: `403` anonymous, `200` control, `200` application. It cleans up
after itself and works before the change too, where it reports the `200` as a
failure.

**Not applied.** This changes live infrastructure, so it needs a decision. It is also
currently blocked: the `AWS_ACCESS_KEY_ID` in `apps/user/.env.local` is rejected with
`InvalidAccessKeyId`, so no live S3 call can be made from this checkout at all —
working credentials are needed before either applying or verifying.

The alternative — a separate private bucket with public access block enabled — is
cleaner separation but needs a new bucket, a data move and an env var. The prefix
Deny achieves the same security property with one reversible statement.

## `hls` (code only — not provisioned)

The application layer is complete and the provider is selectable, but **no media
server exists**, so a session with `provider: "hls"` will report itself as live and
then serve nothing until one is running and a centre is configured.

What is implemented:

- `GET /api/repair-stream/[bookingId]/hls` proxies the playlist and **every
  segment**, re-checking authorization, session state, grant and consent on each
  request. Revoking a session therefore stops playback within seconds rather than at
  the end of the stream.
- The playlist is rewritten so segment references point back through this app. Any
  line that is not a simple relative segment name is dropped rather than proxied, and
  a segment is only ever fetched from the same origin as the configured playlist — so
  a hostile or misconfigured upstream playlist cannot turn this route into an
  arbitrary-URL fetcher.
- `POST /api/repair-stream/[bookingId]/consent` records agreement **per session**. A
  customer who agreed last month has not agreed to this one. The proxy refuses to
  serve a playlist without it.
- `RepairLiveStream` plays it: native HLS on Safari and iOS, `hls.js` (dynamically
  imported, so it is absent from the bundle for the common stage-media case)
  elsewhere.
- Configuration lives in `app_settings` under `repair_stream_centres`, resolved
  server-side only. The camera URL is never sent to a browser — there is a test
  asserting the response contains neither the playlist URL nor `providerRef`.

Configuration shape:

```json
{
  "centres": {
    "nagarathpete": {
      "label": "Bengaluru — Nagarathpete",
      "playlistUrl": "http://10.0.0.12:8888/bench-1/index.m3u8"
    }
  },
  "defaultCentre": "nagarathpete"
}
```

A session's `provider_ref` holds the centre key. An unknown key resolves to nothing
rather than falling back to another centre's camera.

### What is still needed

- **A media server** to pull RTSP from the cameras and publish HLS. [MediaMTX](https://github.com/bluenviron/mediamtx)
  or [go2rtc](https://github.com/AlexxIT/go2rtc) both do this and are a single
  binary. It must stay on a private network; this app is the only thing that talks to
  it.
- **Hosting** for that server, with enough egress for concurrent viewers. This is the
  real recurring cost and it scales with how many customers watch at once.
- **Cameras and cabling** at each service centre.

None of this has been provisioned, and none of it should be until the section below
is settled.

### Privacy obligations

A camera pointed at a repair bench records Looplic staff continuously, and may
capture other customers' devices in frame. Three of the four obligations are now
handled in code; the fourth cannot be.

| Obligation | State |
| --- | --- |
| Explicit customer consent, per session | **Implemented.** Recorded against the session and enforced by the proxy, which refuses to serve a playlist without it. Consent given last month is not consent to this session. |
| Tell staff they are recorded | **Notice in the product.** The admin Live View tab carries it above the camera configuration, so it is read at the moment a camera is added rather than filed somewhere. |
| Frame cameras on the bench only | **Physical.** Nothing in code can enforce this; it is in the same notice. |
| Retention period | **Implemented.** See below. |

Obtaining whatever consent local employment law requires from staff is Looplic's
to do, and is not something this code can assert has happened.

### Retention

`scripts/repair-stream-retention.cjs` deletes sessions past the retention period
and the S3 objects belonging to them.

```bash
node scripts/repair-stream-retention.cjs            # report only, changes nothing
node scripts/repair-stream-retention.cjs --apply    # delete
node scripts/repair-stream-retention.cjs --days=90  # override the period
```

Dry run by default: the destructive direction is the one you have to ask for.
Intended to run daily from cron or a scheduled task.

**30 days**, from when a session closed or expired — not from when it opened, so a
long repair is not cut short. That number is a starting point, not a legal
opinion: long enough to settle a "you damaged my device" dispute, short enough
that the store of personal data stays small. Confirm it against the warranty and
dispute window Looplic actually offers and set `REPAIR_MEDIA_RETENTION_DAYS`.

Two rules worth knowing:

- **An open, unexpired session is never deleted, however old it is** — someone may
  be watching it right now.
- **If S3 credentials are missing, it deletes nothing at all** rather than deleting
  the rows. A row with no object is a harmless orphan; an object with no row is
  invisible to the application and would never be cleaned up again.

A period below one day is refused, so a cron entry with a typo cannot wipe
everything.

## Data model

`repair_stream_sessions` — one viewing window: `booking_id`, `provider`,
`provider_ref`, `state`, `opened_by`, `opened_at`, `expires_at`, `closed_at`,
`consent_at`. Sessions default to 4 hours and are capped at 24, so a typo cannot
open one for a year.

`repair_stage_media` — one row per capture: `session_id`, `booking_id`, `stage`,
`media_type`, `object_key`, `caption`, `captured_by`, `captured_by_name`.

Both cascade on booking delete, so removing a booking removes its footage.

Apply with:

```bash
node scripts/migrate-repair-stream.cjs           # additive, idempotent
node scripts/migrate-repair-stream.cjs --verify  # report only
node scripts/migrate-repair-stream.cjs --down    # drop both, asks first
```

## Tests

| What | Where |
| --- | --- |
| Grant signing, expiry, replay, tampering | `apps/user/tests/unit/repair-stream-grant.spec.ts` |
| Session lifecycle and media rules, against the real DB | `apps/user/tests/integration/repair-stream.spec.ts` |
| Authorization matrix over real HTTP | `apps/user/tests/e2e/repair-stream-authorization.spec.ts` |
| Consent enforcement, no URL disclosure, segment traversal | `apps/user/tests/e2e/repair-stream-hls.spec.ts` |

The authorization tests are the ones that matter. They assert that another
customer's phone, a closed session, an expired session, a forged grant, a grant for
a different booking, and a booking with no session are all refused and all
indistinguishable from each other.
