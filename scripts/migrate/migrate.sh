#!/usr/bin/env bash
# Looplic AWS account migration — Phases A/B/C executor.
#
# Migrates the four Looplic Amplify apps, RDS database, and S3 assets from the
# shared account 041149335823 into a new standalone account.
#
# Reads captured source state from migration-capture/ (see MANIFEST.md).
# Idempotent: every phase checks for existing resources before creating.
#
# Usage:
#   ./migrate.sh preflight     # verify creds, region, collisions — READ ONLY
#   ./migrate.sh rds           # Phase A: provision + restore database
#   ./migrate.sh s3            # Phase B: bucket, PAB, policy, CORS, objects
#   ./migrate.sh iam           # scoped S3 user for the apps
#   ./migrate.sh amplify       # Phase C: create 4 apps + env + rules
#   ./migrate.sh verify        # post-migration checks
#
# Phase D (cutover / DNS) is deliberately NOT scripted — it is a scheduled
# operation requiring explicit go-ahead. See the runbook.

set -euo pipefail

SRC_PROFILE="${SRC_PROFILE:-default}"
DST_PROFILE="${DST_PROFILE:-looplic-new}"
REGION="${REGION:-ap-south-1}"
BUCKET="${BUCKET:-looplic-assets}"
DB_ID="${DB_ID:-looplic-db}"
DB_NAME="looplic"
DB_USER="looplic_admin"
PG_VERSION="16.14"
REPO="https://github.com/shreyas-gupta-dev/Looplic"
BRANCH="master"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CAP="$ROOT/migration-capture"
export PYTHONUTF8=1
export AWS_PAGER=""

APPS=(user admin operator technician)

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[32m[ok]\033[0m %s\n' "$*"; }
warn() { printf '    \033[33m[!!]\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31mFATAL: %s\033[0m\n' "$*" >&2; exit 1; }

dst() { aws --profile "$DST_PROFILE" --region "$REGION" "$@"; }
src() { aws --profile "$SRC_PROFILE" --region "$REGION" "$@"; }

need_capture() {
  [[ -d "$CAP" ]] || die "migration-capture/ not found. Run Phase 0 capture first."
  [[ -f "$CAP/db/looplic-20260730.dump" ]] || die "DB dump missing from migration-capture/db/"
}

# ---------------------------------------------------------------- preflight

phase_preflight() {
  log "Preflight (read-only)"
  need_capture; ok "capture directory present"

  local dst_acct
  dst_acct=$(dst sts get-caller-identity --query Account --output text) \
    || die "profile '$DST_PROFILE' not configured. Run: aws configure --profile $DST_PROFILE"
  ok "target account: $dst_acct"
  [[ "$dst_acct" != "041149335823" ]] \
    || die "target profile points at the SOURCE account. Refusing to run."

  local src_acct
  src_acct=$(src sts get-caller-identity --query Account --output text 2>/dev/null || echo "unavailable")
  ok "source account: $src_acct"

  command -v pg_restore >/dev/null || die "pg_restore not on PATH"
  ok "pg_restore: $(pg_restore --version | head -1)"

  log "Collision checks in target account"
  if dst rds describe-db-instances --db-instance-identifier "$DB_ID" >/dev/null 2>&1; then
    warn "RDS '$DB_ID' already exists (rds phase will skip creation)"
  else ok "RDS '$DB_ID' free"; fi

  if dst s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
    warn "bucket '$BUCKET' already exists in target"
  elif src s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
    warn "bucket '$BUCKET' still exists in the SOURCE account."
    warn "S3 names are global — either delete it there first, or set BUCKET=<newname>"
    warn "and update NEXT_PUBLIC_S3_BUCKET on all four apps."
  else ok "bucket name '$BUCKET' appears available"; fi

  local existing
  existing=$(dst amplify list-apps --query 'apps[].name' --output text 2>/dev/null || true)
  [[ -z "$existing" ]] && ok "no Amplify apps in target" || warn "existing Amplify apps: $existing"

  log "Preflight complete — no changes made"
}

# ------------------------------------------------------------------ Phase A

phase_rds() {
  log "Phase A — RDS"
  need_capture

  if dst rds describe-db-instances --db-instance-identifier "$DB_ID" >/dev/null 2>&1; then
    ok "instance '$DB_ID' already exists — skipping creation"
  else
    local pw_file="$CAP/db/new-db-password.txt"
    if [[ ! -f "$pw_file" ]]; then
      python -c "import secrets,string; a=string.ascii_letters+string.digits; print(''.join(secrets.choice(a) for _ in range(32)))" > "$pw_file"
      chmod 600 "$pw_file" 2>/dev/null || true
      ok "generated master password -> migration-capture/db/new-db-password.txt (gitignored)"
    else
      ok "reusing existing generated password"
    fi

    log "Creating $DB_ID (PostgreSQL $PG_VERSION, db.t3.micro, 20GB gp3, NOT public)"
    dst rds create-db-instance \
      --db-instance-identifier "$DB_ID" \
      --db-instance-class db.t3.micro \
      --engine postgres --engine-version "$PG_VERSION" \
      --master-username "$DB_USER" \
      --master-user-password "$(cat "$pw_file")" \
      --allocated-storage 20 --storage-type gp3 --max-allocated-storage 100 \
      --db-name "$DB_NAME" \
      --backup-retention-period 7 \
      --no-publicly-accessible \
      --no-multi-az \
      --copy-tags-to-snapshot \
      --tags Key=Project,Value=Looplic Key=ManagedBy,Value=migrate.sh \
      --query 'DBInstance.DBInstanceStatus' --output text
    ok "create issued"
  fi

  log "Waiting for instance to become available (several minutes)"
  dst rds wait db-instance-available --db-instance-identifier "$DB_ID"
  local ep
  ep=$(dst rds describe-db-instances --db-instance-identifier "$DB_ID" \
        --query 'DBInstances[0].Endpoint.Address' --output text)
  ok "endpoint: $ep"

  warn "Instance is NOT publicly accessible, so the restore must run from inside"
  warn "the VPC, or you must temporarily allow your IP on its security group."
  warn "To restore now:"
  cat <<EOF

    NEW_URL="postgresql://$DB_USER:\$(cat migration-capture/db/new-db-password.txt)@$ep:5432/$DB_NAME?sslmode=require"
    pg_restore -d "\$NEW_URL" --no-owner --no-acl \\
      migration-capture/db/looplic-20260730.dump
    ./scripts/migrate/migrate.sh verify

EOF
  echo "$ep" > "$CAP/db/new-endpoint.txt"
  ok "endpoint saved to migration-capture/db/new-endpoint.txt"
}

# ------------------------------------------------------------------ Phase B

phase_s3() {
  log "Phase B — S3"
  need_capture

  if dst s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
    ok "bucket '$BUCKET' exists"
  else
    dst s3api create-bucket --bucket "$BUCKET" \
      --create-bucket-configuration LocationConstraint="$REGION" >/dev/null
    ok "created bucket '$BUCKET'"
  fi

  # MUST precede the policy: new buckets default all four flags to true, which
  # silently rejects a public-read policy and reproduces the old 403 bug.
  log "Disabling public-access-block (matches source: all four false)"
  dst s3api put-public-access-block --bucket "$BUCKET" \
    --public-access-block-configuration \
      BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
  ok "public-access-block disabled"

  dst s3api put-bucket-ownership-controls --bucket "$BUCKET" \
    --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'
  ok "ownership: BucketOwnerEnforced (ACLs disabled)"

  log "Applying public-read policy (whole bucket, not public/*)"
  python - "$BUCKET" <<'PY' > /tmp/looplic-s3-policy.json
import json,sys
b=sys.argv[1]
print(json.dumps({"Version":"2012-10-17","Statement":[{
  "Sid":"PublicReadGetObject","Effect":"Allow","Principal":"*",
  "Action":"s3:GetObject","Resource":f"arn:aws:s3:::{b}/*"}]}))
PY
  dst s3api put-bucket-policy --bucket "$BUCKET" --policy file:///tmp/looplic-s3-policy.json
  ok "policy applied"

  log "Applying CORS (source origins + the missing admin/operator/tech subdomains)"
  cat > /tmp/looplic-cors.json <<'EOF'
{"CORSRules":[{"AllowedHeaders":["*"],
  "AllowedMethods":["GET","PUT","POST","DELETE","HEAD"],
  "AllowedOrigins":["https://www.looplic.com","https://looplic.com",
    "https://admin.looplic.com","https://operator.looplic.com",
    "https://tech.looplic.com","http://localhost:3000"],
  "ExposeHeaders":["ETag"],"MaxAgeSeconds":3600}]}
EOF
  dst s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration file:///tmp/looplic-cors.json
  ok "CORS applied"

  log "Uploading captured objects"
  dst s3 sync "$CAP/s3/looplic-assets/" "s3://$BUCKET/" --only-show-errors
  local n
  n=$(dst s3 ls "s3://$BUCKET" --recursive | wc -l)
  ok "objects in target bucket: $n (source had 18)"
}

# -------------------------------------------------------------------- IAM

phase_iam() {
  log "Scoped S3 user for the apps (replaces the full-admin key)"
  local u="looplic-app-s3"

  if dst iam get-user --user-name "$u" >/dev/null 2>&1; then
    ok "user '$u' exists"
  else
    dst iam create-user --user-name "$u" \
      --tags Key=Project,Value=Looplic >/dev/null
    ok "created user '$u'"
  fi

  python - "$BUCKET" <<'PY' > /tmp/looplic-s3-user-policy.json
import json,sys
b=sys.argv[1]
print(json.dumps({"Version":"2012-10-17","Statement":[{
  "Effect":"Allow",
  "Action":["s3:GetObject","s3:PutObject","s3:DeleteObject"],
  "Resource":f"arn:aws:s3:::{b}/*"},
  {"Effect":"Allow","Action":["s3:ListBucket"],
   "Resource":f"arn:aws:s3:::{b}"}]}))
PY
  dst iam put-user-policy --user-name "$u" --policy-name looplic-assets-rw \
    --policy-document file:///tmp/looplic-s3-user-policy.json
  ok "inline policy 'looplic-assets-rw' attached (S3 only — NOT admin)"

  local keyfile="$CAP/iam/new-app-key.json"
  if [[ -f "$keyfile" ]]; then
    ok "access key already generated -> migration-capture/iam/new-app-key.json"
  else
    dst iam create-access-key --user-name "$u" --output json > "$keyfile"
    chmod 600 "$keyfile" 2>/dev/null || true
    ok "access key created -> migration-capture/iam/new-app-key.json (gitignored)"
  fi
}

# ------------------------------------------------------------------ Phase C

phase_amplify() {
  log "Phase C — Amplify apps"
  need_capture

  [[ -n "${GITHUB_TOKEN:-}" ]] || die \
    "GITHUB_TOKEN not set. Needs a GitHub PAT with repo access (source apps use
     repositoryCloneMethod=TOKEN, so this is scriptable). Export it and re-run."

  local endpoint
  endpoint=$(cat "$CAP/db/new-endpoint.txt" 2>/dev/null || true)
  [[ -n "$endpoint" ]] || die "no new DB endpoint recorded — run 'rds' phase first"
  local dbpw; dbpw=$(cat "$CAP/db/new-db-password.txt")
  local akid asec
  akid=$(python -c "import json;print(json.load(open('$CAP/iam/new-app-key.json'))['AccessKey']['AccessKeyId'])")
  asec=$(python -c "import json;print(json.load(open('$CAP/iam/new-app-key.json'))['AccessKey']['SecretAccessKey'])")

  for app in "${APPS[@]}"; do
    local name="looplic-$app"
    log "App: $name (apps/$app)"

    # Build the env var map: captured values, with the four rewrites applied.
    python - "$app" "$endpoint" "$dbpw" "$akid" "$asec" "$BUCKET" "$CAP" \
      > "/tmp/env-$app.json" <<'PY'
import json,sys
app,ep,pw,akid,asec,bucket,cap = sys.argv[1:8]
ev = json.load(open(f'{cap}/env/{app}.json'))
ev['DATABASE_URL'] = f'postgresql://looplic_admin:{pw}@{ep}:5432/looplic'
ev['APP_AWS_ACCESS_KEY_ID'] = akid
ev['APP_AWS_SECRET_ACCESS_KEY'] = asec
ev['NEXT_PUBLIC_S3_BUCKET'] = bucket
# Fill the gap found in the source account: technician had no APP_URL.
if app == 'technician':
    ev.setdefault('NEXT_PUBLIC_APP_URL', 'https://tech.looplic.com')
json.dump(ev, sys.stdout)
PY

    local app_id
    app_id=$(dst amplify list-apps --query "apps[?name=='$name'].appId | [0]" --output text 2>/dev/null || true)

    if [[ -n "$app_id" && "$app_id" != "None" ]]; then
      ok "exists ($app_id) — updating env vars"
      dst amplify update-app --app-id "$app_id" \
        --environment-variables "file:///tmp/env-$app.json" >/dev/null
    else
      # No --build-spec: apps use the repo amplify.yml, which correctly contains
      # all four appRoot blocks. This deliberately drops the source account's
      # inline buildSpecs (see MANIFEST.md).
      app_id=$(dst amplify create-app \
        --name "$name" \
        --repository "$REPO" \
        --access-token "$GITHUB_TOKEN" \
        --platform WEB_COMPUTE \
        --environment-variables "file:///tmp/env-$app.json" \
        --tags Project=Looplic \
        --query 'app.appId' --output text)
      ok "created ($app_id)"
    fi

    # Only the user app gets the apex->www 301. The other three carried a stale
    # /<*> -> /index.html 404-200 SPA rule that is wrong for WEB_COMPUTE.
    if [[ "$app" == "user" ]]; then
      dst amplify update-app --app-id "$app_id" --custom-rules \
        '[{"source":"https://looplic.com","target":"https://www.looplic.com","status":"301"}]' >/dev/null
      ok "apex->www 301 customRule set"
    fi

    if dst amplify get-branch --app-id "$app_id" --branch-name "$BRANCH" >/dev/null 2>&1; then
      ok "branch '$BRANCH' exists"
    else
      dst amplify create-branch --app-id "$app_id" --branch-name "$BRANCH" \
        --stage PRODUCTION --enable-auto-build >/dev/null
      ok "branch '$BRANCH' created"
    fi

    dst amplify start-job --app-id "$app_id" --branch-name "$BRANCH" \
      --job-type RELEASE --query 'jobSummary.jobId' --output text >/dev/null
    ok "build started"
    echo "$app_id" > "$CAP/amplify/new-$app-appid.txt"
  done

  log "All four apps queued. Watch with: ./migrate.sh verify"
}

# ----------------------------------------------------------------- verify

phase_verify() {
  log "Verification"

  log "Amplify build status"
  for app in "${APPS[@]}"; do
    local id; id=$(cat "$CAP/amplify/new-$app-appid.txt" 2>/dev/null || true)
    [[ -z "$id" ]] && { warn "$app: no recorded appId"; continue; }
    local st; st=$(dst amplify list-jobs --app-id "$id" --branch-name "$BRANCH" \
      --max-results 1 --query 'jobSummaries[0].status' --output text 2>/dev/null || echo "?")
    local dom; dom=$(dst amplify get-app --app-id "$id" --query 'app.defaultDomain' --output text 2>/dev/null || echo "?")
    printf '    %-11s %-10s https://%s.%s\n' "$app" "$st" "$BRANCH" "$dom"
  done

  log "Row-count comparison against the captured baseline"
  local ep; ep=$(cat "$CAP/db/new-endpoint.txt" 2>/dev/null || true)
  if [[ -z "$ep" ]]; then warn "no endpoint recorded — skipping DB check"; return; fi
  local url="postgresql://$DB_USER:$(cat "$CAP/db/new-db-password.txt")@$ep:5432/$DB_NAME?sslmode=require"
  if ! psql "$url" -tAc 'select 1' >/dev/null 2>&1; then
    warn "cannot reach new DB from here (it is not publicly accessible) — run this"
    warn "check from inside the VPC, or temporarily allow your IP."
    return
  fi
  local q; q=$(psql "$url" -t -A -c "select string_agg(format('select %L::text, count(*)::text from %I.%I', tablename, schemaname, tablename), ' union all ') from pg_tables where schemaname='public';")
  psql "$url" -t -A -F$'\t' -c "$q order by 1;" > /tmp/new-counts.tsv
  if diff -q <(sort "$CAP/db/rowcounts-exact-20260730.tsv") <(sort /tmp/new-counts.tsv) >/dev/null; then
    ok "row counts match the baseline exactly"
  else
    warn "row counts DIFFER from baseline:"
    diff <(sort "$CAP/db/rowcounts-exact-20260730.tsv") <(sort /tmp/new-counts.tsv) | head -25
  fi
}

case "${1:-}" in
  preflight) phase_preflight ;;
  rds)       phase_rds ;;
  s3)        phase_s3 ;;
  iam)       phase_iam ;;
  amplify)   phase_amplify ;;
  verify)    phase_verify ;;
  *) sed -n '2,25p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
