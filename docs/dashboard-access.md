# Dashboard access

Every Looplic app authenticates against the same Supabase project. Authorization
is a separate concern: it comes from the `user_roles` table in Postgres. A user
with no row in `user_roles` is a customer.

## Apps, ports and roles

| App | Local port | Local URL | Production | Required role |
| --- | --- | --- | --- | --- |
| `apps/user` | 3000 | http://localhost:3000 | https://www.looplic.com | none (customers) |
| `apps/admin` | 3001 | http://localhost:3001/admin | https://admin.looplic.com/admin | `admin` |
| `apps/technician` | 3002 | http://localhost:3002/technician | https://tech.looplic.com/technician | `technician` |
| `apps/operator` | 3003 | http://localhost:3003/operator | https://admin.looplic.com/operator | `operation` |

Note the role name for the operator portal is `operation`, not `operator`. The
admin app also serves `/operation` for that role.

Start everything with `npm run dev` from the repo root, or one app at a time with
`npm run dev:user` / `dev:admin` / `dev:technician` / `dev:operator`.

## Local test credentials

**These are local test accounts only. Do not use them for staging or production.**
They live on the `@looplic.local` domain precisely so they can never receive real
email. For real staging or production accounts, create the user in the Supabase
dashboard, insert the matching `user_roles` row, and share the credentials out of
band — never in this repository.

| Dashboard | Email | Password | Role row |
| --- | --- | --- | --- |
| Admin | `admin@looplic.local` | `Admin123!` | `admin` |
| Operator | `operator@looplic.local` | `Operator123!` | `operation` |
| Technician | `technician@looplic.local` | `Technician123!` | `technician` |
| Customer (user app) | `customer@looplic.local` | `Customer123!` | *none, by design* |

The customer account also gets a `customer_profiles` row so `/account` has
something to display.

## Creating and verifying the accounts

```bash
# Create or update all four accounts. Safe to re-run; it is idempotent.
node scripts/seed-dashboard-users.cjs

# Prove each one works and that none can reach a dashboard it should not.
node scripts/verify-dashboard-users.cjs
```

Both scripts read `apps/user/.env.local` for `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `DATABASE_URL`.

`verify-dashboard-users.cjs` signs in exactly the way the apps do
(`signInWithPassword` with the anon key, then a `user_roles` lookup) and then
walks the full 4 x 3 account/role matrix, so it fails if an account is missing a
role it needs **or** holds a role it should not. It exits non-zero on any failure,
so it can be used as a gate.

Expected output: `17 passed, 0 failed`.

## Changing a password

Edit the `USERS` array in `scripts/seed-dashboard-users.cjs` and re-run it; the
script updates the password of an existing user rather than failing.

## Granting a role to a real user

```sql
-- Find the Supabase auth user id first (Dashboard → Authentication → Users).
insert into user_roles (user_id, role) values ('<auth-user-uuid>', 'admin');
```

Valid roles are `admin`, `operation`, `technician`. Removing the row removes
dashboard access; the account remains usable as a customer.

## Customer sign-in and account recovery

Customers sign in at `/auth` on the user app. Both sign-in and sign-up are
OTP-gated: a one-time code goes to the email address or phone number, and only
then is the password accepted.

A customer who has forgotten their password uses **Forgot your password?** on the
sign-in form, which leads to `/auth/reset-password`.

> **Configuration required for password reset delivery.** The reset link is sent
> by Supabase Auth, which needs a working SMTP sender configured for the project.
> On the current project this send fails with `Error sending recovery email`, so
> reset emails will not arrive until SMTP is set up under
> Supabase → Project Settings → Authentication → SMTP Settings. The application
> side of the flow is complete and tested; only delivery is outstanding.
