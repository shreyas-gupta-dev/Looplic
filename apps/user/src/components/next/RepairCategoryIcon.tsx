"use client";

import { useState } from "react";
import { repairCategoryIcon } from "@/src/lib/repair-selection";
import { renderableImageUrl } from "@/src/lib/images/registry";

interface RepairCategoryIconProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
  iconClassName?: string;
}

export function RepairCategoryIcon({
  name,
  imageUrl,
  className = "size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm",
  iconClassName = "size-5",
}: RepairCategoryIconProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const validUrl = renderableImageUrl(imageUrl);

  if (validUrl && !imgFailed) {
    return (
      <img
        src={validUrl}
        alt={name}
        className="size-10 rounded-xl object-contain"
        onError={() => setImgFailed(true)}
      />
    );
  }

  const Icon = repairCategoryIcon(name);
  return (
    <div className={className}>
      <Icon className={iconClassName} aria-hidden="true" />
    </div>
  );
}
