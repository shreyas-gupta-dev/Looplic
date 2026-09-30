"use client";

import { useState } from "react";

import { getLocalBrandLogo } from "@/src/lib/images/brand-logos";
import { renderableImageUrl } from "@/src/lib/images/registry";

type BrandLogoProps = {
  name: string;
  imageUrl?: string | null;
  letter: string;
  gradient: string;
  className: string;
  fallbackClassName?: string;
  slug?: string;
};

export function BrandLogo({
  name,
  imageUrl,
  letter,
  gradient,
  className,
  fallbackClassName,
  slug,
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  // 1. Prefer local first-party brand logo (crisp, zero competitor hotlink)
  const localLogo = getLocalBrandLogo(slug || name);

  // 2. Allowlisted URL from DB or external source
  const allowed = renderableImageUrl(imageUrl);

  const usableImageUrl = !failed ? (localLogo || allowed || "") : "";

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
