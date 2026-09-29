"use client";

import { Loader2, Plus, RefreshCw, Trash2, Video, VideoOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

/**
 * Live view administration: which service centres have cameras, and who is
 * currently able to watch a repair.
 *
 * Both halves used to require editing `app_settings` by hand or running a script,
 * which meant adding a camera was a developer task and revoking a customer's access
 * had no interface at all.
 *
 * Admin-only, and enforced server-side by the two routes this calls — not by hiding
 * the tab. Camera URLs are shown here because this is where they are edited; this is
 * the only surface in any app that displays one.
 */

type Centre = { label: string; playlistUrl: string };
type CentreConfig = { centres: Record<string, Centre>; defaultCentre: string | null };

type LiveSession = {
  id: string;
  bookingId: string;
  provider: string;
  providerRef: string | null;
  state: string;
  openedAt: string | null;
  expiresAt: string | null;
  consentAt: string | null;
  bookingCode: string | null;
  customerName: string | null;
  bookingStatus: string | null;
  expired: boolean;
};

type OpenableBooking = {
  id: string;
  bookingCode: string | null;
  customerName: string | null;
  status: string;
  serviceType: string;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function LiveViewTab() {
  const [config, setConfig] = useState<CentreConfig>({ centres: {}, defaultCentre: null });
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [openable, setOpenable] = useState<OpenableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [draftKey, setDraftKey] = useState("");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftUrl, setDraftUrl] = useState("");

  const [sessionBooking, setSessionBooking] = useState("");
  const [sessionCentre, setSessionCentre] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [centresRes, sessionsRes, bookingsRes] = await Promise.all([
        fetch("/api/repair-stream/centres"),
        fetch("/api/repair-stream/sessions"),
        fetch("/api/repair-stream/sessions", { method: "PATCH" }),
      ]);

      if (centresRes.status === 403 || sessionsRes.status === 403) {
        setError("This section is restricted to admins.");
        return;
      }

      if (centresRes.ok) setConfig(await centresRes.json());
      if (sessionsRes.ok) setSessions((await sessionsRes.json()).sessions ?? []);
      if (bookingsRes.ok) setOpenable((await bookingsRes.json()).bookings ?? []);
    } catch {
      setError("Could not load live view settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveCentre() {
    setBusy("centre");
    setError(null);
    try {
      const response = await fetch("/api/repair-stream/centres", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: draftKey.trim(), label: draftLabel.trim(), playlistUrl: draftUrl.trim() }),
      });

      if (!response.ok) {
        setError((await response.json()).error ?? "Could not save the centre.");
        return;
      }

      setConfig(await response.json());
      setDraftKey("");
      setDraftLabel("");
      setDraftUrl("");
    } finally {
      setBusy(null);
    }
  }

  async function removeCentre(key: string) {
    setBusy(`centre:${key}`);
    try {
      const response = await fetch(`/api/repair-stream/centres?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (response.ok) setConfig(await response.json());
    } finally {
      setBusy(null);
    }
  }

  async function openLiveSession() {
    setBusy("session");
    setError(null);
    try {
      const response = await fetch("/api/repair-stream/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "open",
          bookingId: sessionBooking,
          provider: sessionCentre ? "hls" : "stage-media",
          providerRef: sessionCentre || null,
        }),
      });

      if (!response.ok) {
        setError((await response.json()).error ?? "Could not open a session.");
        return;
      }

      setSessionBooking("");
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function closeLiveSession(sessionId: string) {
    setBusy(`session:${sessionId}`);
    try {
      const response = await fetch("/api/repair-stream/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", sessionId }),
      });
      if (response.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading live view settings…
      </div>
    );
  }

  const centreKeys = Object.keys(config.centres);

  return (
    <div className="mt-4 space-y-6">
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {/* ── Staff recording notice ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
        <strong className="font-bold">Before switching a camera on.</strong> A bench camera records
        staff continuously and may catch other customers&apos; devices in frame. Tell the people
        working at that bench, obtain whatever consent local employment law requires, and frame the
        camera on the bench only. Customers give their own consent per session; this covers the
        other side of the lens.
      </div>

      {/* ── Service centres ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Service centre cameras</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void load()} className="gap-1.5">
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {centreKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No cameras configured. Live sessions will find nothing to play until one is added —
              stage-media sessions (technician photos and clips) still work.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-semibold">Key</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Centre</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Playlist URL</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Default</th>
                    <th scope="col" className="py-2 font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {centreKeys.map((key) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{key}</td>
                      <td className="py-2 pr-3">{config.centres[key].label}</td>
                      <td className="py-2 pr-3 font-mono text-xs break-all text-muted-foreground">
                        {config.centres[key].playlistUrl}
                      </td>
                      <td className="py-2 pr-3">
                        {config.defaultCentre === key ? (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                            default
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-red-600 hover:text-red-700"
                          disabled={busy === `centre:${key}`}
                          onClick={() => void removeCentre(key)}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Key</span>
              <Input
                value={draftKey}
                onChange={(event) => setDraftKey(event.target.value)}
                placeholder="nagarathpete"
              />
              <span className="block text-xs text-muted-foreground">
                Lowercase, digits and hyphens. Stored on each session.
              </span>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Label</span>
              <Input
                value={draftLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                placeholder="Bengaluru — Nagarathpete"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Playlist URL</span>
              <Input
                value={draftUrl}
                onChange={(event) => setDraftUrl(event.target.value)}
                placeholder="http://10.0.0.12:8888/bench-1/index.m3u8"
              />
              <span className="block text-xs text-muted-foreground">
                The media server&apos;s HLS address. Must stay on a private network.
              </span>
            </label>
          </div>

          <Button
            onClick={() => void saveCentre()}
            disabled={!draftKey.trim() || !draftUrl.trim() || busy === "centre"}
            className="gap-1.5"
          >
            <Plus className="size-4" aria-hidden="true" />
            Save centre
          </Button>
        </CardContent>
      </Card>

      {/* ── Live sessions ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Open viewing sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open sessions. Nothing is viewable by any customer right now.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-semibold">Order</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Customer</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Kind</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Consent</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Opened</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Expires</th>
                    <th scope="col" className="py-2 font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{session.bookingCode ?? "—"}</td>
                      <td className="py-2 pr-3">{session.customerName ?? "—"}</td>
                      <td className="py-2 pr-3">
                        {session.provider === "hls" ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Video className="size-3.5" aria-hidden="true" />
                            Live camera
                            {session.providerRef ? (
                              <span className="font-mono text-xs text-muted-foreground">
                                ({session.providerRef})
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          "Stage media"
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {session.provider === "hls" ? (
                          session.consentAt ? (
                            <span className="text-xs font-semibold text-green-700">given</span>
                          ) : (
                            <span className="text-xs font-semibold text-amber-700">not yet</span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">n/a</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{formatWhen(session.openedAt)}</td>
                      <td className="py-2 pr-3 text-xs">
                        {session.expired ? (
                          <span className="font-semibold text-amber-700">expired</span>
                        ) : (
                          <span className="text-muted-foreground">{formatWhen(session.expiresAt)}</span>
                        )}
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-red-600 hover:text-red-700"
                          disabled={busy === `session:${session.id}`}
                          onClick={() => void closeLiveSession(session.id)}
                        >
                          <VideoOff className="size-3.5" aria-hidden="true" />
                          Close
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Order</span>
              <select
                value={sessionBooking}
                onChange={(event) => setSessionBooking(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select an order being worked on…</option>
                {openable.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.bookingCode ?? booking.id.slice(0, 8)} — {booking.customerName ?? "?"} (
                    {booking.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Camera</span>
              <select
                value={sessionCentre}
                onChange={(event) => setSessionCentre(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Stage media only (no live camera)</option>
                {centreKeys.map((key) => (
                  <option key={key} value={key}>
                    {config.centres[key].label}
                  </option>
                ))}
              </select>
              <span className="block text-xs text-muted-foreground">
                A live camera session also needs the customer&apos;s consent, which they give on
                their tracking page.
              </span>
            </label>
          </div>

          <Button onClick={() => void openLiveSession()} disabled={!sessionBooking || busy === "session"} className="gap-1.5">
            <Video className="size-4" aria-hidden="true" />
            Open session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
