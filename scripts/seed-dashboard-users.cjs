/**
 * seed-dashboard-users.cjs
 * Creates one test login per dashboard and wires up its role.
 *
 *   admin      -> role "admin"      (admin app :3001 /admin)
 *   operator   -> role "operation"  (operator app :3003 /operator, and admin /operation)
 *   technician -> role "technician" (technician app :3002 /technician)
 *   customer   -> no role row       (user app :3000 — customers are role-less by design)
 *
 * Roles live in the RDS `user_roles` table; auth users live in Supabase.
 * Idempotent: re-running updates the password and ensures the role row exists.
 *
 * These are LOCAL TEST credentials. Do not use them for staging or production —
 * create those directly in Supabase and share them out of band.
 *
 * Usage (from repo root):
 *   node scripts/seed-dashboard-users.cjs
 *
 * Reads env from apps/user/.env.local (same Supabase project + RDS for all apps).
 */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");
const { Client } = require("pg");

// --- load env from apps/user/.env.local ---
const envPath = path.join(__dirname, "..", "apps", "user", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_ROLE || !DATABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL in apps/user/.env.local");
  process.exit(1);
}

// One credential set per dashboard. Change these if you like.
// `role: null` means "no user_roles row" — that is what a customer is, and it is
// what keeps the customer account out of every dashboard.
const USERS = [
  { email: "admin@looplic.local",      password: "Admin123!",      role: "admin",      name: "Test Admin" },
  { email: "operator@looplic.local",   password: "Operator123!",   role: "operation",  name: "Test Operator" },
  { email: "technician@looplic.local", password: "Technician123!", role: "technician", name: "Test Technician" },
  { email: "customer@looplic.local",   password: "Customer123!",   role: null,         name: "Test Customer",
    profile: { phone: "+919000000001", address: "1st Floor, Shawkat Building, SJP Road, Nagarathpete", city: "Bengaluru", pincode: "560002" } },
];

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

async function findUserByEmail(email) {
  // listUsers is paginated; scan pages until found (fine for small projects)
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function ensureAuthUser({ email, password, name }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password, email_confirm: true, user_metadata: { full_name: name },
    });
    return { id: existing.id, created: false };
  }
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: name },
  });
  if (error) throw error;
  return { id: data.user.id, created: true };
}

async function main() {
  const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  console.log("Connected to RDS. Supabase project:", new URL(SUPABASE_URL).host, "\n");

  for (const u of USERS) {
    const { id, created } = await ensureAuthUser(u);

    let roleNote = "n/a (customer)";
    if (u.role) {
      // Insert the role row if it isn't already there (user_id + role).
      const existsRes = await pg.query(
        "SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2 LIMIT 1", [id, u.role]
      );
      if (existsRes.rowCount === 0) {
        await pg.query("INSERT INTO user_roles (user_id, role) VALUES ($1, $2)", [id, u.role]);
      }
      roleNote = existsRes.rowCount ? "existed" : "inserted";
    } else {
      // A customer must have NO role row. If a previous run (or a mistake) left
      // one behind, remove it — otherwise the "customer" account would quietly
      // have dashboard access and the negative checks in
      // verify-dashboard-users.cjs would be testing the wrong thing.
      const removed = await pg.query("DELETE FROM user_roles WHERE user_id = $1", [id]);
      if (removed.rowCount > 0) roleNote = `removed ${removed.rowCount} stray role row(s)`;
    }

    // Customers need a customer_profiles row for the account page to have
    // anything to show.
    if (u.profile) {
      await pg.query(
        `INSERT INTO customer_profiles (user_id, full_name, phone, address, city, pincode)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           phone     = EXCLUDED.phone,
           address   = EXCLUDED.address,
           city      = EXCLUDED.city,
           pincode   = EXCLUDED.pincode,
           updated_at = now()`,
        [id, u.name, u.profile.phone, u.profile.address, u.profile.city, u.profile.pincode]
      );
    }

    console.log(`✓ ${u.email.padEnd(26)} role=${String(u.role ?? "customer").padEnd(11)} user=${created ? "created" : "updated"} roleRow=${roleNote}`);
  }

  await pg.end();
  console.log("\nDone. Credentials (LOCAL TEST ONLY):");
  for (const u of USERS) console.log(`  ${String(u.role ?? "customer").padEnd(11)} ${u.email} / ${u.password}`);
}

main().catch((e) => { console.error("SEED FAILED:", e.message); process.exit(1); });
