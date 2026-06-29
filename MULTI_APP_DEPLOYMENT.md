# Multi-App Deployment — Looplic

This repo is an **npm-workspaces monorepo** with three independently deployed
Next.js apps that share **one database**. All three are live:

| App | Folder | Subdomain | `AMPLIFY_MONOREPO_APP_ROOT` | Purpose |
|-----|--------|-----------|------------------------------|---------|
| Customer | `apps/user` | `www.looplic.com` | `apps/user` | Public marketing + booking |
| Admin | `apps/admin` | `admin.looplic.com` | `apps/admin` | Admin **+ operator** back-office |
| Technician | `apps/technician` | `tech.looplic.com` | `apps/technician` | Technician dashboard |

Shared code:

| Package | Folder | Shared by |
|---------|--------|-----------|
| `@looplic/db` | `packages/db` | all three apps — the **common database** (Drizzle schema + pooled pg client) |

> **Why this layout?** Each app is its **own Amplify app** with its own build,
> Lambda, and subdomain. If the customer site has a bad deploy or a traffic
> spike, `admin.looplic.com` and `tech.looplic.com` keep running. They stay
> integrated because all three talk to the **same RDS database** through the
> identical `@looplic/db` schema.

```
looplic/                       (repo root = workspace manager only)
├─ amplify.yml                 (ONE monorepo build spec — applications[] block per app)
├─ package.json                (npm workspaces: apps/*, packages/*)
├─ apps/
│  ├─ user/                    → www.looplic.com   (customer-only)
│  ├─ admin/                   → admin.looplic.com (admin + operator)
│  └─ technician/              → tech.looplic.com
└─ packages/
   └─ db/                      @looplic/db — the common database
```

---

## How the "common database" works

`packages/db` is the single source of truth for the schema and the connection
pool. Each app's `src/lib/db` just re-exports it:

```ts
// apps/<app>/src/lib/db/index.ts
export * from "@looplic/db";
```

So all existing `@/src/lib/db` / `@/lib/db` imports keep working unchanged, and
there is exactly one schema definition. **A schema change is made once in
`packages/db/schema.ts` and every app picks it up.** Each app's `next.config.ts`
has `transpilePackages: ["@looplic/db"]` so the shared package compiles into the
app bundle.

### Running migrations
Run Drizzle from the repo root against the one RDS instance — never per-app:

```bash
# from repo root, with DATABASE_URL set
npm run db:push          # uses packages/db/drizzle.config.ts
```

---

## Local development

```bash
npm install              # once, at repo root — links all workspaces

npm run dev:user         # customer    -> http://localhost:3000
npm run dev:admin        # admin        -> http://localhost:3001
npm run dev:technician   # technician   -> http://localhost:3002
```

Each app reads its own `apps/<app>/.env.local`. They share one DB, so
`DATABASE_URL` is identical across them.

> Note: `next dev` is memory-heavy for this project. Validate with
> `npx tsc --noEmit` inside an app folder and via Amplify builds rather than
> relying on localhost.

---

## How the monorepo build works (`amplify.yml`)

There is **one** `amplify.yml` at the repo root in Amplify's **`applications[]`**
format — one `appRoot` block per app. **This is required:** Amplify monorepo
builds read the root spec and reject the single-app `frontend:` format with
`CustomerError: Monorepo spec provided without "applications" key`. Per-app
`amplify.yml` files are ignored.

Each Amplify app selects its block via the **`AMPLIFY_MONOREPO_APP_ROOT`** env
var (the console sets this when you mark the app as a monorepo). Each block:

- `buildPath: '/'` → installs/builds from the repo root so the npm workspace and
  `@looplic/db` resolve.
- `npm ci` at the root, then `npm run build -w @looplic/<app>`.
- Writes server env into `apps/<app>/.env.production` at build time (Amplify
  WEB_COMPUTE injects env only at build time; this fixes the runtime
  `ECONNREFUSED 127.0.0.1:5432` from `DATABASE_URL` being undefined).
- `artifacts.baseDirectory: apps/<app>/.next`.

---

## ☁️ AWS setup reference (already done — keep for re-creating an app)

### One RDS database
All three apps point `DATABASE_URL` at the **same** existing RDS instance
(`ap-south-1`). No per-app database.

### Creating an Amplify app for one folder
1. Amplify Console (ap-south-1) → **Create new app** → GitHub →
   repo `shreyas-gupta-dev/Looplic`, branch `master`.
2. Check **"My app is a monorepo"** → app root = e.g. `apps/admin`.
   (Amplify sets `AMPLIFY_MONOREPO_APP_ROOT=apps/admin`.)
3. App settings: framework auto-detects **Next.js (SSR / WEB_COMPUTE)**; create
   the SSR service role when prompted.
4. The root `amplify.yml` is used automatically.

> For the **existing** customer app, it was switched to monorepo by manually
> adding `AMPLIFY_MONOREPO_APP_ROOT=apps/user` in its env vars.

### Environment variables (set on EACH app)
Copy the same values to all three; only `NEXT_PUBLIC_APP_URL` differs.

```
DATABASE_URL=postgresql://<user>:<pass>@<rds-endpoint>.ap-south-1.rds.amazonaws.com:5432/looplic
DATABASE_SSL=true
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_AWS_REGION=ap-south-1
APP_AWS_ACCESS_KEY_ID=...        # Amplify RESERVES the AWS_ prefix → use APP_AWS_*
APP_AWS_SECRET_ACCESS_KEY=...    # the code reads APP_AWS_* first
NEXT_PUBLIC_S3_BUCKET=looplic-assets
NEXT_PUBLIC_S3_REGION=ap-south-1
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Looplic <noreply@looplic.com>
RESEND_LEADS_TO=...
RESEND_REPLY_TO=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_APP_URL=https://admin.looplic.com   # www / tech per app
```

Amplify also auto-adds `AMPLIFY_MONOREPO_APP_ROOT` and `AMPLIFY_DIFF_DEPLOY`.

### Custom domains (Route 53, same account)
Each app → **Hosting → Custom domains → Add domain** → enter the subdomain
directly (`admin.looplic.com` / `tech.looplic.com` / `www.looplic.com`), keep the
single root mapping → `master`, remove any auto-added `www.<sub>` row, and use
**Amplify managed certificate** (not the existing `www.looplic.com` cert).
Amplify issues an ACM cert and writes the Route 53 records automatically.

Each app's `middleware.ts` forces its own subdomain as canonical and 308s the
raw `*.amplifyapp.com` URL to it.

### Supabase auth allowlist
Supabase → **Authentication → URL Configuration → Redirect URLs** must include
(with scheme + wildcard):
```
https://www.looplic.com/**
https://admin.looplic.com/**
https://tech.looplic.com/**
```

---

## Customer app is customer-only

The back-office routes/components were removed from `apps/user`, and old links
redirect to the subdomains (in `apps/user/next.config.ts`):

```
/admin/*      -> https://admin.looplic.com/admin/*
/operator/*   -> https://admin.looplic.com/operator/*
/operation/*  -> https://admin.looplic.com/operation/*
/technician/* -> https://tech.looplic.com/technician/*
```

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Monorepo spec provided without "applications" key` | The root `amplify.yml` isn't in `applications[]` format, or an app lacks `AMPLIFY_MONOREPO_APP_ROOT`. |
| Build fails at `npm ci` | Must install from repo root — `buildPath: '/'` handles this; don't run `npm ci` inside an app folder. |
| `ECONNREFUSED 127.0.0.1:5432` at runtime | A server env var (esp. `DATABASE_URL`) is missing on that Amplify app. |
| "Welcome… create your first deployment / index.html" page | No successful build yet, **or** the app platform is `Web` (static) instead of `Web compute`. Fix: `aws amplify update-app --app-id <id> --platform WEB_COMPUTE --region ap-south-1`, then redeploy. |
| Admin/tech login redirect fails | Add the subdomain to the Supabase redirect allowlist (above). |
