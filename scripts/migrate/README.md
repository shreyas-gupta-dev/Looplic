# Looplic AWS account migration — executor

Automates Phases A–C of [`docs/aws-account-migration-runbook.md`](../../docs/aws-account-migration-runbook.md):
RDS, S3, IAM, and all four Amplify apps.

**Phase D (final sync, DB repoint, DNS cutover) is intentionally not scripted.**
It is a scheduled low-traffic-hour operation that needs explicit go-ahead and
manual verification at each step.

## Prerequisites

1. New AWS account created, root MFA on, billing alarm set.
2. An IAM admin user in it, configured locally:
   ```bash
   aws configure --profile looplic-new    # region ap-south-1, output json
   ```
3. `migration-capture/` present (Phase 0 output — already done, 2026-07-30).
4. A **GitHub PAT** with read access to `shreyas-gupta-dev/Looplic`:
   ```bash
   export GITHUB_TOKEN=ghp_...
   ```
   The source apps use `repositoryCloneMethod=TOKEN`, so `create-app
   --access-token` works and no console OAuth click-through is needed.
5. `pg_restore` / `psql` on PATH (present: PostgreSQL 17.3).

## Order

```bash
cd scripts/migrate

./migrate.sh preflight   # READ ONLY — always run this first
./migrate.sh rds         # ~10 min (waits for instance to become available)
                         # then run the printed pg_restore command
./migrate.sh s3
./migrate.sh iam         # mints the scoped S3 key that Phase C consumes
./migrate.sh amplify     # needs GITHUB_TOKEN; requires rds + iam to have run
./migrate.sh verify
```

Every phase is idempotent — re-running skips resources that already exist, so a
partial failure is safe to resume.

## What it deliberately does differently from the source account

These are corrections, not omissions. Rationale in
[`migration-capture/MANIFEST.md`](../../migration-capture/MANIFEST.md).

| Source account | Here | Why |
|---|---|---|
| Full-admin key in `APP_AWS_*` | New `looplic-app-s3` user, S3-only | An `AdministratorAccess` key was sitting in all four SSR Lambdas |
| Inline buildSpecs on 3 apps | None — repo `amplify.yml` | Operator's inline spec is missing its own `apps/operator` block and only builds by accidental fallback |
| `/<*>`→`/index.html` `404-200` on 3 apps | Not recreated | Static-SPA leftover, wrong for `WEB_COMPUTE` |
| RDS publicly accessible | `--no-publicly-accessible` | No reason to expose it |
| CORS missing admin/operator/tech | Added | Latent gap if uploads ever move to presigned PUTs |
| `NEXT_PUBLIC_APP_URL` absent on technician | Set to `https://tech.looplic.com` | Source-account oversight |
| Broad user-app service role | Amplify defaults | Old role had `AdministratorAccess-Amplify` + S3FullAccess + CognitoPowerUser |
| Cognito user pool | Not migrated | Dead code — auth is Supabase |

## Secrets

`rds` writes a generated master password to
`migration-capture/db/new-db-password.txt`; `iam` writes the new access key to
`migration-capture/iam/new-app-key.json`. Both live under the gitignored
`migration-capture/`. Delete the directory once the migration is verified.

## Because the new RDS is private

The restore and the `verify` row-count check must run from inside the VPC, or
with your IP temporarily allowed on the instance's security group. `verify`
degrades gracefully with a warning if it cannot reach the database rather than
reporting a false failure.
