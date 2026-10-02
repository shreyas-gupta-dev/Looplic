import { NextResponse } from "next/server";
import { resolvePlaylistUrl } from "@/src/lib/repair-stream/hls-config";

export const dynamic = "force-dynamic";

// Standard open HLS stream used when physical CCTV camera is offline or in development
const DEMO_FALLBACK_STREAM = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

function isSafeSegmentName(name: string): boolean {
  return /^[A-Za-z0-9._-]{1,128}$/.test(name) && !name.includes("..");
}

function isPlaylistName(name: string): boolean {
  return /\.m3u8?$/i.test(name);
}

function rewritePlaylist(playlist: string, bench: string, baseUrl: string): string {
  const lines = playlist.split(/\r?\n/);
  const rewritten: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("#")) {
      // Pass HLS tags through unmodified
      rewritten.push(trimmed);
      continue;
    }

    // Relative segment or nested playlist name
    const segmentName = trimmed.split("?")[0].split("/").pop() || trimmed;
    if (!isSafeSegmentName(segmentName)) continue;

    rewritten.push(`/api/live-camera/stream?bench=${encodeURIComponent(bench)}&segment=${encodeURIComponent(segmentName)}`);
  }

  return rewritten.join("\n") + "\n";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bench = url.searchParams.get("bench") || "bench-1";
  const segment = url.searchParams.get("segment");

  try {
    let playlistUrl = await resolvePlaylistUrl(bench);
    let isFallback = false;

    // Check if the configured upstream camera is alive
    if (playlistUrl) {
      try {
        const testRes = await fetch(playlistUrl, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(1500) });
        if (!testRes.ok) playlistUrl = null;
      } catch {
        playlistUrl = null;
      }
    }

    // Fall back to demo stream if physical camera is offline or in dev
    if (!playlistUrl) {
      playlistUrl = DEMO_FALLBACK_STREAM;
      isFallback = true;
    }

    if (segment) {
      if (!isSafeSegmentName(segment)) {
        return new NextResponse("Invalid segment", { status: 400 });
      }

      const segmentUrl = new URL(segment, playlistUrl).toString();
      const upstream = await fetch(segmentUrl, { cache: "no-store" });
      if (!upstream.ok || !upstream.body) {
        return new NextResponse("Segment unavailable", { status: 404 });
      }

      if (isPlaylistName(segment)) {
        const nested = await upstream.text();
        return new NextResponse(rewritePlaylist(nested, bench, segmentUrl), {
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "private, no-store, max-age=0",
          },
        });
      }

      return new NextResponse(upstream.body, {
        headers: {
          "Content-Type": upstream.headers.get("content-type") || "video/MP2T",
          "Cache-Control": "public, max-age=10",
        },
      });
    }

    // Top-level playlist request
    const upstream = await fetch(playlistUrl, { cache: "no-store" });
    if (!upstream.ok) {
      return new NextResponse("Stream offline", { status: 503 });
    }

    const playlistText = await upstream.text();
    const rewritten = rewritePlaylist(playlistText, bench, playlistUrl);

    return new NextResponse(rewritten, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Looplic-Stream-Mode": isFallback ? "demo-fallback" : "live-cctv",
      },
    });
  } catch (error) {
    console.error("[live-camera/stream] Error streaming:", error);
    return new NextResponse("Stream unavailable", { status: 503 });
  }
}
