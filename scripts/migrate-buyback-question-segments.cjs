// Adds buyback_questions.os_segment so evaluation questions can be scoped to
// Apple devices vs Android/other devices ('all' = asked for every brand, which
// is what every existing question becomes — nothing changes until questions
// are curated per segment in the admin Buyback tab).
//
// Safe to re-run: the column add is IF NOT EXISTS and seeding is opt-in and
// skipped when any segment-specific question already exists.
//
// Usage:
//   DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/migrate-buyback-question-segments.cjs
//   ... --seed   also seed starter Apple-only / Android-only mobile questions
const { Client } = require("pg");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

const DDL = `
ALTER TABLE buyback_questions ADD COLUMN IF NOT EXISTS os_segment TEXT NOT NULL DEFAULT 'all';
CREATE INDEX IF NOT EXISTS idx_buyback_questions_os_segment ON buyback_questions(os_segment);
`;

// Starter segment-specific mobile questions (--seed). Deductions follow the
// same conventions as scripts/migrate-buyback.cjs (percent compounds on the
// running value). NOTE: the universal "Any functional issues?" question may
// already contain a "Fingerprint / Face ID faulty" option — after seeding,
// review the universal set in the admin and remove overlapping options so a
// defect isn't deducted twice.
const SEED = {
  apple: [
    {
      title: "Is Face ID / Touch ID working?", type: "single",
      description: "Apple biometric unlock",
      options: [
        ["Yes, works fine", "Unlocks reliably with face or fingerprint", "deduct_fixed", 0],
        ["No, not working", "Biometric hardware faulty or disabled", "deduct_percent", 8],
      ],
    },
    {
      title: "Is Find My iPhone / Activation Lock turned off?", type: "single",
      description: "iCloud-locked devices can't be resold and fetch parts value only",
      options: [
        ["Yes, iCloud removed", "Signed out of iCloud, activation lock off", "deduct_fixed", 0],
        ["No, still locked", "Find My is on / can't sign out of iCloud", "deduct_percent", 50],
      ],
    },
  ],
  android: [
    {
      title: "Is the Google account (FRP lock) removed?", type: "single",
      description: "Factory-reset-protected devices can't be resold as-is",
      options: [
        ["Yes, account removed", "Device factory resets without asking for a Google login", "deduct_fixed", 0],
        ["No, still linked", "FRP lock active / can't remove the account", "deduct_percent", 40],
      ],
    },
  ],
};

async function main() {
  const seed = process.argv.includes("--seed");
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to RDS. Adding buyback_questions.os_segment...");
  await client.query(DDL);
  console.log("Column ready (existing questions default to 'all').");

  if (seed) {
    for (const [segment, questions] of Object.entries(SEED)) {
      const { rows } = await client.query(
        "SELECT COUNT(*)::int AS n FROM buyback_questions WHERE service_type = 'mobile' AND os_segment = $1",
        [segment],
      );
      if (rows[0].n > 0) {
        console.log(`Skipping ${segment} seed: ${rows[0].n} question(s) already exist.`);
        continue;
      }
      const { rows: maxRows } = await client.query(
        "SELECT COALESCE(MAX(sort_order), 0)::int AS max FROM buyback_questions WHERE service_type = 'mobile'",
      );
      let qOrder = maxRows[0].max + 1;
      console.log(`Seeding ${questions.length} ${segment}-only mobile question(s)...`);
      for (const q of questions) {
        const res = await client.query(
          `INSERT INTO buyback_questions (service_type, os_segment, title, description, question_type, sort_order, active)
           VALUES ('mobile', $1, $2, $3, $4, $5, TRUE) RETURNING id`,
          [segment, q.title, q.description || null, q.type, qOrder++],
        );
        let oOrder = 1;
        for (const [label, description, effectType, amount] of q.options) {
          await client.query(
            `INSERT INTO buyback_question_options (question_id, label, description, effect_type, amount, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [res.rows[0].id, label, description || null, effectType, amount, oOrder++],
          );
        }
      }
    }
  } else {
    console.log("Skipped seeding (pass --seed to add starter Apple/Android-only mobile questions).");
  }

  const counts = await client.query(
    "SELECT service_type, os_segment, COUNT(*)::int AS questions FROM buyback_questions GROUP BY service_type, os_segment ORDER BY service_type, os_segment",
  );
  console.log("Done:", JSON.stringify(counts.rows));
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
