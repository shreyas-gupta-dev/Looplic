import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/lib/db";
import { appSettings, userRoles } from "@/src/lib/db/schema";
import { getServerSession } from "@/src/lib/auth/cognito-server";

/**
 * Service-centre live camera configuration, for admins.
 *
 * Why this is not just `app_settings` through `/api/db-proxy`: the value holds
 * camera playlist URLs, which may embed credentials. The proxy's gate is "staff",
 * which includes every technician and operator; this needs to be narrower. So it
 * gets its own route with an explicit **admin-only** check, and the proxy refuses
 * to serve the key at all.
 *
 * This is the one place a camera URL is ever sent to a browser. Everywhere else —
 * and in particular anything a customer can reach — resolves it server-side and
 * returns a path back through the app instead.
 *
 *   GET    → { centres: { key: { label, playlistUrl } }, defaultCentre }
 *   PUT    → { key, label, playlistUrl, makeDefault? }  upsert one centre
 *   DELETE → ?key=...                                    remove one centre
 */

export const dynamic = "force-dynamic";

const SETTINGS_KEY = "repair_stream_centres";

type CentreConfig = { label: string; playlistUrl: string };
type StoredConfig = { centres: Record<string, CentreConfig>; defaultCentre: string | null };

/**
 * Flat rather than a discriminated union on `ok`: these app tsconfigs disable
 * `strictNullChecks`, so a union would not narrow and `guard.response` would not
 * type-check. The same shape is used by `changeBookingStatus` for the same reason.
 */
type AdminGuard = { ok: boolean; response?: NextResponse };

async function requireAdmin(): Promise<AdminGuard> {
  const session = await getServerSession();
  if (!session.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const rows = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.role, "admin")));

  if (rows.length === 0) {
    // 403 rather than 404: an operator reaching this knows the feature exists, and
    // hiding it from them buys nothing.
    return { ok: false, response: NextResponse.json({ error: "Admins only" }, { status: 403 }) };
  }

  return { ok: true };
}

/**
 * `app_settings.value` is jsonb in the database but declared `text` in the Drizzle
 * schema, so the driver may hand back either an object or a string depending on the
 * path. Accept both — assuming a string here is the bug that kept the live camera
 * silently disabled.
 */
function normalize(raw: unknown): StoredConfig {
  let parsed: unknown = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { centres: {}, defaultCentre: null };
  }

  const source = parsed as { centres?: unknown; defaultCentre?: unknown };
  const centres: Record<string, CentreConfig> = {};

  if (source.centres && typeof source.centres === "object" && !Array.isArray(source.centres)) {
    for (const [key, value] of Object.entries(source.centres as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;
      const centre = value as { label?: unknown; playlistUrl?: unknown };
      if (typeof centre.playlistUrl !== "string" || !centre.playlistUrl.trim()) continue;
      centres[key] = {
        label: typeof centre.label === "string" && centre.label.trim() ? centre.label : key,
        playlistUrl: centre.playlistUrl.trim(),
      };
    }
  }

  const defaultCentre =
    typeof source.defaultCentre === "string" && centres[source.defaultCentre] ? source.defaultCentre : null;

  return { centres, defaultCentre };
}

async function readConfig(): Promise<StoredConfig> {
  const rows = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, SETTINGS_KEY))
    .limit(1);

  return normalize(rows[0]?.value as unknown);
}

async function writeConfig(config: StoredConfig): Promise<void> {
  const value = JSON.stringify(config);
  const existing = await db
    .select({ key: appSettings.key })
    .from(appSettings)
    .where(eq(appSettings.key, SETTINGS_KEY))
    .limit(1);

  if (existing.length > 0) {
    await db.update(appSettings).set({ value, updatedAt: new Date() }).where(eq(appSettings.key, SETTINGS_KEY));
  } else {
    await db.insert(appSettings).values({ key: SETTINGS_KEY, value });
  }
}

/** Centre keys go into URLs and into `provider_ref`, so keep them boring. */
function isValidKey(key: unknown): key is string {
  return typeof key === "string" && /^[a-z0-9][a-z0-9-]{1,40}$/.test(key);
}

function isValidPlaylistUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    // http is allowed: the media server lives on a private network where TLS is
    // usually neither present nor needed. It is never reached from a browser.
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const config = await readConfig();
  return NextResponse.json(config, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { key?: unknown; label?: unknown; playlistUrl?: unknown; makeDefault?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidKey(body.key)) {
    return NextResponse.json(
      { error: "Centre key must be 2–41 characters of lowercase letters, digits or hyphens." },
      { status: 400 },
    );
  }
  if (!isValidPlaylistUrl(body.playlistUrl)) {
    return NextResponse.json({ error: "Playlist URL must be a valid http or https URL." }, { status: 400 });
  }

  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : body.key;

  const config = await readConfig();
  config.centres[body.key] = { label, playlistUrl: (body.playlistUrl as string).trim() };
  // The first centre becomes the default, or nothing would resolve for a session
  // opened without an explicit centre.
  if (body.makeDefault === true || !config.defaultCentre) config.defaultCentre = body.key;

  await writeConfig(config);
  return NextResponse.json(config);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const key = new URL(request.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "A centre key is required." }, { status: 400 });

  const config = await readConfig();
  if (!config.centres[key]) return NextResponse.json(config);

  delete config.centres[key];
  if (config.defaultCentre === key) {
    // Never leave the default pointing at a centre that no longer exists: an
    // unknown key resolves to nothing, which looks like a broken feature.
    config.defaultCentre = Object.keys(config.centres)[0] ?? null;
  }

  await writeConfig(config);
  return NextResponse.json(config);
}
