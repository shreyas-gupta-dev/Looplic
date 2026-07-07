// Replaces the buyback evaluation question sets with the calibrated v2 model.
//
// Pricing model (validated against Cashify's public numbers: minor scratches
// cut 10-15%, cracked screens 30-40%, dead/broken displays 50%+):
//
//   - The admin-entered base price = the device in PERFECT condition.
//   - A perfect device does NOT get the full base price: the best option of
//     the display, body and age questions each carries a small FIXED deduction
//     (used-device margin), totalling ~₹1,500 mobile / ~₹1,700 laptop. So a
//     flawless device quotes ₹1,000-2,000 under base — never at or above it.
//   - Every fault option is a PERCENT deduction that compounds on the running
//     value (base × 0.88 × 0.65 ...), so damage stacks the way Cashify does
//     and heavily damaged devices bottom out at parts value instead of ₹0.
//   - Accessories are asked as "what is MISSING" fixed deductions, so having
//     everything keeps the quote unchanged (it never pushes above base-1500).
//
// The script backs up the existing question set to scripts/buyback-questions-backup-<ts>.json,
// then DELETEs and re-inserts both service types (options cascade).
// Usage: DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/seed-buyback-questions-v2.cjs
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

const QUESTIONS = {
  mobile: [
    {
      title: "Are you able to make and receive calls?", type: "single",
      description: "Whether the phone powers on and works as a phone",
      options: [
        ["Yes, works fine", "Powers on, boots and connects to network", "deduct_fixed", 0],
        ["No — dead / won't turn on", "Does not power on or no display at all", "deduct_percent", 58],
      ],
    },
    {
      title: "What's the condition of the display?", type: "single",
      description: "Look closely at the screen with it switched on and off",
      options: [
        ["Flawless — no scratches", "Original display, spotless", "deduct_fixed", 600],
        ["Minor scratches", "Visible only when the screen is off", "deduct_percent", 12],
        ["Heavy scratches", "Clearly visible marks while using the phone", "deduct_percent", 20],
        ["Cracked glass (display works)", "Glass broken but touch and picture are fine", "deduct_percent", 35],
        ["Display faulty", "Lines, spots, flickering or touch not working", "deduct_percent", 45],
      ],
    },
    {
      title: "How does the body look?", type: "single",
      description: "Frame, back panel and corners",
      options: [
        ["Like new", "No visible marks or dents", "deduct_fixed", 500],
        ["Minor scratches / scuffs", "Normal signs of use", "deduct_percent", 8],
        ["Major dents or cracked back", "Deep dents, chipped corners or broken back glass", "deduct_percent", 18],
        ["Bent or broken frame", "Frame bent, panel gaps or parts loose", "deduct_percent", 28],
      ],
    },
    {
      title: "Any functional problems?", type: "multi",
      description: "Select every issue your phone has — skip if none",
      options: [
        ["Battery drains fast", "Needs charging more than twice a day or battery warning", "deduct_percent", 8],
        ["Camera issue", "Front or rear camera blurry, spots or not working", "deduct_percent", 10],
        ["Speaker / mic issue", "Low or no sound on calls, media or recordings", "deduct_percent", 7],
        ["Fingerprint / Face unlock faulty", "Biometric unlock not working", "deduct_percent", 5],
        ["Charging port issue", "Loose cable, slow or intermittent charging", "deduct_percent", 8],
        ["Network / Wi-Fi issue", "SIM not detected, weak signal or Wi-Fi problems", "deduct_percent", 12],
        ["Buttons / vibration faulty", "Power, volume keys or vibration motor not working", "deduct_percent", 4],
      ],
    },
    {
      title: "How old is your phone?", type: "single",
      description: "Time since original purchase",
      options: [
        ["Less than 3 months", "Practically new", "deduct_fixed", 400],
        ["3 – 11 months", "Still under brand warranty", "deduct_percent", 6],
        ["1 – 2 years", "", "deduct_percent", 12],
        ["2 – 3 years", "", "deduct_percent", 20],
        ["More than 3 years", "", "deduct_percent", 28],
      ],
    },
    {
      title: "Is anything missing from the original kit?", type: "multi",
      description: "Select whatever you can NOT hand over with the phone",
      options: [
        ["Original charger missing", "No brand charger / cable", "deduct_fixed", 300],
        ["Original box missing", "No box with matching IMEI", "deduct_fixed", 200],
        ["Purchase bill missing", "No invoice with IMEI", "deduct_fixed", 300],
      ],
    },
  ],
  laptop: [
    {
      title: "Does your laptop power on and boot?", type: "single",
      description: "Whether it starts and reaches the desktop normally",
      options: [
        ["Yes, works fine", "Boots to the OS without issues", "deduct_fixed", 0],
        ["No — dead / won't boot", "No power, no display or stuck before the OS", "deduct_percent", 55],
      ],
    },
    {
      title: "What's the condition of the screen?", type: "single",
      description: "Check with the display on and off",
      options: [
        ["Flawless — no scratches", "Spotless panel", "deduct_fixed", 700],
        ["Minor scratches", "Visible only when the screen is off", "deduct_percent", 10],
        ["Heavy scratches / pressure marks", "Clearly visible while working", "deduct_percent", 18],
        ["Cracked panel or lines / spots", "Physical damage or display faults", "deduct_percent", 35],
      ],
    },
    {
      title: "How does the body look?", type: "single",
      description: "Lid, keyboard deck, base and hinges",
      options: [
        ["Like new", "No visible marks or dents", "deduct_fixed", 500],
        ["Minor wear", "Light scratches or scuffs", "deduct_percent", 8],
        ["Heavy wear / dents", "Deep scratches, dents or shiny worn keys", "deduct_percent", 16],
        ["Broken hinge or cracked panel", "Hinge loose/broken or body cracked", "deduct_percent", 30],
      ],
    },
    {
      title: "Any functional problems?", type: "multi",
      description: "Select every issue your laptop has — skip if none",
      options: [
        ["Battery backup under 1 hour", "Or battery not charging / swollen", "deduct_percent", 10],
        ["Keyboard issue", "Some keys not working or keycaps missing", "deduct_percent", 8],
        ["Trackpad issue", "Not responding or erratic cursor", "deduct_percent", 6],
        ["Ports not working", "USB, HDMI or audio jack faulty", "deduct_percent", 6],
        ["Speakers / mic issue", "Low or no sound", "deduct_percent", 4],
        ["Webcam not working", "", "deduct_percent", 4],
        ["Wi-Fi / Bluetooth issue", "Connectivity dropping or not detected", "deduct_percent", 7],
        ["Overheating / loud fan", "Gets hot quickly or fan always at full speed", "deduct_percent", 8],
      ],
    },
    {
      title: "How old is your laptop?", type: "single",
      description: "Time since original purchase",
      options: [
        ["Less than 1 year", "Still under brand warranty", "deduct_fixed", 500],
        ["1 – 2 years", "", "deduct_percent", 10],
        ["2 – 4 years", "", "deduct_percent", 22],
        ["More than 4 years", "", "deduct_percent", 35],
      ],
    },
    {
      title: "Is anything missing from the original kit?", type: "multi",
      description: "Select whatever you can NOT hand over with the laptop",
      options: [
        ["Original charger missing", "No brand power adapter", "deduct_fixed", 600],
        ["Original box missing", "", "deduct_fixed", 200],
        ["Purchase bill missing", "No invoice with serial number", "deduct_fixed", 300],
      ],
    },
  ],
};

async function main() {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to RDS.");

  // Back up the current question set before replacing it.
  const backup = await client.query(`
    SELECT q.id, q.service_type, q.title, q.description, q.question_type, q.sort_order, q.active,
           COALESCE(json_agg(json_build_object(
             'label', o.label, 'description', o.description, 'effect_type', o.effect_type,
             'amount', o.amount, 'sort_order', o.sort_order
           ) ORDER BY o.sort_order) FILTER (WHERE o.id IS NOT NULL), '[]') AS options
    FROM buyback_questions q
    LEFT JOIN buyback_question_options o ON o.question_id = q.id
    GROUP BY q.id ORDER BY q.service_type, q.sort_order`);
  const backupPath = path.join(__dirname, `buyback-questions-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup.rows, null, 2));
  console.log(`Backed up ${backup.rows.length} existing question(s) to ${backupPath}`);

  await client.query("BEGIN");
  try {
    for (const [serviceType, questions] of Object.entries(QUESTIONS)) {
      const del = await client.query("DELETE FROM buyback_questions WHERE service_type = $1", [serviceType]);
      console.log(`Removed ${del.rowCount} old ${serviceType} question(s). Inserting ${questions.length} calibrated ones...`);

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
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }

  const counts = await client.query(`
    SELECT q.service_type, COUNT(DISTINCT q.id)::int AS questions, COUNT(o.id)::int AS options
    FROM buyback_questions q LEFT JOIN buyback_question_options o ON o.question_id = q.id
    GROUP BY q.service_type ORDER BY q.service_type`);
  console.log("Done:", JSON.stringify(counts.rows));
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
