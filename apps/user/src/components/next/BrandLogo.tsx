"use client";

import { useState } from "react";

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
  const usableImageUrl = typeof imageUrl === "string" && imageUrl.trim() && !failed ? imageUrl.trim() : "";

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
