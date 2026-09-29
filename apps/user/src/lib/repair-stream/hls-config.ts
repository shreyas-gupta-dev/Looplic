import { eq } from "drizzle-orm";

// Server-side only: this module resolves internal camera URLs.
if (typeof window !== "undefined") {
  throw new Error("hls-config.ts is server-only and must not be imported by client code");
}

import { db } from "@/src/lib/db";
import { appSettings } from "@/src/lib/db/schema";

/**
 * Per-service-centre live camera configuration.
 *
 * Stored in `app_settings`, not in the repository and not in environment variables,
 * because it is operational data that changes when a centre is added or a camera is
 * re-cabled, and because it may contain a credential.
 *
 * Nothing here is ever sent to a browser. The client only receives a path back
 * through this app; the app fetches the upstream itself. That keeps the media
 * server off the public internet and means a customer never learns a camera URL.
 *
 * Expected value shape (JSON, stored as text):
 *
 *   {
 *     "centres": {
 *       "nagarathpete": {
 *         "label": "Bengaluru — Nagarathpete",
 *         "playlistUrl": "http://10.0.0.12:8888/bench-1/index.m3u8"
 *       }
 *     },
 *     "defaultCentre": "nagarathpete"
 *   }
 *
 * `playlistUrl` points at a media server (MediaMTX / go2rtc) that converts the
 * camera's RTSP feed to HLS. No such server is provisioned — see
 * docs/repair-live-view.md.
 */

export const REPAIR_STREAM_SETTINGS_KEY = "repair_stream_centres";

export type CentreConfig = {
  label: string;
  playlistUrl: string;
};

export type RepairStreamConfig = {
  centres: Record<string, CentreConfig>;
  defaultCentre: string | null;
};

const EMPTY: RepairStreamConfig = { centres: {}, defaultCentre: null };

/**
 * Normalises whatever the driver hands back into an object.
 *
 * `app_settings.value` is **jsonb** in the database, so node-postgres parses it and
 * returns an object — even though the Drizzle schema declares the column as `text`.
 * That mismatch is why this used to fail: `JSON.parse` was being handed an object,
 * threw, and the live camera was reported as misconfigured and disabled no matter
 * what was stored. `getRepairSubcategoryPriceVisibility` in data/catalog.ts already
 * treats the value as an object, so that is the convention.
 *
 * Both shapes are accepted rather than picking one, because the declared type and
 * the real column disagree and a future migration could change which one arrives.
 */
function asObject(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === "object") {
    return Array.isArray(raw) ? null : (raw as Record<string, unknown>);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "null") return null;
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      console.error(`[repair-stream] ${REPAIR_STREAM_SETTINGS_KEY} is not valid JSON; live camera disabled`);
      return null;
    }
  }

  return null;
}

function parseConfig(raw: unknown): RepairStreamConfig {
  const source = asObject(raw) as { centres?: unknown; defaultCentre?: unknown } | null;
  if (!source) return EMPTY;

  const centres: Record<string, CentreConfig> = {};

  if (source.centres && typeof source.centres === "object") {
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

export async function getRepairStreamConfig(): Promise<RepairStreamConfig> {
  try {
    const rows = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, REPAIR_STREAM_SETTINGS_KEY))
      .limit(1);

    return parseConfig(rows[0]?.value ?? null);
  } catch (error) {
    // Absent settings row or unreachable database: live camera is simply off.
    console.error("[repair-stream] could not read live camera config:", error);
    return EMPTY;
  }
}

/**
 * Resolves a session's `provider_ref` to an upstream playlist URL.
 *
 * `provider_ref` holds the centre key. An unknown or missing key resolves to null,
 * so a misconfigured session serves nothing rather than falling back to some other
 * centre's camera.
 */
export async function resolvePlaylistUrl(providerRef: string | null): Promise<string | null> {
  const config = await getRepairStreamConfig();
  const key = providerRef?.trim() || config.defaultCentre;
  if (!key) return null;

  return config.centres[key]?.playlistUrl ?? null;
}

/** Whether any live camera is configured at all. */
export async function hasLiveCameraConfigured(): Promise<boolean> {
  const config = await getRepairStreamConfig();
  return Object.keys(config.centres).length > 0;
}
