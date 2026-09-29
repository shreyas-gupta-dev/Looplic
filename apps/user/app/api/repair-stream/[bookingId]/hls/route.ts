import { NextResponse } from "next/server";

import { getActiveSession } from "@looplic/db/repair-stream";

import { db } from "@/src/lib/db";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { authorizeBookingViewer } from "@/src/lib/repair-stream/authorize";
import { verifyGrant } from "@/src/lib/repair-stream/grant";
import { resolvePlaylistUrl } from "@/src/lib/repair-stream/hls-config";

/**
 * GET /api/repair-stream/[bookingId]/hls?phone=...&grant=...&segment=...
 *
 * Proxies a live camera feed.
 *
 * Everything goes through this app rather than pointing the browser at the media
 * server, for three reasons:
 *   - the media server stays off the public internet;
 *   - the customer never learns a camera URL, so nothing outlives the session;
 *   - authorization, session state and grant are re-checked on the playlist AND on
 *     every segment, so revoking a session stops playback within seconds rather
 *     than at the end of the stream.
 *
 * Without `segment` this returns the playlist, rewritten so its segment references
 * point back here. With `segment` it returns those bytes — or, when the name is
 * itself a playlist, the rewritten nested playlist.
 *
 * A media server is provisioned by infra/mediamtx (see docs/repair-live-view.md).
 * With no centre configured this route answers 404, which is also what it does for
 * every other denial.
 */

// Segments are a few seconds each; a viewer fetches them continuously.
const SEGMENT_RATE_LIMIT = 1200;

/** Absolute-URL guard: a rewritten playlist must not be able to point elsewhere. */
function isSafeSegmentName(name: string): boolean {
  // Segment names come from the upstream playlist and are echoed back to us. Allow
  // only simple relative names, so this can never be turned into an SSRF fetch of
  // an arbitrary host or a path traversal.
  return /^[A-Za-z0-9._-]{1,128}$/.test(name) && !name.includes("..");
}

/**
 * Whether a reference is a nested playlist rather than media bytes.
 *
 * Checked after isSafeSegmentName, so the name is already known to be a simple
 * relative token.
 */
function isPlaylistName(name: string): boolean {
  return /\.m3u8?$/i.test(name);
}

export async function GET(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const url = new URL(request.url);
  const segment = url.searchParams.get("segment");

  const limited = await guardRateLimit(
    request,
    segment ? "api:repair-hls-segment" : "api:repair-hls",
    segment ? SEGMENT_RATE_LIMIT : 120,
    600,
  );
  if (limited) return limited;

  const denied = new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  try {
    const { bookingId } = await context.params;
    const phone = url.searchParams.get("phone");
    const grant = url.searchParams.get("grant");

    if (!grant) return denied;

    const authorization = await authorizeBookingViewer(bookingId, phone);
    if (!authorization.authorized) return denied;

    const session = await getActiveSession(db as never, authorization.bookingId!);
    if (!session || session.provider !== "hls") return denied;

    const check = verifyGrant(grant, session.id);
    if (!check.valid || check.bookingId !== authorization.bookingId) return denied;

    // Live camera footage requires explicit consent for this session.
    if (!session.consentAt) return denied;

    const playlistUrl = await resolvePlaylistUrl(session.providerRef);
    if (!playlistUrl) return denied;

    if (segment) {
      if (!isSafeSegmentName(segment)) return denied;

      const segmentUrl = new URL(segment, playlistUrl).toString();
      // Only ever fetch from the same origin as the configured playlist.
      if (new URL(segmentUrl).origin !== new URL(playlistUrl).origin) return denied;

      const upstream = await fetch(segmentUrl, { cache: "no-store" });
      if (!upstream.ok || !upstream.body) return denied;

      // A real media server serves a MASTER playlist at index.m3u8 whenever the
      // source has more than one track — MediaMTX does this for any camera with
      // audio, and for low-latency HLS generally. Its lines are not segments but
      // nested variant playlists, whose own segment references are relative to
      // themselves. Streaming those through untouched would make the player
      // resolve segments against this route's path and 404 on every one, so a
      // nested playlist is rewritten exactly like the top-level one.
      if (isPlaylistName(segment)) {
        const nested = await upstream.text();
        return new NextResponse(
          rewritePlaylist(nested, { bookingId: authorization.bookingId!, phone, grant }),
          {
            headers: {
              "Content-Type": "application/vnd.apple.mpegurl",
              "Cache-Control": "private, no-store, max-age=0",
            },
          },
        );
      }

      return new NextResponse(upstream.body, {
        headers: {
          "Content-Type": upstream.headers.get("content-type") ?? "video/mp2t",
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    }

    const upstream = await fetch(playlistUrl, { cache: "no-store" });
    if (!upstream.ok) return denied;

    const playlist = await upstream.text();
    const rewritten = rewritePlaylist(playlist, {
      bookingId: authorization.bookingId!,
      phone,
      grant,
    });

    return new NextResponse(rewritten, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[repair-stream] hls proxy failed:", error);
    return denied;
  }
}

/**
 * Rewrites every reference in a playlist so the player fetches it back through this
 * route instead of reaching the media server directly.
 *
 * Two kinds of reference, and both matter:
 *
 *  - **Bare lines** — segment or variant-playlist names.
 *  - **`URI="..."` attributes inside tags** — `EXT-X-MAP` (the initialisation
 *    segment for fMP4), `EXT-X-MEDIA` (the audio rendition's playlist),
 *    `EXT-X-PART` and `EXT-X-PRELOAD-HINT` (low-latency parts),
 *    `EXT-X-RENDITION-REPORT`.
 *
 * Missing the second kind is not a cosmetic bug: the playlist still parses, so it
 * looks fine, but the player resolves those URIs against *this* route's path, gets
 * 404s, and fails with an obscure error — `manifestIncompatibleCodecsError` when the
 * audio rendition cannot be loaded. Any real camera has audio, and MediaMTX serves
 * low-latency HLS with `EXT-X-MAP` and parts, so every one of these appears in
 * practice.
 *
 * A tag whose URI is not a simple relative name is dropped whole rather than
 * partially rewritten. These tags are optimisations; losing one costs a little
 * latency, whereas forwarding an absolute URL would turn this route into an
 * arbitrary-URL fetcher.
 */
function rewritePlaylist(
  playlist: string,
  context: { bookingId: string; phone: string | null; grant: string },
): string {
  const query = new URLSearchParams();
  if (context.phone) query.set("phone", context.phone);
  query.set("grant", context.grant);

  const proxyUrlFor = (name: string): string => {
    const segmentQuery = new URLSearchParams(query);
    segmentQuery.set("segment", name);
    return `/api/repair-stream/${context.bookingId}/hls?${segmentQuery.toString()}`;
  };

  return playlist
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith("#")) {
        if (!/URI\s*=\s*"/i.test(trimmed)) return line;

        let dropped = false;
        const rewritten = trimmed.replace(/URI\s*=\s*"([^"]*)"/gi, (_match, uri: string) => {
          if (!isSafeSegmentName(uri)) {
            dropped = true;
            return `URI=""`;
          }
          return `URI="${proxyUrlFor(uri)}"`;
        });

        return dropped ? "" : rewritten;
      }

      // Anything that is not a simple relative name is dropped rather than
      // forwarded: an upstream playlist should never contain an absolute URL here,
      // and if it does we are not going to proxy it.
      if (!isSafeSegmentName(trimmed)) return "";

      return proxyUrlFor(trimmed);
    })
    .join("\n");
}
