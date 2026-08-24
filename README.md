# Looplic

Next.js monorepo for Looplic — doorstep mobile repair, CCTV installation, desktop assembly, IT support, and managed IT services.

## Architecture

Multi-app monorepo using npm workspaces:

| App | Port | Description |
|-----|------|-------------|
| `apps/user` | 3000 | Customer-facing booking flow (looplic.com) |
| `apps/admin` | 3001 | Admin dashboard for managing bookings, technicians, blog |
| `apps/technician` | 3002 | Technician portal for job management |
| `apps/operator` | 3003 | Operator portal for dispatching and coordination |

Shared packages:
- `packages/db` — Drizzle ORM schema and database connection (PostgreSQL/Supabase)

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.8
- **Database:** PostgreSQL via Supabase + Drizzle ORM
- **UI:** Tailwind CSS 3 + Radix UI + shadcn/ui
- **Auth:** Supabase Auth with SSR
- **State:** TanStack React Query
- **Hosting:** Vercel / AWS Amplify
- **Storage:** AWS S3 (assets), Upstash Redis (caching)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase/AWS credentials

# Run all apps in development
npm run dev

# Run a single app
npm run dev:user
npm run dev:admin
npm run dev:technician
npm run dev:operator
```

## Scripts

```bash
# Build individual apps
npm run build:user
npm run build:admin
npm run build:technician
npm run build:operator

# Push database schema changes
npm run db:push
```

## Project Structure

```
├── apps/
│   ├── user/          # Customer app (looplic.com)
│   ├── admin/         # Admin dashboard
│   ├── technician/    # Technician portal
│   └── operator/      # Operator portal
├── packages/
│   └── db/            # Shared database schema (Drizzle)
├── scripts/           # DB migrations, seed data, utilities
├── docs/              # WhatsApp API, AWS migration docs
└── migration-capture/ # AWS → Supabase migration artifacts
```

## Documentation

- [AWS Setup Guide](./AWS_SETUP_GUIDE.md)
- [Multi-App Deployment](./MULTI_APP_DEPLOYMENT.md)
- [WhatsApp Cloud API Setup](./docs/whatsapp-cloud-api-setup.md)
- [WhatsApp Guided Booking](./docs/whatsapp-guided-booking.md)
- [AWS Account Migration Runbook](./docs/aws-account-migration-runbook.md)
