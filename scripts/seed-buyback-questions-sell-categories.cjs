// Seeds calibrated buyback evaluation question sets for the new sell
// categories: tablet, smartwatch, audio. Same pricing model as the v2
// mobile/laptop sets (scripts/seed-buyback-questions-v2.cjs):
//
//   - Perfect-condition answers carry small FIXED deductions (used-device
//     margin) so a flawless device quotes ₹850-1,600 under the admin base
//     price — never at or above it.
//   - Faults are PERCENT deductions that compound on the running value.
//   - Missing accessories are fixed deductions.
//
// Backs up existing tablet/smartwatch/audio questions (if any) to
// scripts/buyback-questions-backup-<ts>.json, then deletes and re-inserts
// those three service types only. Mobile and laptop are untouched.
// Usage: DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/seed-buyback-questions-sell-categories.cjs
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

const QUESTIONS = {
  tablet: [
    {
      title: "Does your tablet turn on and work?", type: "single",
      description: "Whether it powers on, boots and responds to touch",
      options: [
        ["Yes, works fine", "Powers on and works normally", "deduct_fixed", 0],
        ["No — dead / won't turn on", "Does not power on or no display at all", "deduct_percent", 55],
      ],
    },
    {
      title: "What's the condition of the display?", type: "single",
      description: "Look closely with the screen on and off",
      options: [
        ["Flawless — no scratches", "Original display, spotless", "deduct_fixed", 500],
        ["Minor scratches", "Visible only when the screen is off", "deduct_percent", 12],
        ["Heavy scratches", "Clearly visible marks while using it", "deduct_percent", 20],
        ["Cracked glass (display works)", "Glass broken but touch and picture are fine", "deduct_percent", 35],
        ["Display faulty", "Lines, spots, flickering or touch not working", "deduct_percent", 45],
      ],
    },
    {
      title: "How does the body look?", type: "single",
      description: "Frame, back panel and corners",
      options: [
        ["Like new", "No visible marks or dents", "deduct_fixed", 400],
        ["Minor scratches / scuffs", "Normal signs of use", "deduct_percent", 8],
        ["Major dents or damage", "Deep dents, chipped corners or bent frame", "deduct_percent", 20],
      ],
    },
    {
      title: "Any functional problems?", type: "multi",
      description: "Select every issue your tablet has — skip if none",
      options: [
        ["Battery drains fast", "Doesn't last through normal use", "deduct_percent", 8],
        ["Camera issue", "Front or rear camera blurry or not working", "deduct_percent", 6],
        ["Speaker / mic issue", "Low or no sound, or mic not working", "deduct_percent", 6],
        ["Charging port issue", "Loose cable, slow or intermittent charging", "deduct_percent", 8],
        ["Wi-Fi / Bluetooth issue", "Weak or failing connectivity", "deduct_percent", 10],
        ["Buttons faulty", "Power or volume keys not working", "deduct_percent", 4],
      ],
    },
    {
      title: "How old is your tablet?", type: "single",
      description: "Time since original purchase",
      options: [
        ["Less than 3 months", "Practically new", "deduct_fixed", 300],
        ["3 – 11 months", "Still under brand warranty", "deduct_percent", 6],
        ["1 – 2 years", "", "deduct_percent", 12],
        ["2 – 3 years", "", "deduct_percent", 20],
        ["More than 3 years", "", "deduct_percent", 30],
      ],
    },
    {
      title: "What's missing from the original kit?", type: "multi",
      description: "Select everything you DON'T have — skip if you have it all",
      options: [
        ["Original box missing", "", "deduct_fixed", 200],
        ["Original charger missing", "", "deduct_fixed", 250],
        ["Purchase bill missing", "", "deduct_fixed", 150],
      ],
    },
  ],

  smartwatch: [
    {
      title: "Does your watch turn on and work?", type: "single",
      description: "Whether it powers on, pairs and responds",
      options: [
        ["Yes, works fine", "Powers on, pairs and tracks normally", "deduct_fixed", 0],
        ["No — dead / won't turn on", "Does not power on at all", "deduct_percent", 60],
      ],
    },
    {
      title: "What's the condition of the display / glass?", type: "single",
      description: "Look closely with the screen on and off",
      options: [
        ["Flawless — no scratches", "Spotless glass and display", "deduct_fixed", 400],
        ["Minor scratches", "Light marks visible up close", "deduct_percent", 10],
        ["Cracked or chipped glass", "Glass damaged but display works", "deduct_percent", 35],
        ["Display faulty", "Lines, spots, flickering or touch issues", "deduct_percent", 45],
      ],
    },
    {
      title: "Body and strap condition?", type: "single",
      description: "Case, crown, sensors and strap",
      options: [
        ["Like new", "No visible marks, original strap in good shape", "deduct_fixed", 300],
        ["Normal wear", "Light scuffs on case or strap", "deduct_percent", 8],
        ["Heavy wear / strap damaged or missing", "Deep marks, dents, or strap needs replacing", "deduct_percent", 15],
      ],
    },
    {
      title: "How's the battery?", type: "single",
      description: "Backup on a full charge",
      options: [
        ["Lasts as expected", "Normal battery backup for the model", "deduct_fixed", 200],
        ["Drains fast", "Needs charging much sooner than it should", "deduct_percent", 15],
      ],
    },
    {
      title: "Any functional problems?", type: "multi",
      description: "Select every issue your watch has — skip if none",
      options: [
        ["Sensors not working", "Heart rate, SpO2 or GPS issues", "deduct_percent", 10],
        ["Buttons / crown faulty", "Stuck or unresponsive controls", "deduct_percent", 8],
        ["Speaker / mic issue", "Calls or alerts not audible", "deduct_percent", 6],
        ["Charging issue", "Doesn't charge reliably", "deduct_percent", 12],
      ],
    },
    {
      title: "How old is your watch?", type: "single",
      description: "Time since original purchase",
      options: [
        ["Less than 3 months", "Practically new", "deduct_fixed", 200],
        ["3 – 11 months", "Still under brand warranty", "deduct_percent", 6],
        ["1 – 2 years", "", "deduct_percent", 12],
        ["2 – 3 years", "", "deduct_percent", 22],
        ["More than 3 years", "", "deduct_percent", 32],
      ],
    },
    {
      title: "What's missing from the original kit?", type: "multi",
      description: "Select everything you DON'T have — skip if you have it all",
      options: [
        ["Original box missing", "", "deduct_fixed", 150],
        ["Charging cable / puck missing", "", "deduct_fixed", 200],
        ["Purchase bill missing", "", "deduct_fixed", 100],
      ],
    },
  ],

  audio: [
    {
      title: "Do they power on and work?", type: "single",
      description: "Pairing and playback on both sides",
      options: [
        ["Yes, both sides work fine", "Pairs and plays normally", "deduct_fixed", 200],
        ["One earbud / one side not working", "Only one side plays or connects", "deduct_percent", 40],
        ["Won't power on or pair", "Completely dead or unpairable", "deduct_percent", 60],
      ],
    },
    {
      title: "How's the sound quality?", type: "single",
      description: "Play something and listen closely",
      options: [
        ["Clear, like new", "No distortion at any volume", "deduct_fixed", 150],
        ["Crackle / low volume / ANC issues", "Distortion, imbalance or noise cancellation faults", "deduct_percent", 25],
      ],
    },
    {
      title: "How's the battery backup?", type: "single",
      description: "Compared to when they were new",
      options: [
        ["Close to original backup", "Lasts about as long as expected", "deduct_fixed", 150],
        ["Drains noticeably fast", "Needs charging much more often", "deduct_percent", 20],
      ],
    },
    {
      title: "Physical condition?", type: "single",
      description: "Earbuds / headphones body",
      options: [
        ["Like new", "No visible marks", "deduct_fixed", 150],
        ["Normal scratches / scuffs", "Signs of daily use", "deduct_percent", 8],
        ["Cracked or damaged", "Broken headband, hinge or housing", "deduct_percent", 20],
      ],
    },
    {
      title: "Charging case condition?", type: "single",
      description: "For earbuds — pick 'Like new' if not applicable",
      options: [
        ["Like new / not applicable", "Case works and looks clean", "deduct_fixed", 100],
        ["Scratched but working", "Cosmetic wear only", "deduct_percent", 5],
        ["Case not charging properly", "Battery or port issues in the case", "deduct_percent", 25],
        ["Case lost / missing", "You only have the earbuds", "deduct_percent", 35],
      ],
    },
    {
      title: "How old are they?", type: "single",
      description: "Time since original purchase",
      options: [
        ["Less than 3 months", "Practically new", "deduct_fixed", 100],
        ["3 – 11 months", "Still under brand warranty", "deduct_percent", 8],
        ["1 – 2 years", "", "deduct_percent", 15],
        ["More than 2 years", "", "deduct_percent", 25],
      ],
    },
    {
      title: "What's missing from the original kit?", type: "multi",
      description: "Select everything you DON'T have — skip if you have it all",
      options: [
        ["Original box missing", "", "deduct_fixed", 100],
        ["Charging cable missing", "", "deduct_fixed", 80],
        ["Spare ear tips missing", "", "deduct_fixed", 50],
        ["Purchase bill missing", "", "deduct_fixed", 50],
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
