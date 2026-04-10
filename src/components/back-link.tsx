"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";

type BackLinkProps = {
  fallbackHref: Route;
  fallbackLabel: string;
};

export function BackLink({ fallbackHref, fallbackLabel }: BackLinkProps) {
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.history.length > 1) {
      event.preventDefault();
      router.back();
    }
  };

  return (
    <Link
      href={fallbackHref}
      onClick={handleClick}
      className="text-xs uppercase tracking-[0.24em] text-[var(--muted)] transition hover:text-[var(--foreground)]"
    >
      &larr; {fallbackLabel}
    </Link>
  );
}
