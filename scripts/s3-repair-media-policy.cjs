#!/usr/bin/env node
/**
 * Makes repair media private at the storage layer, and proves it.
 *
 * ── The problem ───────────────────────────────────────────────────────────────
 *
 * The looplic-assets bucket policy grants `s3:GetObject` to `Principal: "*"` for
 * every object in the bucket, and its public access block is fully disabled. That
 * is correct for brand logos and catalog imagery. It is wrong for
 * `repair-media/`, which holds photos and clips of customers' devices taken at a
 * repair bench: anyone holding an object key can fetch it directly from S3,
 * bypassing every check the application makes.
 *
 * The application already mitigates this — media is served only through a
 * grant-checked proxy, the S3 URL and object key are never returned to a client,
 * and keys carry 128 bits of randomness so they cannot be guessed. But mitigation
 * is not the same as the bytes being private, and "unguessable URL" is not an
 * access control.
 *
 * ── What this does ────────────────────────────────────────────────────────────
 *
 * Adds one Deny statement scoped to `repair-media/*`, excluding principals inside
 * the bucket's own account so the app's IAM user keeps working. Everything else in
 * the bucket is untouched.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *
 *   node scripts/s3-repair-media-policy.cjs --show     # current live policy
 *   node scripts/s3-repair-media-policy.cjs --diff     # what would change
 *   node scripts/s3-repair-media-policy.cjs --apply    # apply it (asks first)
 *   node scripts/s3-repair-media-policy.cjs --verify   # prove the effect
 *   node scripts/s3-repair-media-policy.cjs --rollback # restore the captured policy
 *
 * --verify is the one that matters, and it works whether or not the change has
 * been applied: it uploads a throwaway object under repair-media/, fetches it
 * anonymously, and reports what happened. Before the change that fetch returns
 * 200; after it, 403.
 *
 * Credentials come from apps/user/.env.local (AWS_ACCESS_KEY_ID /
 * AWS_SECRET_ACCESS_KEY / AWS_REGION), the same place the app reads them.
 */

const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { createInterface } = require("node:readline");

const {
  S3Client,
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const REPO_ROOT = join(__dirname, "..");
const ENV_FILE = join(REPO_ROOT, "apps", "user", ".env.local");
const CAPTURED_POLICY = join(REPO_ROOT, "migration-capture", "s3", "looplic-assets-policy.json");

const REPAIR_MEDIA_PREFIX = "repair-media";
const DENY_SID = "DenyPublicReadRepairMedia";
const DENY_CROSS_ACCOUNT_SID = "DenyCrossAccountReadRepairMedia";

function loadEnvFile(path) {
  const values = {};
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
      const index = line.indexOf("=");
      values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    }
  } catch {
    /* no env file is fine; fall through to process.env */
  }
  return values;
}

const env = { ...loadEnvFile(ENV_FILE), ...process.env };
const REGION = env.AWS_REGION || "ap-south-1";
const BUCKET = env.NEXT_PUBLIC_S3_BUCKET || "looplic-assets";

function credentials() {
  const accessKeyId = env.APP_AWS_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.APP_AWS_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    console.error(
      "No AWS credentials found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in\n" +
        `${ENV_FILE} or in the environment.`,
    );
    process.exit(2);
  }
  return { accessKeyId, secretAccessKey };
}

const s3 = () => new S3Client({ region: REGION, credentials: credentials() });

/**
 * The bucket's account, if we know it. Optional on purpose.
 *
 * Looking it up would mean an STS call, and @aws-sdk/client-sts is not a
 * dependency of this repo — adding one just to read a number is not worth it. Set
 * AWS_ACCOUNT_ID, or pass --account=<id>, to get the tighter of the two rules
 * below. Without it the anonymous rule still closes the actual exposure.
 */
function accountId() {
  const flag = process.argv.find((arg) => arg.startsWith("--account="));
  return (flag ? flag.slice("--account=".length) : env.AWS_ACCOUNT_ID || "").trim() || null;
}

async function livePolicy() {
  try {
    const result = await s3().send(new GetBucketPolicyCommand({ Bucket: BUCKET }));
    return JSON.parse(result.Policy);
  } catch (error) {
    if (error?.name === "NoSuchBucketPolicy") return null;
    throw error;
  }
}

/**
 * Builds the target policy from whatever is live, rather than from a stored copy.
 *
 * This is deliberate. A policy file committed weeks ago may not match what is on
 * the bucket now, and overwriting the live policy with a stale one would silently
 * revoke access the bucket has since been given. Adding statements to what is
 * actually there cannot do that.
 *
 * Two rules, because they close different holes:
 *
 *  1. Anonymous. `aws:PrincipalArn` is absent on an unsigned request, so this
 *     denies exactly "anyone with the URL" — the actual exposure. Needs no
 *     configuration, so it always applies.
 *  2. Cross-account. The public Allow grants GetObject to `Principal: "*"`, which
 *     includes *signed* callers from any AWS account. This denies those too.
 *     Requires knowing our own account id, so it is added only when one is
 *     supplied — otherwise a wrong value here would lock out the application.
 *
 * Neither denies principals inside the account, so the app's IAM user keeps
 * serving media through the grant-checked proxy route.
 */
function withRepairMediaDeny(policy, account) {
  const base = policy ?? { Version: "2012-10-17", Statement: [] };
  const statements = (base.Statement ?? []).filter(
    (statement) => statement.Sid !== DENY_SID && statement.Sid !== DENY_CROSS_ACCOUNT_SID,
  );
  const resource = `arn:aws:s3:::${BUCKET}/${REPAIR_MEDIA_PREFIX}/*`;

  statements.push({
    Sid: DENY_SID,
    Effect: "Deny",
    Principal: "*",
    Action: "s3:GetObject",
    Resource: resource,
    Condition: { Null: { "aws:PrincipalArn": "true" } },
  });

  if (account) {
    statements.push({
      Sid: DENY_CROSS_ACCOUNT_SID,
      Effect: "Deny",
      Principal: "*",
      Action: "s3:GetObject",
      Resource: resource,
      Condition: { StringNotEquals: { "aws:PrincipalAccount": account } },
    });
  }

  return { ...base, Version: base.Version ?? "2012-10-17", Statement: statements };
}

function hasDeny(policy) {
  return Boolean(policy?.Statement?.some((statement) => statement.Sid === DENY_SID));
}

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(`${question} [y/N] `, resolve));
  rl.close();
  return answer.trim().toLowerCase() === "y";
}

async function show() {
  const policy = await livePolicy();
  console.log(`Bucket: ${BUCKET} (${REGION})`);
  console.log(policy ? JSON.stringify(policy, null, 2) : "No bucket policy set.");
  console.log(
    hasDeny(policy)
      ? `\n✓ repair-media/ is already excluded from public read.`
      : `\n⚠ repair-media/ is publicly readable to anyone holding an object key.`,
  );
}

async function diff() {
  const policy = await livePolicy();
  const account = accountId();
  console.log("── current ─────────────────────────────────────────");
  console.log(policy ? JSON.stringify(policy, null, 2) : "(none)");
  console.log("── proposed ────────────────────────────────────────");
  console.log(JSON.stringify(withRepairMediaDeny(policy, account), null, 2));
  console.log("────────────────────────────────────────────────────");
  if (hasDeny(policy)) {
    console.log("No change needed.");
    return;
  }
  console.log(`Adds: Deny s3:GetObject on ${REPAIR_MEDIA_PREFIX}/* for unsigned (anonymous) requests.`);
  console.log(
    account
      ? `Adds: Deny s3:GetObject on ${REPAIR_MEDIA_PREFIX}/* for principals outside account ${account}.`
      : `No AWS_ACCOUNT_ID set, so signed callers from other AWS accounts are not denied.\n` +
          `  Pass --account=<id> to add that rule too.`,
  );
}

async function apply() {
  const policy = await livePolicy();
  if (hasDeny(policy)) {
    console.log("Already applied; nothing to do.");
    return;
  }

  const account = accountId();
  const next = withRepairMediaDeny(policy, account);

  console.log(`About to change the bucket policy on ${BUCKET} (${REGION}).`);
  console.log(`Adding a Deny on ${REPAIR_MEDIA_PREFIX}/* for anonymous requests${account ? ` and for principals outside account ${account}` : ""}.`);
  console.log("Existing statements are preserved. Roll back with --rollback.");
  if (!account) {
    console.log("\nNote: without --account=<id>, signed requests from other AWS accounts are");
    console.log("not denied. The world-readable-by-URL exposure is closed either way.");
  }
  if (!(await confirm("Apply this change to live infrastructure?"))) {
    console.log("Aborted. Nothing was changed.");
    process.exit(1);
  }

  await s3().send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: JSON.stringify(next) }));
  console.log("✓ Applied. Run --verify to prove the effect.");
}

async function rollback() {
  const captured = JSON.parse(readFileSync(CAPTURED_POLICY, "utf8"));
  console.log(`About to restore the captured policy from ${CAPTURED_POLICY}:`);
  console.log(JSON.stringify(captured, null, 2));
  console.log("\n⚠ This makes every object in the bucket publicly readable again,");
  console.log("  including repair media, and discards any statement added since capture.");
  if (!(await confirm("Restore it?"))) {
    console.log("Aborted. Nothing was changed.");
    process.exit(1);
  }

  await s3().send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: JSON.stringify(captured) }));
  console.log("✓ Restored.");
}

/**
 * Proves the actual effect on a real object, because reading the policy only shows
 * intent. Uploads a throwaway file, fetches it with no credentials at all, and
 * reports the status code. Cleans up after itself either way.
 */
async function verify() {
  const client = s3();
  const key = `${REPAIR_MEDIA_PREFIX}/_policy-check/${Date.now()}-${Math.random().toString(16).slice(2)}.txt`;
  const controlKey = `brand/_policy-check-${Date.now()}.txt`;
  const body = "looplic policy check";

  let failures = 0;
  try {
    await client.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, CacheControl: "private, no-store" }),
    );
    await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: controlKey, Body: body }));

    const base = `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
    const media = await fetch(`${base}/${key}`);
    const control = await fetch(`${base}/${controlKey}`);

    console.log(`Bucket: ${BUCKET} (${REGION})\n`);
    console.log(`anonymous GET ${key}`);
    console.log(`  → ${media.status} ${media.statusText}`);
    if (media.status === 403) {
      console.log("  ✓ repair media is not readable without the application");
    } else if (media.status === 200) {
      console.log("  ✗ repair media IS publicly readable — the policy is not in place");
      failures += 1;
    } else {
      console.log("  ? unexpected status; investigate before trusting this result");
      failures += 1;
    }

    console.log(`\nanonymous GET ${controlKey}  (control: public asset)`);
    console.log(`  → ${control.status} ${control.statusText}`);
    if (control.status === 200) {
      console.log("  ✓ public assets still load, so the change was correctly scoped");
    } else {
      console.log("  ✗ a public asset stopped loading — the Deny is too broad");
      failures += 1;
    }

    // The app's own credentials must still be able to read the private object, or
    // the proxy route that serves it to the customer would break.
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    try {
      await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      console.log("\napplication credentials GET repair media\n  → 200 OK");
      console.log("  ✓ the proxy route can still serve it to an authorized customer");
    } catch (error) {
      console.log(`\napplication credentials GET repair media\n  → ${error.name}`);
      console.log("  ✗ the application can no longer read its own media");
      failures += 1;
    }
  } finally {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })).catch(() => undefined);
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: controlKey })).catch(() => undefined);
  }

  console.log(failures === 0 ? "\n✓ all checks passed" : `\n✗ ${failures} check(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

async function main() {
  const mode = process.argv[2] ?? "--show";
  const modes = { "--show": show, "--diff": diff, "--apply": apply, "--verify": verify, "--rollback": rollback };
  const handler = modes[mode];

  if (!handler) {
    console.error(`Unknown option ${mode}. Use one of: ${Object.keys(modes).join(", ")}`);
    process.exit(2);
  }

  try {
    await handler();
  } catch (error) {
    console.error(`\n${error.name ?? "Error"}: ${error.message}`);
    if (
      error?.name === "InvalidClientTokenId" ||
      error?.name === "InvalidAccessKeyId" ||
      error?.name === "SignatureDoesNotMatch"
    ) {
      console.error(
        `The AWS credentials are not valid for this account.\n` +
          `Checked APP_AWS_ACCESS_KEY_ID / AWS_ACCESS_KEY_ID in ${ENV_FILE} and the environment.`,
      );
    }
    process.exit(2);
  }
}

main();
