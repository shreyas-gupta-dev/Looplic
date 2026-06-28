"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, useCallback, useEffect } from "react";

type CatalogPrefetchLinkProps = ComponentProps<typeof Link> & {
  href: string;
  eagerPrefetch?: boolean;
};

export function CatalogPrefetchLink({
  href,
  eagerPrefetch = false,
  onMouseEnter,
  onTouchStart,
  ...props
}: CatalogPrefetchLinkProps) {
  const router = useRouter();

  const prefetchRoute = useCallback(() => {
    router.prefetch(href);
  }, [href, router]);

  useEffect(() => {
    if (!eagerPrefetch) {
      return;
    }

    const timeoutId = window.setTimeout(prefetchRoute, 120);
    return () => window.clearTimeout(timeoutId);
  }, [eagerPrefetch, prefetchRoute]);

  return (
    <Link
      {...props}
      href={href}
      prefetch
      onMouseEnter={(event) => {
        prefetchRoute();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        prefetchRoute();
        onTouchStart?.(event);
      }}
    />
  );
}
