"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function RootOAuthRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      return;
    }

    const callbackParams = new URLSearchParams({ code });
    const next = searchParams.get("next");
    const state = searchParams.get("state");

    if (next) {
      callbackParams.set("next", next);
    }

    if (state) {
      callbackParams.set("state", state);
    }

    window.location.replace(`/auth/callback?${callbackParams.toString()}`);
  }, [searchParams]);

  return null;
}
