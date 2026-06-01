"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type CookbookButtonProps = {
  recipeId: string;
  initialInCookbook: boolean;
};

export function CookbookButton({ recipeId, initialInCookbook }: CookbookButtonProps) {
  const [inCookbook, setInCookbook] = useState(initialInCookbook);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function toggle() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/cookbook/${recipeId}`, {
        method: inCookbook ? "DELETE" : "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Unable to update cookbook.");
      }

      const data = (await response.json()) as { inCookbook: boolean };
      setInCookbook(data.inCookbook);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggle}
        disabled={isLoading}
        aria-pressed={inCookbook}
        className={`w-full rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition disabled:opacity-50 ${
          inCookbook
            ? "border border-[var(--accent)] bg-transparent text-[var(--accent)] hover:bg-[var(--accent)]/10"
            : "bg-[var(--accent)] text-[var(--background)] hover:bg-[var(--accent-strong)]"
        }`}
      >
        {isLoading
          ? inCookbook
            ? "Removing…"
            : "Saving…"
          : inCookbook
            ? "In your cookbook ✓"
            : "Save to cookbook"}
      </button>
      {error ? (
        <p className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-200">{error}</p>
      ) : null}
    </div>
  );
}
