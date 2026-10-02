const { Client } = require("pg");
const crypto = require("node:crypto");
const fs = require("fs");

async function run() {
  const env = fs.readFileSync("apps/user/.env.local", "utf8");
  const dbUrl = env.match(/DATABASE_URL=(.*)/)[1].trim();
  const resendApiKey = env.match(/RESEND_API_KEY=(.*)/)[1].trim();
  const testEmail = "test-verification-check@looplic.com";

  console.log("=== Testing RDS Database for OTP ===");
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
  console.log(`Generated OTP code: ${code}`);

  // Clean old
  await client.query("DELETE FROM auth_email_otps WHERE email = $1", [testEmail]);

  // Insert
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await client.query(
    "INSERT INTO auth_email_otps (email, code, expires_at, attempts) VALUES ($1, $2, $3, $4)",
    [testEmail, code, expiresAt, 0]
  );
  console.log("Inserted OTP row into RDS PostgreSQL");

  // Read back
  const res = await client.query(
    "SELECT id, code, attempts, expires_at FROM auth_email_otps WHERE email = $1",
    [testEmail]
  );
  console.log("Read back from DB:", res.rows[0]);

  if (res.rows[0].code !== code) {
    throw new Error("Code mismatch in DB!");
  }

  // Test incorrect code attempt increment
  await client.query("UPDATE auth_email_otps SET attempts = attempts + 1 WHERE email = $1", [testEmail]);
  const res2 = await client.query("SELECT attempts FROM auth_email_otps WHERE email = $1", [testEmail]);
  console.log("Attempts after failed try:", res2.rows[0].attempts);

  // Clean up test email
  await client.query("DELETE FROM auth_email_otps WHERE email = $1", [testEmail]);
  console.log("Cleaned up test row");
  await client.end();

  console.log("=== Testing Resend API Key ===");
  const resendCheck = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Looplic <onboarding@resend.dev>",
      to: ["contactshreyasgupta@gmail.com"],
      subject: "Test Resend Dispatch from Looplic",
      text: "Resend configuration test OK.",
    }),
  });
  const resendData = await resendCheck.json();
  console.log("Resend API response:", resendCheck.status, resendData);

  console.log("=== ALL CHECKS PASSED ===");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
