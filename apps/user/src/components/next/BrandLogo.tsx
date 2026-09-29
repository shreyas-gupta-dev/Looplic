"use client";

import { useState } from "react";

import { renderableImageUrl } from "@/src/lib/images/registry";

type BrandLogoProps = {
  name: string;
  imageUrl?: string | null;
  letter: string;
  gradient: string;
  className: string;
  fallbackClassName?: string;
};

export function BrandLogo({
  name,
  imageUrl,
  letter,
  gradient,
  className,
  fallbackClassName,
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  // Catalog rows carry logos from mixed sources; only render the ones we host or
  // allowlist (see isRenderableImageUrl). Everything else falls through to the
  // branded letter tile, which is a better fallback than a third-party favicon.
  const allowed = renderableImageUrl(imageUrl);
  const usableImageUrl = allowed && !failed ? allowed : "";

  if (usableImageUrl) {
    return (
      <img
        src={usableImageUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${fallbackClassName ?? className}`}>
      <span className="text-xs font-extrabold text-primary-foreground">{letter}</span>
    </div>
  );
}
