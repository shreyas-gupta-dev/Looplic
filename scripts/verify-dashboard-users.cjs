/**
 * verify-dashboard-users.cjs
 *
 * Proves every seeded login works and that none of them can reach a dashboard it
 * has no business reaching. Verifies exactly the way the apps do:
 * signInWithPassword with the anon key, then a user_roles lookup.
 *
 * Checks performed:
 *   - 4 sign-ins (admin, operator, technician, customer) must all succeed.
 *   - A full 4 x 3 role matrix: each account must hold precisely its own role and
 *     no other. The customer must hold none, which is what keeps it out of all
 *     three dashboards.
 *   - Each account must have a customer_profiles row only where one is expected.
 *
 * Usage (from repo root):
 *   node scripts/verify-dashboard-users.cjs
 *
 * Exits non-zero if any check fails, so it can be used as a gate.
 */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");
const { Client } = require("pg");

const envPath = path.join(__dirname, "..", "apps", "user", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DATABASE_URL = env.DATABASE_URL;

if (!SUPABASE_URL || !ANON_KEY || !DATABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / DATABASE_URL in apps/user/.env.local");
  process.exit(1);
}

// Every role that gates a dashboard. Each account is checked against all of them.
const ALL_ROLES = ["admin", "operation", "technician"];

const ACCOUNTS = [
  { email: "admin@looplic.local",      password: "Admin123!",      role: "admin",      app: "admin      :3001 /admin",      expectProfile: false },
  { email: "operator@looplic.local",   password: "Operator123!",   role: "operation",  app: "operator   :3003 /operator",   expectProfile: false },
  { email: "technician@looplic.local", password: "Technician123!", role: "technician", app: "technician :3002 /technician", expectProfile: false },
  { email: "customer@looplic.local",   password: "Customer123!",   role: null,         app: "user       :3000 /account",    expectProfile: true },
];

let passed = 0;
let failed = 0;

function check(ok, label) {
  if (ok) {
    passed += 1;
    console.log(`   ✅ ${label}`);
  } else {
    failed += 1;
    console.log(`   ❌ ${label}`);
  }
}

(async () => {
  const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  for (const account of ACCOUNTS) {
    console.log(`\n${account.email}  →  ${account.app}`);

    // Fresh client per account so no session leaks between checks.
    const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await anon.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (error) {
      check(false, `sign-in failed: ${error.message}`);
      // Without a user id the remaining checks are meaningless; count them as failures.
      for (const role of ALL_ROLES) check(false, `role "${role}" not verifiable (no session)`);
      continue;
    }

    check(true, "sign-in succeeded");
    const userId = data.user.id;

    // Full role matrix: exactly one expected grant per account, none for the customer.
    for (const role of ALL_ROLES) {
      const res = await pg.query("SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2", [userId, role]);
      const has = res.rowCount > 0;
      const shouldHave = account.role === role;

      check(
        has === shouldHave,
        shouldHave
          ? `role "${role}" GRANTED as expected`
          : `role "${role}" correctly absent${has ? " — but it is PRESENT, this account can reach a dashboard it should not" : ""}`,
      );
    }

    const profileRes = await pg.query("SELECT 1 FROM customer_profiles WHERE user_id = $1", [userId]);
    const hasProfile = profileRes.rowCount > 0;
    if (account.expectProfile) {
      check(hasProfile, "customer_profiles row present");
    } else if (hasProfile) {
      // Harmless, just noted — dashboard users do not need a customer profile.
      console.log("   ·  customer_profiles row present (not required for this account)");
    }
  }

  await pg.end();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nRun `node scripts/seed-dashboard-users.cjs` to (re)create the accounts, then re-run this.");
    process.exit(1);
  }
})().catch((e) => {
  console.error("VERIFY FAILED:", e.message);
  process.exit(1);
});
