#!/usr/bin/env node
/**
 * Reads and writes the live-camera configuration for service centres.
 *
 * The config lives in `app_settings` under `repair_stream_centres`, not in the
 * repository and not in environment variables, because it is operational data that
 * changes when a centre is added or a camera is re-cabled, and because a camera URL
 * may carry a credential.
 *
 * It is deliberately server-side only: `hls-config.ts` refuses to load in a
 * browser, and the customer never receives a camera URL — they get a path back
 * through the app, which fetches the upstream itself.
 *
 * Usage:
 *   node scripts/repair-stream-centres.cjs --show
 *   node scripts/repair-stream-centres.cjs --set-local
 *   node scripts/repair-stream-centres.cjs --set <key> <label> <playlistUrl> [--default]
 *   node scripts/repair-stream-centres.cjs --remove <key>
 *
 * --set-local points a `local-bench` centre at the MediaMTX container from
 * infra/mediamtx, which is what makes the live view work on a development machine.
 */

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const { Pool } = require("pg");

const SETTINGS_KEY = "repair_stream_centres";
const LOCAL_KEY = "local-bench";
const LOCAL_PLAYLIST = "http://127.0.0.1:8888/bench-test/index.m3u8";

function loadEnv(key) {
  for (const file of [join("apps", "user", ".env.local"), ".env.local"]) {
    try {
      for (const line of readFileSync(join(__dirname, "..", file), "utf8").split(/\r?\n/)) {
        if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
        const index = line.indexOf("=");
        if (line.slice(0, index).trim() === key) return line.slice(index + 1).trim();
      }
    } catch {
      /* try the next file */
    }
  }
  return process.env[key] ?? null;
}

const databaseUrl = loadEnv("DATABASE_URL");
if (!databaseUrl) {
  console.error("DATABASE_URL not found in apps/user/.env.local, .env.local or the environment.");
  process.exit(2);
}

const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, max: 2 });

async function readConfig() {
  const { rows } = await pool.query("SELECT value FROM app_settings WHERE key = $1 LIMIT 1", [SETTINGS_KEY]);
  if (rows.length === 0) return { config: { centres: {}, defaultCentre: null }, raw: null, valid: true };

  const raw = rows[0].value;

  // The column is jsonb, so the driver hands back a parsed object. It is declared
  // as text in the Drizzle schema, so a string is possible too. Accept both rather
  // than assuming — assuming a string here is exactly the bug that kept the live
  // camera disabled.
  let parsed = null;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    parsed = raw;
  } else if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { config: { centres: {}, defaultCentre: null }, raw, valid: false };
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { config: { centres: {}, defaultCentre: null }, raw, valid: false };
  }

  return {
    config: {
      centres: parsed.centres && typeof parsed.centres === "object" ? parsed.centres : {},
      defaultCentre: typeof parsed.defaultCentre === "string" ? parsed.defaultCentre : null,
    },
    raw,
    valid: true,
  };
}

async function writeConfig(config) {
  const value = JSON.stringify(config, null, 2);
  await pool.query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [SETTINGS_KEY, value],
  );
}

async function show() {
  const { config, raw, valid } = await readConfig();

  if (raw === null) {
    console.log(`No ${SETTINGS_KEY} row. Live camera is off; stage-media still works.`);
    return;
  }
  if (!valid) {
    console.log(`⚠ ${SETTINGS_KEY} exists but is NOT valid JSON, so the live camera is disabled.`);
    console.log(`  Stored value: ${raw}`);
    console.log(`  Fix with --set-local or --set <key> <label> <url>.`);
    return;
  }

  const keys = Object.keys(config.centres);
  console.log(`${SETTINGS_KEY}: ${keys.length} centre(s), default: ${config.defaultCentre ?? "(none)"}`);
  for (const key of keys) {
    const centre = config.centres[key];
    const isDefault = key === config.defaultCentre ? "  ← default" : "";
    console.log(`  ${key}: ${centre.label}${isDefault}`);
    console.log(`    ${centre.playlistUrl}`);
  }
  if (keys.length === 0) console.log("  (none — live camera off)");
}

async function set(key, label, playlistUrl, makeDefault) {
  if (!key || !label || !playlistUrl) {
    console.error("Usage: --set <key> <label> <playlistUrl> [--default]");
    process.exit(2);
  }

  let parsed;
  try {
    parsed = new URL(playlistUrl);
  } catch {
    console.error(`Not a URL: ${playlistUrl}`);
    process.exit(2);
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    console.error(`playlistUrl must be http or https, got ${parsed.protocol}`);
    process.exit(2);
  }

  const { config, valid, raw } = await readConfig();
  if (!valid && raw !== null) {
    console.log(`⚠ Replacing an unparseable ${SETTINGS_KEY} value; the old one is discarded.`);
  }

  config.centres[key] = { label, playlistUrl };
  // First centre becomes the default, otherwise nothing would resolve for a session
  // opened without an explicit provider_ref.
  if (makeDefault || !config.defaultCentre) config.defaultCentre = key;

  await writeConfig(config);
  console.log(`✓ ${key} → ${playlistUrl}`);
  console.log(`  default centre: ${config.defaultCentre}`);
}

async function remove(key) {
  const { config } = await readConfig();
  if (!config.centres[key]) {
    console.log(`No centre named ${key}.`);
    return;
  }

  delete config.centres[key];
  if (config.defaultCentre === key) {
    // Never leave a default pointing at a centre that no longer exists — an unknown
    // key resolves to nothing, which would look like a broken feature.
    config.defaultCentre = Object.keys(config.centres)[0] ?? null;
  }

  await writeConfig(config);
  console.log(`✓ removed ${key}; default is now ${config.defaultCentre ?? "(none)"}`);
}

async function main() {
  const [mode, ...rest] = process.argv.slice(2);

  try {
    if (!mode || mode === "--show") await show();
    else if (mode === "--set-local") await set(LOCAL_KEY, "Local MediaMTX bench (development)", LOCAL_PLAYLIST, true);
    else if (mode === "--set")
      await set(rest[0], rest[1], rest[2], rest.includes("--default"));
    else if (mode === "--remove") await remove(rest[0]);
    else {
      console.error(`Unknown option ${mode}. Use --show, --set-local, --set or --remove.`);
      process.exit(2);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`${error.name}: ${error.message}`);
  process.exit(1);
});
