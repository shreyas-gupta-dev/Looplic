# AWS Account Migration Runbook — Looplic

Move the Looplic production stack out of the shared Revenuxe AWS account into a
new, Looplic-owned AWS account.

- **Source account:** `041149335823` ("Revenuxe"), region `ap-south-1`
  - root email: `looplic.com@gmail.com`
  - IAM user in use: `looplic-developer`
- **Target account:** new, to be created under `looplic.com@gmail.com`
- **Date of inventory:** 2026-07-30

> **This account is shared.** It also hosts Intorza and hulumart resources. That
> rules out the cheapest option (handing over the whole account by changing the
> root email) unless those products move too. Everything below assumes we extract
> only the Looplic resources.

## Decisions taken (2026-07-30)

- **Scope: Looplic only.** Intorza and hulumart stay in `041149335823`.
- **Account type: standalone.** Not an AWS Organizations member — its own root
  email, own billing card, own fresh 12-month free tier. No cross-account trust.
- **Cutover: dual-write via early DB repoint** (see Phase D). No read-only window,
  no accepted data gap.

---

## 1. Inventory — what actually has to move

### 1.1 Amplify apps (4 in scope, 1 out of scope)

| App name | appId | Monorepo root | Custom domain | Branch |
|---|---|---|---|---|
| `looplic-js` | `d37680xkrtvnut` | `apps/user` | `looplic.com` + `www` | `master` |
| `Looplic` | `d3v5qkp9iyoswj` | `apps/admin` | `admin.looplic.com` | `master` |
| `looplic-operator` | `drmex8309qkvx` | `apps/operator` | `operator.looplic.com` | `master` |
| `looplic-technician` | `dz27clhrh79mv` | `apps/technician` | `tech.looplic.com` | `master` |
| `intorza-website` | `d3oxzlxr7hj82b` | — | — | **OUT OF SCOPE** |

All four are `WEB_COMPUTE` (Next.js SSR) and build from
`https://github.com/shreyas-gupta-dev/Looplic` using the root `amplify.yml`
monorepo buildspec.

Confusingly, the *admin* app is the one literally named `Looplic`, and the *user*
app is named `looplic-js`. Worth renaming during the rebuild.

### 1.2 RDS

- Instance `looplic-db`, PostgreSQL **16.14**, `db.t3.micro`, 20 GB gp3
- Endpoint: `looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com`
- Publicly accessible: **yes**; Multi-AZ: **no**
- **No manual snapshots exist**
- Actual data in use: ~1.6 GB of 20 GB allocated (18.38 GB free) — and most of
  that is Postgres overhead. The real dataset is small; a `pg_dump` will be
  megabytes, not gigabytes.

### 1.3 S3

| Bucket | Region | Objects | Size | In scope |
|---|---|---|---|---|
| `looplic-assets` | ap-south-1 | 18 | 1.29 MB | **Yes** — referenced in app code |
| `looplic-image-bucket` | ap-south-1 | 0 | 0 | Yes (empty — can just skip) |
| `intorza-assets`, `intorza-images`, `revenuxe-intorza-prod`, `hulumart-assets`, `cdk-hnb659fds-assets-*` | — | — | — | No |

`looplic-assets` is the only bucket referenced in application code. It needs a
public-read bucket policy across the **whole bucket** (not just `public/*`) plus
CORS for the apex domain — this was a previously-fixed production bug and must be
reproduced in the new account or admin image uploads will 403 on display.

### 1.4 DNS / certificates

- Route53 hosted zones: `looplic.com.` (19 records) and an **orphaned**
  `www.looplic.com.` zone (2 records) — the orphan is a known foot-gun, do not
  recreate it.
- The `looplic.com` zone's own NS records are AWS nameservers
  (`ns-1907.awsdns-46.co.uk`, `ns-1061.awsdns-04.org`, `ns-987.awsdns-59.net`,
  `ns-412.awsdns-51.com`). **The domain is registered at Hostinger, not Route53**,
  so the registrar delegation must be repointed by hand at cutover. Hostinger's
  `dns-parking` nameservers have crept back into the delegation before — verify
  after the change and again 24h later.
- ACM: `www.looplic.com` (ISSUED, **us-east-1**). `api.intorza.com` is out of scope.
  Note Amplify custom domains need the cert in the app's region for
  Amplify-managed certs; Amplify normally provisions this itself, so the simplest
  path is to let the new account's Amplify request a fresh managed cert.

### 1.5 IAM

- Users in source account: `looplic-developer` (ours), `intorza-dev`, `hulumart-dev`
- `looplic-developer` has no *directly* attached policies — permissions come via
  group `looplic-developers`, which carries **`AdministratorAccess`** plus
  EC2/RDS/S3/VPC/CloudWatch/CloudFormation FullAccess and `IAMReadOnlyAccess`.
  Replicate least privilege in the new account, not this.

### 🔴 Full-admin credential sitting in Amplify env

`APP_AWS_ACCESS_KEY_ID` on all four production apps is `AKIAXXXXXXXXXXXXXXXXX` —
the **same key** as the local CLI's `looplic-developer` credential, i.e. an
effectively `AdministratorAccess` key, injected into every SSR Lambda purely to
upload images to S3.

**Do not copy `APP_AWS_*` to the new account.** Mint a fresh IAM user scoped to
`s3:GetObject`/`s3:PutObject` on the assets bucket only.

Rotation in the *old* account is worth doing regardless of this migration, but is
**coupled** — one key serves both the CLI and all four apps, so rotate in this
order:

1. Create the new scoped IAM user.
2. Update `APP_AWS_*` on all four apps → redeploy → verify an admin image upload.
3. Only then deactivate the old key and reconfigure the local CLI.

### 1.6 NOT in scope — confirmed by code inspection

- **Cognito.** Pool `ap-south-1_66i7AzfZN` (`looplic-users`) exists with 1 user, but
  it is **abandoned**. There are no `amazon-cognito-*` or `aws-amplify` npm
  dependencies anywhere, and `apps/admin/src/lib/auth/cognito-server.ts` carries the
  comment *"file name kept for import stability — auth now runs on Supabase, not
  Cognito."* 41 source files reference Supabase. **Do not migrate the pool** — and
  do not let anyone tell you user passwords need exporting (Cognito can't export
  them anyway; this would have been the hardest step if it were real).
- **Supabase** (auth) — third-party, unaffected by the AWS move. No action.
- **Resend** (email) — third-party. No action beyond copying the API key.

---

## 2. Human-only prerequisites

These cannot be automated and must be done by a person in a browser:

1. **Create the new AWS account.** Signup requires a working email, a phone
   number for SMS/voice verification, a CAPTCHA, and a valid payment card. It
   cannot be done from the CLI or by an agent.
   - Use a **plus-address or alias** for the root email (e.g.
     `looplic.com+aws-prod@gmail.com`) so the new account's root identity is
     distinct from the old one's.
2. **Billing card.** Whoever owns the card enters it themselves in the AWS
   console. Card numbers should never be pasted into chat, a ticket, or a repo.
3. **Enable MFA on the root user** immediately after signup, then stop using root.
4. **Create the IAM admin user** (`looplic-developer`) with an access key, and
   hand that key over out-of-band.
5. **Set a billing alarm** (e.g. ₹2,000/month) before deploying anything.
6. **GitHub access.** A PAT with read access to `shreyas-gupta-dev/Looplic`.
   The source apps use `repositoryCloneMethod=TOKEN`, so `amplify create-app
   --access-token` works from the CLI and **no console OAuth click-through is
   required** — earlier drafts of this runbook said otherwise.

Once step 4 is done, configure the CLI locally:

```bash
aws configure --profile looplic-new
# paste key/secret at the prompts — never into a chat window
# region: ap-south-1   output: json
aws sts get-caller-identity --profile looplic-new
```

From that point the rest of the migration can run from the CLI.

---

## 3. Migration phases

Throughout: `--profile default` = old account, `--profile looplic-new` = new account.

> **Phases A–C are scripted.** See [`scripts/migrate/`](../scripts/migrate/README.md):
> `./migrate.sh preflight | rds | s3 | iam | amplify | verify`. Every phase is
> idempotent, and `preflight` is read-only. The prose below documents intent and
> the manual decisions; the script is the executable form. Phase D is manual by
> design.

### Phase A — Database

The dataset is small, so a logical dump/restore is simpler and safer than
cross-account snapshot sharing (and avoids KMS grant complexity).

1. Create the new RDS instance in the target account — same engine version
   (**PostgreSQL 16.14**), `db.t3.micro`, 20 GB gp3, storage autoscaling on,
   automated backups 7 days, initial DB name `looplic`, master user
   `looplic_admin`. Consider **not** making it publicly accessible this time.
2. Security group: allow 5432 from your IP for the migration window, and from the
   Amplify egress afterwards.
3. Dump and restore:
   ```bash
   pg_dump "$OLD_DATABASE_URL" --no-owner --no-acl -Fc -f looplic.dump
   pg_restore -d "$NEW_DATABASE_URL" --no-owner --no-acl looplic.dump
   ```
4. Verify: row counts per table match, and spot-check `bookings`, `blog_posts`,
   `models`, `buyback_*`, and the WhatsApp flow tables.
5. **Take a manual snapshot of the OLD instance before you start.** There are
   currently zero manual snapshots, so there is no rollback point today.

> Note: `packages/db/schema.ts`, `rds-schema.sql`, and `scripts/migrate-whatsapp-flow.sql`
> have uncommitted local changes. Decide whether the new DB should be restored
> from prod as-is (recommended) and those migrations applied separately.

### Phase B — S3

```bash
aws s3 mb s3://looplic-assets --region ap-south-1 --profile looplic-new
aws s3 sync s3://looplic-assets s3://looplic-assets \
  --source-region ap-south-1 --region ap-south-1 \
  --profile looplic-new   # requires a cross-account read grant, or sync via local disk
```
1.29 MB / 18 objects — honestly, syncing down to local disk and back up is fine
and avoids setting up cross-account bucket policies.

Then reapply, from the captured configs in `migration-capture/s3/`:

1. **Disable all four public-access-block flags first.** They are all `false` on
   the old bucket, but new buckets default them to `true`, which will reject the
   public-read policy — possibly without an obvious error. This is the single
   easiest way to reproduce the old `403-on-image-display` bug.
2. Set `ObjectOwnership: BucketOwnerEnforced` (ACLs disabled; public read is
   policy-only).
3. Apply the `PublicReadGetObject` policy on `arn:aws:s3:::<bucket>/*` — the
   **entire** bucket, not `public/*`.
4. Apply CORS. Consider adding the `admin`/`operator`/`tech` subdomains to
   `AllowedOrigins`; they're absent today, which is harmless only because uploads
   go server-side via `/api/upload` rather than browser presigned PUTs.

Bucket name can stay `looplic-assets` (S3 names are globally unique, so the old
bucket must be deleted first) — or pick a new name and update
`NEXT_PUBLIC_S3_BUCKET` on all four apps.

### Phase C — Amplify apps

For each of the four apps:

1. Create the app in the new account, connect the GitHub repo, branch `master`.
2. Set `AMPLIFY_MONOREPO_APP_ROOT` to the correct `apps/*` value.
3. Copy env vars — **rewriting these**: `DATABASE_URL` (new endpoint),
   `APP_AWS_ACCESS_KEY_ID` / `APP_AWS_SECRET_ACCESS_KEY` (new IAM user),
   `NEXT_PUBLIC_S3_BUCKET` (if renamed). Copy as-is: `SUPABASE_*`, `RESEND_*`,
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_APP_URL`, `DATABASE_SSL`,
   `NEXT_PUBLIC_AWS_REGION`, `NEXT_PUBLIC_S3_REGION`.
   - Also carry over anything added since this inventory:
     `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `ANTHROPIC_API_KEY` and the WhatsApp
     Meta tokens if the WhatsApp bot has shipped by cutover.
   - `NEXT_PUBLIC_APP_URL` is **missing on technician** in the old account. Set it
     to `https://tech.looplic.com` in the new one rather than replicating the gap.
4. Reproduce the **user app's customRule** — apex `https://looplic.com` →
   `https://www.looplic.com` `[301]`. This lives in Amplify rewrite rules, not in
   code; missing it regresses the SEO canonicalisation fix.
   - Do **not** reproduce the `/<*>` → `/index.html` `[404-200]` rule found on
     admin/operator/technician. It is a leftover static-SPA default and is wrong
     for a `WEB_COMPUTE` Next.js app.
5. **`customHeaders` is empty on all four apps** — nothing to migrate. (Earlier
   drafts of this runbook wrongly assumed `sw.js` headers were set here.)
6. **Create all four apps with no inline `buildSpec`**, so they use the repo
   `amplify.yml`. In the old account, admin/technician/operator each carry an
   inline buildSpec that overrides the repo file — and the operator's is a stale
   copy of the monorepo spec that is **missing its own `apps/operator` block**.
   Builds only succeed there because Amplify falls back to the repo `amplify.yml`.
   Don't carry that ambiguity forward; captured copies are in
   `migration-capture/amplify/*-buildspec.yml` for reference.
7. Let Amplify create standard SSR logging service roles for all four. Do **not**
   replicate the old user-app role (`AmplifyLooplickServiceRole`), which holds
   `AdministratorAccess-Amplify` + `AmazonS3FullAccess` + `AmazonCognitoPowerUser`
   — far broader than needed, and the Cognito grant is for dead code.
8. Set `AMPLIFY_DIFF_DEPLOY` where the old app had it (admin/operator/technician).
9. Deploy and test each app on its `*.amplifyapp.com` URL **before** touching DNS.

### Phase D — Cutover

Run at a low-traffic hour (~3am IST). The ordering below is the whole point:
**the old stack is moved onto the new database before DNS moves**, so during DNS
propagation both stacks write to the same DB and there is no split brain.

**D0 — final data sync + repoint (the only sensitive window)**

1. Re-run the Phase A dump/restore to pick up anything written since. The DB is
   small enough that this takes minutes, not hours.
2. Immediately update `DATABASE_URL` on all four **old** Amplify apps to the new
   RDS endpoint, and redeploy them.
3. Verify the old stack is serving correctly off the new DB — a booking made on
   `looplic.com` right now should land in the new database.

From here, the new database is the single source of truth for both stacks. Only
writes landing during the dump itself (a couple of minutes) are at risk; at 3am
that is effectively zero. If booking volume ever makes that unacceptable, add a
brief read-only window around step 1 only.

**D1 — DNS**

> **The zone is far more than Amplify records.** Of the 19 records, several belong
> to third parties and will break silently if dropped. Full table in
> `migration-capture/MANIFEST.md`; the critical ones:
>
> | Record | Points at | If lost |
> |---|---|---|
> | `MX looplic.com` | `SMTP.GOOGLE.COM` | **Google Workspace inbound mail stops** |
> | `MX/TXT send.looplic.com` | `feedback-smtp.ap-northeast-1.amazonses.com`, SPF | Resend bounce handling + SPF break |
> | `TXT resend._domainkey` | DKIM key | Transactional email fails DKIM |
> | `TXT _dmarc` | `v=DMARC1; p=none;` | DMARC policy lost |
> | `TXT looplic.com` | `google-site-verification=…` | **Search Console verification lost** |
> | `CNAME quotation.looplic.com` | `…vercel-dns-017.com` | **A Vercel-hosted subdomain goes dark** |
>
> `quotation.looplic.com` is hosted on **Vercel**, not AWS — which is why it was
> absent from the AWS resource inventory. It still needs recreating in the new zone.
>
> **Do NOT copy** the four `_*.looplic.com` ACM validation CNAMEs pointing at
> `jkddzztszm.acm-validations.aws` — they are bound to the old account's
> certificates. The new account's Amplify issues its own and adds fresh ones.

1. Create the `looplic.com` hosted zone in the new account.
2. Recreate the records from `migration-capture/route53/looplic.com-records.json`,
   excluding `SOA`, `NS`, and the four ACM validation CNAMEs (15 of 19 records).
3. Add the custom domains in the new Amplify apps; let Amplify provision managed
   certs and add its validation + ALIAS records.
4. Lower TTLs on the old zone to 300s **at least 24h before** cutover.
5. Repoint the registrar delegation at Hostinger to the **new** zone's four
   nameservers. Remove any `dns-parking` NS.
6. Verify from multiple resolvers (`8.8.8.8`, `1.1.1.1`) and re-verify at 24h.
7. Do **not** recreate the orphaned `www.looplic.com` hosted zone.

### Phase E — Verify

- All four domains serve over HTTPS with valid certs
- Apex → www 301 works
- Admin login (Supabase auth) works
- Booking flow end-to-end, including a real DB write
- Admin image upload → displays without a 403 (the S3 policy check)
- Blog pages render from DB (not 404 — the ISR/404-caching bug rides on DB errors
  being thrown, so a misconfigured `DATABASE_URL` will show as cached 404s)
- Emails send via Resend

### Phase F — Decommission

Only after a **7-day** soak:

1. Final snapshot of old RDS, then delete the instance.
2. Delete old Amplify apps, S3 bucket, Route53 zones (both), the abandoned Cognito
   pool, and the `looplic-developer` IAM user in the old account.
3. Confirm the old account's Looplic line items drop off the next bill.

---

## 4. Risks

| Risk | Mitigation |
|---|---|
| No rollback point on the DB today | Take a manual snapshot before Phase A |
| Static AWS keys in Amplify env get copied forward | Mint new scoped keys; never reuse |
| Hostinger NS regression | Verify delegation at cutover **and** at 24h |
| S3 bucket-name collision (global namespace) | Either delete old bucket first, or rename and update env |
| Missing the apex→www 301 customRule | Console-only config, not in the repo — set explicitly (Phase C step 4) |
| New S3 bucket blocks the public-read policy | Disable all 4 public-access-block flags before applying the policy |
| Dropping Workspace MX / Resend SPF+DKIM / GSC TXT / the Vercel `quotation` CNAME | Recreate from the captured zone export; verify mail flow after cutover |
| Copying stale ACM validation CNAMEs | Exclude them; the new account issues its own certs |
| Uncommitted local schema changes | Reconcile before restoring, so new DB matches prod |
| Free-tier expiry on new account | New account gets fresh 12-month free tier — a genuine upside |

---

## 5. Estimated downtime

**Zero user-visible downtime.** The new stack is fully built and tested on
`*.amplifyapp.com` URLs before DNS moves, and the old stack is repointed at the
new database before DNS moves (Phase D0). During DNS propagation (5–30 min with
300s TTLs) some users hit the old stack and some the new — but both are talking
to the same database, so it doesn't matter which one they get.

The only at-risk moment is the few minutes of the final `pg_dump` in D0, run at
~3am IST. No maintenance banner, no read-only window.
