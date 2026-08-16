# Migration prerequisites — detailed steps

Three things must exist before `./migrate.sh preflight` can run. Steps 1 and 2
are done in a browser; step 3 is GitHub.

---

## ⚠️ Read this first

**`looplic.com@gmail.com` is already the root email of the existing account
`041149335823`.** An email address can be the root user of only ONE AWS account,
so signup with it will be rejected.

Use a **plus-alias** instead — Gmail delivers `looplic.com+xxx@gmail.com` to the
same inbox, and AWS treats it as a distinct address:

```
looplic.com+aws-prod@gmail.com
```

This also keeps the two accounts' root identities cleanly separate, which is the
point of the migration.

---

## Step 1 — Create the new AWS account

### 1.1 Start signup

1. Open <https://portal.aws.amazon.com/billing/signup> in a **private/incognito
   window** (so an existing AWS session doesn't interfere).
2. **Root user email address:** `looplic.com+aws-prod@gmail.com`
3. **AWS account name:** `Looplic` (this is a label; it can be changed later)
4. Click **Verify email address**, then enter the 6-digit code from the inbox.
5. Set the **root password**. Use the password manager — this password should
   never be typed routinely, because you will stop using root after step 1.6.

### 1.2 Account type and contact

- Choose **Business** (you're invoicing customers and will want GST treatment).
- Company name, phone, and the SJP Road, Bengaluru 560002 address.
- Because the address is in India, the account is billed through **AISPL**
  (Amazon Internet Services Pvt Ltd), not AWS Inc. Consequences:
  - Invoices are INR with **GST**. Enter the company **GSTIN** during signup to
    claim input tax credit — retrofitting it later is painful.
  - AISPL accounts **cannot** join an AWS Organization containing AWS Inc
    accounts. Irrelevant here (we chose standalone), but don't be surprised.

### 1.3 Payment card — Arfath does this himself

Arfath enters the card directly in the AWS billing form. Do not collect the
number by message, email, or screenshot, and don't put it in this repo.

Practical notes for Indian cards:
- AWS makes a small temporary authorization (~₹2 / $1) to validate the card. It
  is reversed automatically.
- Indian cards often need an **OTP / 3-D Secure** step. Arfath must be holding
  the phone registered to the card.
- Indian **debit** cards frequently fail AWS validation because of RBI recurring
  e-mandate rules. A **credit** card is much more likely to work first try. If
  the card is rejected, that's the usual cause, not a mistake in the form.

### 1.4 Identity verification

Choose SMS or voice call, enter the CAPTCHA, and enter the code received. The
phone number must be reachable at that moment.

### 1.5 Support plan

Choose **Basic support — Free**. Nothing about this migration needs a paid plan.

### 1.6 Wait for activation, then verify

AWS emails "Your AWS account is ready". This is usually a few minutes but **can
take several hours**. Resource creation may fail with confusing permission errors
until activation completes — if `migrate.sh rds` fails oddly on a brand-new
account, check activation before debugging anything else.

### 1.7 Secure the root user — do this immediately

1. Sign in as root → click your account name (top right) → **Security
   credentials**.
2. **Multi-factor authentication → Assign MFA device.** Use an authenticator app
   (or a hardware key). Store the recovery codes in the password manager.
3. Confirm there are **no root access keys**. If any exist, delete them. Root
   should never have access keys.

### 1.8 Set a billing alarm before deploying anything

1. Root → **Billing and Cost Management → Billing preferences** → enable
   **Receive Free Tier usage alerts** and **Receive AWS Bills by email**.
2. **Budgets → Create budget** → Cost budget → monthly → set ₹2,000 (adjust to
   taste) → alert at 80% and 100% → email `looplic.com@gmail.com`.

A brand-new account gets a fresh **12-month free tier**, so `db.t3.micro` RDS and
the S3 volume here should cost approximately nothing. The alarm is to catch
mistakes, not expected spend.

---

## Step 2 — IAM admin user + CLI profile

Never use root for day-to-day work, and never put root credentials in the CLI.

### 2.1 Create the user

1. Signed in as root → **IAM → Users → Create user**
2. **User name:** `looplic-developer`
3. Tick **Provide user access to the AWS Management Console** only if you want a
   console login too. For the CLI-driven migration it isn't required.
4. **Next → Permissions → Attach policies directly → `AdministratorAccess`**

   Why admin: the migration itself creates IAM users, roles, and policies
   (`migrate.sh iam`), plus RDS, S3, Amplify, and Route53 resources. Scoping this
   precisely is more work than it's worth for a one-off. **After the migration is
   verified, replace it** with something narrower — and note the old account's
   mistake was leaving an admin *key* in application env vars, which
   `migrate.sh iam` explicitly avoids by minting a separate S3-only user for the
   apps.
5. **Create user.**

### 2.2 Add MFA to this user too

IAM → Users → `looplic-developer` → **Security credentials → Assign MFA device**.

### 2.3 Create an access key

1. IAM → Users → `looplic-developer` → **Security credentials** tab
2. **Access keys → Create access key**
3. Use case: **Command Line Interface (CLI)** → tick the confirmation → Next
4. **Download the .csv** or copy both values now. The secret is shown **once**.

### 2.4 Configure the CLI profile

Run this **yourself** in a terminal. Do not paste the key into a chat window —
the prompts don't echo it into any transcript.

```bash
aws configure --profile looplic-new
```

Four prompts, in order:

```
AWS Access Key ID [None]:     AKIA...            <- from the .csv
AWS Secret Access Key [None]: ....               <- from the .csv
Default region name [None]:   ap-south-1
Default output format [None]: json
```

### 2.5 Confirm it works and points at the right account

```bash
aws sts get-caller-identity --profile looplic-new
```

You want an `Account` that is **NOT** `041149335823`, and an `Arn` ending in
`user/looplic-developer`. If you see `041149335823`, you've configured the old
account — `migrate.sh preflight` will refuse to run, but fix the profile anyway.

---

## Step 3 — GitHub personal access token

Amplify needs to read the repo and create a webhook. The existing apps use
`repositoryCloneMethod=TOKEN`, so a PAT is sufficient — no console OAuth flow.

### 3.1 Create the token

**Classic token (simplest, recommended here):**

1. <https://github.com/settings/tokens> → **Generate new token → classic**
2. **Note:** `looplic-amplify-migration`
3. **Expiration:** 30 days is plenty — this is only needed during the migration.
4. **Scopes:** tick
   - `repo` (full control of private repositories — needed to read the source)
   - `admin:repo_hook` (needed so Amplify can install its build webhook)
5. **Generate token** and copy it. Shown only once.

The repo is `shreyas-gupta-dev/Looplic`, which you don't own but have write access
to. A classic token inherits your access, so this works. Fine-grained tokens are
more restrictive across account boundaries and are likelier to fail here — if you
prefer one anyway, it needs Contents: read, Metadata: read, and Webhooks:
read/write on that specific repo, and the repo owner may need to approve it.

### 3.2 Export it

`migrate.sh` is a bash script, so run it in **Git Bash**, not PowerShell:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

If you must use PowerShell for something else, the equivalent is
`$env:GITHUB_TOKEN = "ghp_..."` — but the migration script itself needs bash.

The variable lives only in that shell session. Re-export it if you open a new
terminal. Don't add it to `.env` or commit it anywhere.

### 3.3 Revoke it afterwards

Once the four Amplify apps are created and building, delete the token at
<https://github.com/settings/tokens>. Amplify stores its own connection; it does
not need your PAT to keep working.

---

## Then run

```bash
cd scripts/migrate
./migrate.sh preflight     # read-only; verifies all three prerequisites
```

`preflight` checks the capture directory, both profiles, `pg_restore`, and name
collisions, and makes **no changes**. If it passes, proceed with `rds`.

---

## Quick checklist

- [ ] Account created with `looplic.com+aws-prod@gmail.com` (NOT the bare address)
- [ ] GSTIN entered during signup
- [ ] Card entered by Arfath himself; OTP completed
- [ ] "Your AWS account is ready" email received
- [ ] Root MFA enabled; no root access keys
- [ ] Billing budget + free-tier alerts on
- [ ] `looplic-developer` IAM user created, MFA added
- [ ] `aws sts get-caller-identity --profile looplic-new` shows the NEW account id
- [ ] `GITHUB_TOKEN` exported in the Git Bash session
- [ ] `./migrate.sh preflight` passes
