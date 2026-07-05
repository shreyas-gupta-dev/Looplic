// Creates the buyback tables on RDS and seeds default evaluation questions.
// Safe to re-run: tables are IF NOT EXISTS and questions are only seeded when
// a service type has none yet (so admin edits are never overwritten).
// Usage: DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/migrate-buyback.cjs
const { Client } = require("pg");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

const DDL = `
CREATE TABLE IF NOT EXISTS buyback_model_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL UNIQUE REFERENCES models(id) ON DELETE CASCADE,
  base_price NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buyback_model_prices_model_id ON buyback_model_prices(model_id);
DROP TRIGGER IF EXISTS trg_buyback_model_prices_updated_at ON buyback_model_prices;
CREATE TRIGGER trg_buyback_model_prices_updated_at
BEFORE UPDATE ON buyback_model_prices FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS buyback_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL DEFAULT 'mobile',
  title TEXT NOT NULL,
  description TEXT,
  question_type TEXT NOT NULL DEFAULT 'single',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buyback_questions_service_type ON buyback_questions(service_type);

CREATE TABLE IF NOT EXISTS buyback_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES buyback_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  effect_type TEXT NOT NULL DEFAULT 'deduct_fixed',
  amount NUMERIC NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buyback_question_options_question_id ON buyback_question_options(question_id);
`;

// Default question sets, modeled on Cashify / Gazelle / ItsWorthMore /
// Decluttr / Swappa evaluation flows. Percent deductions compound on the
// running value; fixed amounts apply after percentages.
const QUESTIONS = {
  mobile: [
    {
      title: "Is your phone turning on?", type: "single",
      description: "Whether the device powers on and boots normally",
      options: [
        ["Yes, turns on & works", "Boots to home screen normally", "deduct_fixed", 0],
        ["No, dead or won't boot", "Does not power on / no display", "deduct_percent", 60],
      ],
    },
    {
      title: "Display condition", type: "single",
      description: "Condition of the screen itself",
      options: [
        ["Flawless / original", "No scratches, no dead pixels", "deduct_fixed", 0],
        ["Minor scratches", "Light marks, not visible when screen is on", "deduct_percent", 10],
        ["Cracked or broken", "Cracks, lines, dead pixels or heavy scratches", "deduct_percent", 35],
        ["Screen replaced (non-original)", "Display changed at a third-party shop", "deduct_percent", 20],
      ],
    },
    {
      title: "Overall body condition", type: "single",
      description: "Frame and back panel condition",
      options: [
        ["Like new", "No visible marks", "deduct_fixed", 0],
        ["Minor wear", "Small scratches or scuffs", "deduct_percent", 8],
        ["Major dents / cracked back", "Bent frame, deep dents or broken glass back", "deduct_percent", 20],
      ],
    },
    {
      title: "Any functional issues?", type: "multi",
      description: "Select every problem the phone has",
      options: [
        ["Weak / dead battery", "Drains fast or not charging properly", "deduct_percent", 8],
        ["Camera not working", "Front or rear camera faulty / blurry", "deduct_percent", 10],
        ["Speaker / mic issue", "Low or no sound on calls or media", "deduct_percent", 8],
        ["Fingerprint / Face ID faulty", "Biometric unlock not working", "deduct_percent", 6],
        ["Charging port issue", "Loose or intermittent charging", "deduct_percent", 8],
        ["Wi-Fi / network issue", "Poor signal, SIM or Wi-Fi not detected", "deduct_percent", 10],
      ],
    },
    {
      title: "How old is your phone?", type: "single",
      description: "Time since original purchase",
      options: [
        ["Under 1 year", "Bought within the last 12 months", "deduct_fixed", 0],
        ["1 – 2 years", "", "deduct_percent", 10],
        ["2 – 3 years", "", "deduct_percent", 20],
        ["More than 3 years", "", "deduct_percent", 30],
      ],
    },
    {
      title: "What do you have with the phone?", type: "multi",
      description: "Original accessories add to the quote",
      options: [
        ["Original box", "With matching IMEI", "add_fixed", 150],
        ["Original charger", "Brand charger in working condition", "add_fixed", 200],
        ["Purchase bill", "Valid invoice with IMEI", "add_fixed", 250],
      ],
    },
  ],
  laptop: [
    {
      title: "Is your laptop turning on?", type: "single",
      description: "Whether the device powers on and boots normally",
      options: [
        ["Yes, turns on & works", "Boots to home screen normally", "deduct_fixed", 0],
        ["No, dead or won't boot", "Does not power on / no display", "deduct_percent", 60],
      ],
    },
    {
      title: "Overall physical condition", type: "single",
      description: "Screen, lid, keyboard deck and base",
      options: [
        ["Like new", "No visible marks or dents", "deduct_fixed", 0],
        ["Minor wear", "Light scratches or scuffs", "deduct_percent", 10],
        ["Heavy wear / dents", "Deep scratches, dents or worn keys", "deduct_percent", 20],
        ["Cracked screen or broken hinge", "Panel damage or hinge not holding", "deduct_percent", 35],
      ],
    },
    {
      title: "Any functional issues?", type: "multi",
      description: "Select every problem the laptop has",
      options: [
        ["Weak / dead battery", "Battery drains fast or not charging", "deduct_percent", 10],
        ["Keyboard / trackpad issue", "Keys or trackpad not working properly", "deduct_percent", 8],
        ["Display issue", "Lines, spots or flickering on screen", "deduct_percent", 15],
        ["Speaker / mic issue", "Low or no sound", "deduct_percent", 5],
        ["Ports not working", "USB / HDMI / audio jack faulty", "deduct_percent", 8],
        ["Wi-Fi / Bluetooth issue", "Connectivity not working", "deduct_percent", 8],
      ],
    },
    {
      title: "How old is your laptop?", type: "single",
      description: "Time since original purchase",
      options: [
        ["Under 1 year", "Bought within the last 12 months", "deduct_fixed", 0],
        ["1 – 2 years", "", "deduct_percent", 12],
        ["2 – 4 years", "", "deduct_percent", 25],
        ["More than 4 years", "", "deduct_percent", 40],
      ],
    },
    {
      title: "What accessories do you have?", type: "multi",
      description: "Original accessories add to the quote",
      options: [
        ["Original charger", "Brand adapter in working condition", "add_fixed", 500],
        ["Original box", "", "add_fixed", 200],
        ["Purchase bill", "Valid invoice with serial number", "add_fixed", 300],
      ],
    },
  ],
};

async function main() {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to RDS. Creating buyback tables...");
  await client.query(DDL);
  console.log("Tables ready.");

  for (const [serviceType, questions] of Object.entries(QUESTIONS)) {
    const { rows } = await client.query(
      "SELECT COUNT(*)::int AS n FROM buyback_questions WHERE service_type = $1",
      [serviceType],
    );
    if (rows[0].n > 0) {
      console.log(`Skipping ${serviceType}: ${rows[0].n} question(s) already exist.`);
      continue;
    }
    console.log(`Seeding ${questions.length} default ${serviceType} questions...`);
    let qOrder = 1;
    for (const q of questions) {
      const res = await client.query(
        `INSERT INTO buyback_questions (service_type, title, description, question_type, sort_order, active)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
        [serviceType, q.title, q.description || null, q.type, qOrder++],
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

  const counts = await client.query(
    "SELECT service_type, COUNT(*)::int AS questions FROM buyback_questions GROUP BY service_type ORDER BY service_type",
  );
  console.log("Done:", JSON.stringify(counts.rows));
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
