# Multi-App Deployment — Looplic

This repo is now an **npm-workspaces monorepo** with three independently
deployable Next.js apps that share **one database**:

| App | Folder | Subdomain | Purpose |
|-----|--------|-----------|---------|
| Customer | repo root (`app/`, `src/`) | `www.looplic.com` | Public marketing + booking |
| Admin | `apps/admin` | `admin.looplic.com` | Admin **+ operator** back-office |
| Technician | `apps/technician` | `tech.looplic.com` | Technician dashboard |

Shared code:

| Package | Folder | Shared by |
|---------|--------|-----------|
| `@looplic/db` | `packages/db` | all three apps — the **common database** (Drizzle schema + pooled pg client) |

> **Why this layout?** Each app builds and deploys on its own. If the customer
> site has a bad deploy or a traffic spike, `admin.looplic.com` and
> `tech.looplic.com` keep running because they are separate Amplify apps /
> Lambdas. They stay integrated because all three talk to the **same RDS
> database** through the identical `@looplic/db` schema.

---

## How the "common database" works

`packages/db` is the single source of truth for the schema and the connection
pool. Each app's `src/lib/db` simply re-exports it:

```ts
// src/lib/db/index.ts  (in every app)
export * from "@looplic/db";
```

So all existing `@/src/lib/db` / `@/lib/db` imports keep working unchanged, and
there is exactly one schema definition. **A schema change is made once in
`packages/db/schema.ts` and every app picks it up.**

### Running migrations
Run Drizzle from the repo root (or from `packages/db`) against the one RDS
instance — never per-app:

```bash
# from repo root, with DATABASE_URL set
npx drizzle-kit push        # or: generate + migrate
```

---

## Local development

```bash
npm install                 # once, at repo root — links all workspaces

npm run dev                 # customer app (root)        -> http://localhost:3000
npm run dev -w @looplic/admin        # admin             -> http://localhost:3001
npm run dev -w @looplic/technician   # technician        -> http://localhost:3002
```

Each app reads its own `.env.local`. Copy `.env.example` into each app folder
and fill in the same values (they share one DB, so `DATABASE_URL` is identical).

> Note: per the project's known constraint, `next dev` can be memory-heavy in
> the sandbox. Validate with `npx tsc --noEmit` per app and via Amplify preview
> builds rather than relying on localhost.

---

## ☁️ AWS deployment — steps YOU need to do

The code is ready. These are the **manual AWS Console / CLI actions** required to
go live. Nothing here auto-deploys until you do them.

### Prerequisite — one RDS database (already exists)
All three apps point `DATABASE_URL` at the **same** existing RDS instance. No new
database needed. ✅

### Step 1 — Create two new Amplify apps (admin + technician)

The existing Amplify app keeps serving the **customer** site from the repo root.
You add **two more** Amplify apps from the **same GitHub repo**, each with a
different monorepo app root.

For **admin**:
1. Amplify Console → **New app → Host web app**.
2. Connect the same GitHub repo, branch `main` (or your release branch).
3. When asked about monorepo: enable **"My app is a monorepo"** and set
   **app root = `apps/admin`**.
4. Build settings: Amplify auto-detects `apps/admin/amplify.yml`. If not, paste
   its contents.
5. Platform must be **Next.js SSR (WEB_COMPUTE)** — same as the customer app.
6. Create app.

Repeat for **technician** with **app root = `apps/technician`**.

> CLI alternative per app:
> ```bash
> aws amplify create-app --name looplic-admin --repository <repo-url> \
>   --platform WEB_COMPUTE --region ap-south-1
> aws amplify create-branch --app-id <ADMIN_APP_ID> --branch-name main \
>   --environment-variables ... \
>   --framework "Next.js - SSR"
> # set AMPLIFY_MONOREPO_APP_ROOT=apps/admin in the branch/app env vars
> ```
> In the Console the monorepo app-root toggle is the reliable path.

### Step 2 — Set environment variables on EACH new app

In Amplify Console → app → **Hosting → Environment variables**, add the SAME
server vars the customer app already uses (they all hit one DB). Required:

```
DATABASE_URL=postgresql://<user>:<pass>@<rds-endpoint>.ap-south-1.rds.amazonaws.com:5432/looplic
DATABASE_SSL=true
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
NEXT_PUBLIC_S3_BUCKET=looplic-assets
NEXT_PUBLIC_S3_REGION=ap-south-1
S3_UPLOAD_ROLE_ARN=...
RESEND_API_KEY=...
RESEND_LEADS_TO=...
RESEND_FROM_EMAIL=...
RESEND_REPLY_TO=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_APP_URL=https://admin.looplic.com   # tech.looplic.com on the technician app
```

> The `amplify.yml` in each app writes the `DATABASE_*/SUPABASE_*/RESEND_*/
> APP_AWS_*/NEXT_PUBLIC_*` vars into `.env.production` at build time, which fixes
> the Amplify SSR "env undefined at runtime → ECONNREFUSED 127.0.0.1:5432"
> problem the customer app already solved.

### Step 3 — Point the RDS security group at the new apps
The new Amplify SSR Lambdas need network access to RDS exactly like the customer
app. If RDS is publicly reachable with SSL (current setup), nothing changes. If
you later move RDS into a VPC, attach the same VPC config to all three apps.

### Step 4 — Add the subdomains (Route 53)

In each new Amplify app → **Hosting → Custom domains → Add domain**:
- Admin app → add subdomain **`admin`** of `looplic.com` → maps to `admin.looplic.com`.
- Technician app → add subdomain **`tech`** of `looplic.com` → maps to `tech.looplic.com`.

Amplify creates the ACM cert + the CNAME/ALIAS records. Because `looplic.com` is
on **Route 53** (per project DNS setup), accept the auto-created records, or add
them manually in the hosted zone:
- `admin.looplic.com` → Amplify domain target of the admin app
- `tech.looplic.com`  → Amplify domain target of the technician app

Each app's `middleware.ts` already forces its own subdomain as canonical and
redirects the raw `*.amplifyapp.com` URL to it.

### Step 5 — Deploy & verify
Push to the connected branch → each Amplify app builds **only its own app root**.
Verify:
- `https://admin.looplic.com/admin/login` loads the admin login.
- `https://admin.looplic.com/operator/login` loads the operator login.
- `https://tech.looplic.com/technician` loads the technician dashboard.
- `https://www.looplic.com` unchanged.

---

## Follow-up (after subdomains are verified live)

To make the customer app "customer-only" (optional clean-up — NOT done yet to
keep this PR safe and additive):

1. Delete `app/admin`, `app/operator`, `app/operation`, `app/technician` and the
   back-office-only API routes (`app/api/admin/*`, `app/api/technician/*`) from
   the **root** customer app.
2. Add redirects in root `next.config.ts` so old links forward to the new
   subdomains, e.g.:
   ```ts
   { source: "/admin/:path*",      destination: "https://admin.looplic.com/admin/:path*", permanent: true },
   { source: "/operator/:path*",   destination: "https://admin.looplic.com/operator/:path*", permanent: true },
   { source: "/technician/:path*", destination: "https://tech.looplic.com/technician/:path*", permanent: true },
   ```
3. Prune now-unused back-office components from the root `src/components/next`
   (`AdminDashboardClient`, `OperationDashboardClient`, `TechnicianDashboardClient`, etc.).

**Merge order matters:** do this clean-up only *after* the admin/tech subdomains
are confirmed working, otherwise back-office access has a gap.

## Optional: rename root → `apps/user`
For full symmetry you can later `git mv` the customer `app/`, `src/`, and configs
into `apps/user/`. It is safe (the `@/*` → `./*` aliases are relative to the app
root) but requires updating the customer Amplify app's app-root to `apps/user`.
Deferred to keep the live customer deployment untouched for now.
