"use client";

import Link from "next/link";
import type { Route } from "next";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const privateNavLinks: { href: Route; label: string }[] = [
  { href: "/discover", label: "Discover" },
  { href: "/submit", label: "Submit" }
];

const profileLink: { href: Route; label: string } = { href: "/profile", label: "Profile" };

export function NavHeader() {
  const pathname = usePathname();
  const { status } = useSession();
  const visibleNavLinks = status === "authenticated" ? [...privateNavLinks, profileLink] : [];

  return (
    <header className="sticky top-4 z-20 mb-8">
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.15)] bg-[linear-gradient(120deg,rgba(19,27,38,0.92),rgba(10,14,21,0.9))] shadow-[0_20px_55px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_22%,rgba(244,179,106,0.24),transparent_32%),radial-gradient(circle_at_86%_0%,rgba(239,127,68,0.22),transparent_30%)]" />
        <nav className="relative flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
          <Link href="/" className="group inline-flex w-fit items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] font-[family-name:var(--font-display)] text-lg text-[var(--accent)] transition group-hover:-translate-y-0.5">
              R
            </span>
            <span className="font-[family-name:var(--font-display)] text-2xl tracking-[0.08em] text-[var(--foreground)] sm:text-3xl">
              Recipeli
            </span>
          </Link>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] p-1 text-[0.72rem] uppercase tracking-[0.17em] sm:text-xs">
              {visibleNavLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-3 py-1.5 transition ${
                      isActive
                        ? "bg-[rgba(244,179,106,0.2)] text-[var(--foreground)]"
                        : "text-[var(--muted)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {status === "authenticated" ? (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-xl border border-[rgba(255,255,255,0.16)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[rgba(255,255,255,0.3)] hover:text-[var(--foreground)]"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  pathname === "/login"
                    ? "bg-[var(--accent)] text-[#1a140d]"
                    : "border border-[rgba(255,255,255,0.16)] text-[var(--foreground)] hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.1)]"
                }`}
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
