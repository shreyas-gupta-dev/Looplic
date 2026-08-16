"use client";

import { useEffect, useState } from "react";

/**
 * SplashScreen — shows a 3D-animated Looplic infinity logo on initial site load.
 * Plays for ~2 seconds then fades out, revealing the website underneath.
 * Only shows once per session (sessionStorage flag).
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only show once per browser session
    if (typeof window !== "undefined" && sessionStorage.getItem("looplic-splash-shown")) {
      setVisible(false);
      return;
    }

    // Quick flash — just enough for brand recognition, then get out of the way
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 100);

    // Remove from DOM after fade animation completes (150ms)
    const removeTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("looplic-splash-shown", "1");
    }, 250);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`splash-screen ${fadeOut ? "splash-screen--fade-out" : ""}`}
      aria-hidden="true"
    >
      <div className="splash-screen__content">
        {/* 3D Rotating Infinity Logo */}
        <div className="splash-screen__logo-wrapper">
          <svg
            viewBox="0 0 200 100"
            className="splash-screen__logo"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="splash-infinity-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1a2744" />
                <stop offset="35%" stopColor="#2563eb" />
                <stop offset="65%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              {/* Animated stroke gradient for the trace effect */}
              <linearGradient id="splash-trace-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e3a5f" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>
            {/* Infinity path - thick stroke, rounded caps */}
            <path
              d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50 Z"
              fill="none"
              stroke="url(#splash-infinity-gradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="splash-screen__infinity-path"
            />
            {/* Trace animation - a bright path that traces along */}
            <path
              d="M 50 50 C 50 20, 90 20, 100 50 C 110 80, 150 80, 150 50 C 150 20, 110 20, 100 50 C 90 80, 50 80, 50 50 Z"
              fill="none"
              stroke="url(#splash-trace-gradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="splash-screen__infinity-trace"
            />
          </svg>
        </div>

        {/* Brand name */}
        <p className="splash-screen__brand">looplic</p>
      </div>
    </div>
  );
}
