"use client";

import { Loader2, ShieldCheck, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Live camera player for the `hls` provider.
 *
 * Plays the proxied playlist from /api/repair-stream/[bookingId]/hls. Safari plays
 * HLS natively; everywhere else needs hls.js, which is loaded dynamically so the
 * library is not in the bundle for the far more common stage-media case.
 *
 * The consent gate is not decoration: the proxy route refuses to serve a playlist
 * until consent has been recorded for the current session, so a customer who has not
 * agreed genuinely cannot receive camera footage.
 */

type RepairLiveStreamProps = {
  bookingId: string;
  phone: string;
  grant: string;
  consentGiven: boolean;
  onConsent: () => Promise<void>;
};

export function RepairLiveStream({ bookingId, phone, grant, consentGiven, onConsent }: RepairLiveStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [consenting, setConsenting] = useState(false);

  const playlistUrl = `/api/repair-stream/${bookingId}/hls?phone=${encodeURIComponent(phone)}&grant=${encodeURIComponent(grant)}`;

  useEffect(() => {
    if (!consentGiven) return;

    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    // Typed loosely: hls.js is only imported when a live camera is actually in use.
    let hls: { destroy: () => void } | null = null;

    async function attach() {
      // Safari (and iOS, where a lot of customers will be) plays HLS natively.
      if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.src = playlistUrl;
        return;
      }

      try {
        const { default: Hls } = await import("hls.js");
        if (destroyed) return;

        if (!Hls.isSupported()) {
          setError("Live view is not supported in this browser.");
          return;
        }

        const instance = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls = instance;
        instance.loadSource(playlistUrl);
        instance.attachMedia(video!);

        instance.on(Hls.Events.ERROR, (_event, data) => {
          // Only fatal errors are worth surfacing; hls.js recovers from the rest.
          if (data.fatal) setError("The live feed stopped. It may have been ended by our technician.");
        });
      } catch {
        setError("Could not start the live view.");
      }
    }

    void attach();

    return () => {
      destroyed = true;
      hls?.destroy();
    };
  }, [consentGiven, playlistUrl]);

  async function handleConsent() {
    setConsenting(true);
    try {
      await onConsent();
    } finally {
      setConsenting(false);
    }
  }

  if (!consentGiven) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
          <div>
            <p className="text-[13px] font-bold text-brand-700">Watch the repair live?</p>
            <p className="mt-1 text-[12px] leading-5 text-brand-700/80">
              We can show you a live camera view of the workbench while your device is being
              repaired. The feed is only available to you, only while the repair is in progress,
              and it stops as soon as our technician finishes.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleConsent}
          disabled={consenting}
          className="mt-3 inline-flex items-center gap-2 rounded-full gradient-brand px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          {consenting ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Show me the live view
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2.5 rounded-2xl bg-gray-50 px-4 py-3">
        <VideoOff className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
        <p className="text-[12px] text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-900">
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        playsInline
        className="aspect-video w-full"
        aria-label="Live view of your repair"
      />
    </div>
  );
}
