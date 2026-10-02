const fs = require("fs");

async function check() {
  const env = fs.readFileSync("apps/user/.env.local", "utf8");
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

  const endpoints = [
    "/auth/v1/settings",
    "/auth/v1/admin/config",
    "/rest/v1/",
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(url + ep, {
        headers: { Authorization: "Bearer " + key, apikey: key },
      });
      const text = await res.text();
      console.log(ep, res.status, text.slice(0, 300));
    } catch (err) {
      console.log(ep, "Error:", err.message);
    }
  }
}

check();
