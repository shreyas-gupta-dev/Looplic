"use client";

import type { LeadPayload } from "@/src/lib/leads/types";

export async function notifyLeadSubmission(payload: LeadPayload) {
  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        pageUrl: payload.pageUrl || (typeof window !== "undefined" ? window.location.href : undefined),
      }),
    });
    return response.ok;
  } catch (error) {
    console.warn("Lead email notification failed", error);
    return false;
  }
}
