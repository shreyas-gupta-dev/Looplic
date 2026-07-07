// Replaces the MOBILE and LAPTOP buyback question sets with a structure that
// mirrors Cashify's evaluation flow exactly:
//
//   1. Core yes/no questions (grouped on one screen by the sell wizard —
//      any consecutive run of 2-option single questions renders as one
//      "Tell us more about your device" screen).
//   2. Screen/body defects — illustrated multi-select tiles.
//   3. Functional or physical problems — the big defect tile grid.
//   4. "Do you have the following?" — accessories the seller HAS, modelled as
//      add_fixed so having everything lifts the quote back toward base.
//
// Calibration (matches Cashify's public behaviour + the agreed rule that a
// flawless device quotes ₹1,000–2,000 under the admin "Get Upto" price):
//   - Perfect yes/no answers carry fixed deductions totalling ₹1,500 (mobile)
//     / ₹1,600 (laptop). Owning all accessories adds back ₹500 → a perfect
//     device with full kit = base − ₹1,000; without kit = base − ₹1,500/1,600.
//   - Every defect is a PERCENT deduction that compounds on the running value,
//     so a dead phone that is also cracked bottoms out at parts value, not ₹0.
//
// Backs up existing mobile/laptop questions to scripts/buyback-questions-backup-<ts>.json,
// then deletes and re-inserts those two service types (options cascade).
// Tablet/smartwatch/audio sets are untouched.
// Usage: DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/seed-buyback-questions-cashify.cjs
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
    // ── Stage 1: core yes/no (grouped into one screen by the wizard) ──
    {
      title: "Are you able to make and receive calls?", type: "single",
      description: "Check your device for cellular network connectivity issues.",
      options: [
        ["Yes", "Connects to network and calls work fine", "deduct_fixed", 600],
        ["No", "Cannot make or receive calls / no network", "deduct_percent", 55],
      ],
    },
    {
      title: "Is your device's touch screen working properly?", type: "single",
      description: "Check the touch screen functionality of your phone.",
      options: [
        ["Yes", "Touch responds accurately everywhere", "deduct_fixed", 500],
        ["No", "Touch faulty, dead zones or unresponsive", "deduct_percent", 30],
      ],
    },
    {
      title: "Is your phone's screen original?", type: "single",
      description: "Pick \"Yes\" if screen was never changed or was changed by an Authorized Service Center. Pick \"No\" if screen was changed at a local shop.",
      options: [
        ["Yes", "Original or authorized-service-center screen", "deduct_fixed", 400],
        ["No", "Screen changed at a local shop", "deduct_percent", 22],
      ],
    },
    // ── Stage 2: screen/body defect tiles ──
    {
      title: "Select screen/body defects that are applicable", type: "multi",
      description: "Please provide correct details — skip if none apply.",
      options: [
        ["Broken/scratch on device screen", "Cracks or scratches on the glass", "deduct_percent", 30],
        ["Dead spot/visible lines and discoloration on screen", "Display panel defects while switched on", "deduct_percent", 35],
        ["Scratch/dent on device body", "Marks or dents on frame or back", "deduct_percent", 12],
        ["Device panel missing/broken", "Back panel or frame parts missing or broken", "deduct_percent", 20],
      ],
    },
    // ── Stage 3: functional/physical problem grid ──
    {
      title: "Functional or physical problems", type: "multi",
      description: "Please choose appropriate condition to get an accurate quote.",
      options: [
        ["Front camera not working", "", "deduct_percent", 8],
        ["Back camera not working", "", "deduct_percent", 10],
        ["Volume button not working", "", "deduct_percent", 4],
        ["Fingerprint sensor not working", "", "deduct_percent", 6],
        ["WiFi not working", "", "deduct_percent", 12],
        ["Speaker faulty", "", "deduct_percent", 7],
        ["Silent button not working", "", "deduct_percent", 3],
        ["Face sensor not working", "", "deduct_percent", 6],
        ["Power button not working", "", "deduct_percent", 6],
        ["Charging port not working", "", "deduct_percent", 8],
        ["Audio receiver not working", "", "deduct_percent", 6],
        ["Camera glass broken", "", "deduct_percent", 5],
        ["Microphone not working", "", "deduct_percent", 7],
        ["Bluetooth not working", "", "deduct_percent", 8],
        ["Vibrator not working", "", "deduct_percent", 3],
        ["Proximity sensor not working", "", "deduct_percent", 4],
        ["Battery in service (health below 80%)", "", "deduct_percent", 10],
        ["Battery health 80-85%", "", "deduct_percent", 5],
      ],
    },
    // ── Stage 4: accessories the seller HAS ──
    {
      title: "Do you have the following?", type: "multi",
      description: "Please select accessories which are available.",
      options: [
        ["Original charger of device", "", "add_fixed", 250],
        ["Original box with same IMEI", "", "add_fixed", 250],
      ],
    },
  ],

  laptop: [
    // ── Stage 1: core yes/no ──
    {
      title: "Does your laptop turn on and work?", type: "single",
      description: "Whether it powers on and boots to the desktop.",
      options: [
        ["Yes", "Boots and runs normally", "deduct_fixed", 700],
        ["No", "Does not power on or boot", "deduct_percent", 55],
      ],
    },
    {
      title: "Is the display working properly?", type: "single",
      description: "No lines, spots, flicker or backlight issues.",
      options: [
        ["Yes", "Display looks perfect", "deduct_fixed", 500],
        ["No", "Lines, spots, flicker or dim backlight", "deduct_percent", 35],
      ],
    },
    {
      title: "Are the keyboard and trackpad fully working?", type: "single",
      description: "Every key and full trackpad functionality.",
      options: [
        ["Yes", "All keys and trackpad work", "deduct_fixed", 400],
        ["No", "Some keys or trackpad faulty", "deduct_percent", 15],
      ],
    },
    // ── Stage 2: screen/body defect tiles ──
    {
      title: "Select screen/body defects that are applicable", type: "multi",
      description: "Please provide correct details — skip if none apply.",
      options: [
        ["Broken/cracked screen", "Cracked glass or damaged panel", "deduct_percent", 35],
        ["Dead spot/visible lines on display", "Panel defects while switched on", "deduct_percent", 30],
        ["Scratch/dent on body", "Marks or dents on lid, deck or base", "deduct_percent", 10],
        ["Hinge loose or broken", "Lid doesn't hold position or hinge cracked", "deduct_percent", 18],
        ["Panel/parts missing", "Covers, feet or bezel parts missing", "deduct_percent", 15],
      ],
    },
    // ── Stage 3: functional/physical problem grid ──
    {
      title: "Functional or physical problems", type: "multi",
      description: "Please choose appropriate condition to get an accurate quote.",
      options: [
        ["Battery backup less than 1 hour", "", "deduct_percent", 12],
        ["Battery not detected / in service", "", "deduct_percent", 18],
        ["Speaker faulty", "", "deduct_percent", 6],
        ["Camera not working", "", "deduct_percent", 5],
        ["WiFi/Bluetooth not working", "", "deduct_percent", 10],
        ["USB/ports not working", "", "deduct_percent", 8],
        ["Charging issue", "", "deduct_percent", 10],
        ["Fan noise / overheating", "", "deduct_percent", 8],
        ["Storage (HDD/SSD) issue", "", "deduct_percent", 12],
        ["Graphics/display card issue", "", "deduct_percent", 15],
        ["Microphone not working", "", "deduct_percent", 5],
      ],
    },
    // ── Stage 4: accessories the seller HAS ──
    {
      title: "Do you have the following?", type: "multi",
      description: "Please select accessories which are available.",
      options: [
        ["Original charger of laptop", "", "add_fixed", 300],
        ["Original box", "", "add_fixed", 150],
        ["Purchase bill", "", "add_fixed", 100],
      ],
    },
  ],
};

async function main() {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const serviceTypes = Object.keys(QUESTIONS);

  const backup = await client.query(
    `SELECT q.*, (SELECT json_agg(o.* ORDER BY o.sort_order) FROM buyback_question_options o WHERE o.question_id = q.id) AS options
     FROM buyback_questions q WHERE q.service_type = ANY($1) ORDER BY q.service_type, q.sort_order`,
    [serviceTypes],
  );
  const backupPath = path.join(__dirname, `buyback-questions-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup.rows, null, 2));
  console.log(`Backed up ${backup.rows.length} existing question(s) to ${backupPath}`);

  await client.query("BEGIN");
  try {
    for (const [serviceType, questions] of Object.entries(QUESTIONS)) {
      const del = await client.query("DELETE FROM buyback_questions WHERE service_type = $1", [serviceType]);
      console.log(`Removed ${del.rowCount} old ${serviceType} question(s). Inserting ${questions.length} Cashify-style ones...`);

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
