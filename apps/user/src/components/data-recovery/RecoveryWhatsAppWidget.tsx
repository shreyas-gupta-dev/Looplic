"use client";

import { useState, useEffect } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { LAB_CONTACT } from "./recovery-data";

export function RecoveryWhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check IST working hours (Mon–Sat 10:00 – 20:00 IST)
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utc + 3600000 * 5.5);
    const day = istTime.getDay();
    const hours = istTime.getHours();

    const openNow = day !== 0 && hours >= 10 && hours < 20;
    setIsOnline(openNow);
  }, []);

  const quickPills = [
    { label: "Clicking hard drive", text: "Hi, my hard drive is making a clicking sound and is not detected. Please advise." },
    { label: "MacBook won't turn on", text: "Hi, my MacBook won't turn on and has important files on it. Can you help?" },
    { label: "Get quote / diagnosis", text: "Hi, I would like to get a quote and diagnosis for my failed storage drive." },
    { label: "RAID / Server down", text: "Hi, our enterprise RAID server is down and we need emergency data recovery." },
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalMsg = message.trim() || "Hi Looplic Data Recovery, I need guidance for my storage device.";
    const url = `https://wa.me/${LAB_CONTACT.whatsapp}?text=${encodeURIComponent(finalMsg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* ─── Chat Pop-up Drawer ─────────────────────────────────────────────── */}
      {open && (
        <div className="mb-3 w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm">
                  L
                </div>
                <span
                  className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white ${
                    isOnline ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
              </div>
              <div>
                <strong className="block text-xs font-bold text-slate-900">Looplic Recovery Lab</strong>
                <span className="text-[10px] text-slate-500">
                  {isOnline ? "Online · typically replies in mins" : "After hours · emergency queue active"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp chat"
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Quick pills */}
          <div className="mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select a quick question:
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {quickPills.map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => {
                    setMessage(pill.text);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 text-left transition-colors"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message input */}
          <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
            />
            <button
              type="submit"
              className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ─── Floating Launcher Button ───────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-white shadow-xl hover:bg-emerald-700 hover:scale-105 transition-all"
        aria-label="Chat on WhatsApp"
      >
        <MessageSquare className="size-5" />
        <span className="text-xs font-bold hidden sm:inline">WhatsApp Engineer</span>
      </button>
    </div>
  );
}
