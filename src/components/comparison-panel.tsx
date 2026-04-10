"use client";

import { useMemo, useState } from "react";

import {
  type Recipe,
  compareRecipes,
  getRecipeScoreBreakdown
} from "@/lib/recipes";

type ComparisonPanelProps = {
  recipes: Recipe[];
  onApplyResult?: (winnerId: string, loserId: string) => void;
};

function MetricRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-black/25">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width }} />
      </div>
    </div>
  );
}

export function ComparisonPanel({ recipes, onApplyResult }: ComparisonPanelProps) {
  const candidates = useMemo(() => recipes.filter((recipe) => recipe.personalRating > 0), [recipes]);
  const [leftSlug, setLeftSlug] = useState(candidates[0]?.slug ?? "");
  const [rightSlug, setRightSlug] = useState(candidates[1]?.slug ?? candidates[0]?.slug ?? "");

  const leftRecipe = candidates.find((recipe) => recipe.slug === leftSlug) ?? candidates[0];
  const rightRecipe = candidates.find((recipe) => recipe.slug === rightSlug) ?? candidates[1] ?? candidates[0];

  if (!leftRecipe || !rightRecipe) {
    return null;
  }

  const leftScore = getRecipeScoreBreakdown(leftRecipe);
  const rightScore = getRecipeScoreBreakdown(rightRecipe);
  const comparison = compareRecipes(leftRecipe, rightRecipe);
  const winner = comparison <= 0 ? leftRecipe : rightRecipe;
  const loser = winner.id === leftRecipe.id ? rightRecipe : leftRecipe;

  return (
    <section className="rounded-[2.4rem] border border-white/10 bg-black/16 p-6 sm:p-8">
      <p className="text-sm uppercase tracking-[0.26em] text-[var(--muted)]">Comparison lab</p>
      <h2 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-none text-[var(--foreground)]">
        Head-to-head recipe comparison
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
        Pick two recipes to compare. Recipeli uses rating, stage readiness, difficulty, and cook speed to generate a single score and rank order.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Recipe A
          <select
            value={leftSlug}
            onChange={(event) => setLeftSlug(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm normal-case tracking-normal text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          >
            {candidates.map((recipe) => (
              <option key={`left-${recipe.id}`} value={recipe.slug}>
                {recipe.title}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Recipe B
          <select
            value={rightSlug}
            onChange={(event) => setRightSlug(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm normal-case tracking-normal text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          >
            {candidates.map((recipe) => (
              <option key={`right-${recipe.id}`} value={recipe.slug}>
                {recipe.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="space-y-4 rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
          <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--foreground)]">{leftRecipe.title}</p>
          <MetricRow label="Rating" value={leftScore.rating} max={70} />
          <MetricRow label="Stage" value={leftScore.stage} max={15} />
          <MetricRow label="Difficulty" value={leftScore.difficulty} max={5} />
          <MetricRow label="Speed" value={leftScore.speed} max={10} />
          <p className="pt-1 text-sm uppercase tracking-[0.18em] text-[var(--accent)]">Total {leftScore.total.toFixed(1)}</p>
        </article>

        <article className="space-y-4 rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
          <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--foreground)]">{rightRecipe.title}</p>
          <MetricRow label="Rating" value={rightScore.rating} max={70} />
          <MetricRow label="Stage" value={rightScore.stage} max={15} />
          <MetricRow label="Difficulty" value={rightScore.difficulty} max={5} />
          <MetricRow label="Speed" value={rightScore.speed} max={10} />
          <p className="pt-1 text-sm uppercase tracking-[0.18em] text-[var(--accent)]">Total {rightScore.total.toFixed(1)}</p>
        </article>
      </div>

      <div className="mt-6 rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(244,179,106,0.18),rgba(239,127,68,0.08))] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Comparison result</p>
        <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">{winner.title} wins</p>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/88">
          {Math.abs(leftScore.total - rightScore.total) < 0.1
            ? "These recipes are effectively tied. Try a fresh cook and update ratings to break the tie."
            : `${winner.title} leads by ${Math.abs(leftScore.total - rightScore.total).toFixed(1)} points.`}
        </p>
        {onApplyResult ? (
          <button
            type="button"
            onClick={() => onApplyResult(winner.id, loser.id)}
            className="mt-4 rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--background)] transition hover:bg-[var(--accent-strong)]"
          >
            Use this result in board
          </button>
        ) : null}
      </div>
    </section>
  );
}
