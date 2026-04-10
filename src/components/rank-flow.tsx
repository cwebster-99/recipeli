"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { estimateComparisons } from "@/lib/ranking";

type RankedRecipeInfo = {
  id: string;
  title: string;
  cuisine: string;
};

type RankFlowProps = {
  recipeId: string;
  recipeTitle: string;
  rankedRecipes: RankedRecipeInfo[];
  onComplete: (position: number) => void;
  onCancel: () => void;
};

type Phase = "comparing" | "saving" | "done" | "error";

export function RankFlow({
  recipeId,
  recipeTitle,
  rankedRecipes,
  onComplete,
  onCancel,
}: RankFlowProps) {
  const router = useRouter();
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(rankedRecipes.length);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("comparing");
  const [finalPosition, setFinalPosition] = useState<number | null>(null);

  const totalEstimate = estimateComparisons(rankedRecipes.length);

  const mid = low < high ? Math.floor((low + high) / 2) : null;
  const opponent = mid !== null ? rankedRecipes[mid] : null;

  const handleChoice = async (preferNew: boolean) => {
    if (mid === null) return;

    const nextLow = preferNew ? low : mid + 1;
    const nextHigh = preferNew ? mid : high;

    setLow(nextLow);
    setHigh(nextHigh);
    setStep((s) => s + 1);

    if (nextLow >= nextHigh) {
      setPhase("saving");
      const position = nextLow;

      try {
        const res = await fetch("/api/recipes/rank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId, position }),
        });

        if (res.status === 401) {
          router.push("/login" as Route);
          return;
        }

        if (res.ok) {
          setFinalPosition(position);
          setPhase("done");
        } else {
          setPhase("error");
        }
      } catch {
        setPhase("error");
      }
    }
  };

  if (phase === "saving") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="mx-4 max-w-lg rounded-[2rem] border border-white/10 bg-[var(--background)] p-8 text-center">
          <p className="text-sm uppercase tracking-[0.26em] text-[var(--muted)]">Saving your ranking…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="mx-4 max-w-lg rounded-[2rem] border border-white/10 bg-[var(--background)] p-8 text-center">
          <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Something went wrong</p>
          <p className="mt-3 text-sm text-[var(--muted)]">Could not save ranking. Please try again.</p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-6 rounded-full border border-white/12 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--accent)]"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done" && finalPosition !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="mx-4 max-w-lg rounded-[2rem] border border-white/10 bg-[var(--background)] p-8 text-center">
          <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Ranking complete</p>
          <p className="mt-6 font-[family-name:var(--font-display)] text-7xl text-[var(--foreground)]">
            #{finalPosition + 1}
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--foreground)]">
            {recipeTitle}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Placed after {step} comparison{step !== 1 ? "s" : ""}.
          </p>
          <button
            type="button"
            onClick={() => onComplete(finalPosition)}
            className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--background)] transition hover:bg-[var(--accent-strong)]"
          >
            View rankings
          </button>
        </div>
      </div>
    );
  }

  if (!opponent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-[2.5rem] border border-white/10 bg-[var(--background)] p-6 sm:p-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">
            Comparison {step + 1} of ~{totalEstimate}
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--foreground)] sm:text-4xl">
            Which did you enjoy more?
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Tap the recipe you preferred.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleChoice(true)}
            className="group rounded-[1.8rem] border border-white/10 bg-white/5 p-6 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
          >
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)] group-hover:text-[var(--accent)]">
              {recipeTitle}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              The one you just made
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleChoice(false)}
            className="group rounded-[1.8rem] border border-white/10 bg-white/5 p-6 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
          >
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)] group-hover:text-[var(--accent)]">
              {opponent.title}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Currently #{(mid ?? 0) + 1} on your board
            </p>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
