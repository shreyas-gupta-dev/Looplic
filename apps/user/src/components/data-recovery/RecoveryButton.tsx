"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import React from "react";

type RecoveryButtonProps = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  showArrow?: boolean;
};

export function RecoveryButton({
  href = "#book",
  onClick,
  children,
  variant = "primary",
  className = "",
  showArrow = true,
}: RecoveryButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

  const variantStyles = {
    primary:
      "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 active:scale-[0.99]",
    secondary:
      "bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:scale-[0.99]",
    outline:
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400",
  };

  const combinedClasses = `${baseStyles} ${variantStyles[variant]} ${className}`;

  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        onClick={(e) => {
          if (onClick) onClick();
        }}
        className={combinedClasses}
      >
        <span>{children}</span>
        {showArrow && <ArrowRight className="size-4 shrink-0" />}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={combinedClasses}>
      <span>{children}</span>
      {showArrow && <ArrowRight className="size-4 shrink-0" />}
    </Link>
  );
}
