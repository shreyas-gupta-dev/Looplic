"use client";

import { useEffect, useState } from "react";

/**
 * SplashScreen — shows a 3D-animated Looplic infinity logo on initial site load.
 * Plays for ~1.5 seconds then fades out over 0.5s, revealing the website underneath.
 * Only shows once per session (sessionStorage flag) — subsequent navigations skip it entirely.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("looplic-splash-shown");
  });
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!visible) return;

    // Show the animation for 1.5s, then start fading out
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    // Remove from DOM after fade-out animation completes (500ms transition)
    const removeTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("looplic-splash-shown", "1");
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [visible]);

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
                <stop offset="0%" stopColor="#001020" />
                <stop offset="35%" stopColor="#056EF6" />
                <stop offset="65%" stopColor="#01B5B5" />
                <stop offset="100%" stopColor="#00D69A" />
              </linearGradient>
              {/* Animated stroke gradient for the trace effect */}
              <linearGradient id="splash-trace-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#012A52" />
                <stop offset="50%" stopColor="#4593F9" />
                <stop offset="100%" stopColor="#14E8AC" />
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
