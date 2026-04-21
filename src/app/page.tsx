"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RankingList } from "@/components/ranking-list";
import type { Recipe, TrendingRecipe } from "@/lib/recipes";

export default function Home() {
  const [boardRecipes, setBoardRecipes] = useState<Recipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<TrendingRecipe[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [discoveryCount, setDiscoveryCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    fetch("/api/recipes/ranked")
      .then(async (res) => {
        if (res.status === 401) {
          setAuthRequired(true);
          setLoaded(true);
          return null;
        }

        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setBoardRecipes(data.ranked);
        setTotalCount(data.total);
        setDiscoveryCount(data.discovery);
        setLoaded(true);
      });

    fetch("/api/recipes/trending")
      .then((res) => res.json())
      .then((data) => {
        setTrendingRecipes(data.trending ?? []);
      })
      .catch(() => {
        setTrendingRecipes([]);
      });
  }, []);

  return (
    <main className="space-y-8">
      <section className="animate-float-in overflow-hidden rounded-[2.75rem] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-6 py-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] sm:px-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <h1 className="max-w-4xl font-[family-name:var(--font-display)] text-5xl leading-[0.92] text-[var(--foreground)] sm:text-6xl">
              Welcome!!!
            </h1>
            <p className="max-w-xl text-base leading-7 text-[var(--muted)]">
              Save recipes, cook them, rate them, and let the board surface what actually deserves a spot.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/submit"
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--background)] transition hover:bg-[var(--foreground)]"
              >
                Submit a recipe
              </Link>
              <Link
                href="/discover"
                className="rounded-full border border-white/12 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Discover recipes
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Ranked</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">{boardRecipes.length}</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">To try</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">{discoveryCount}</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Total</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">{totalCount}</p>
            </div>
          </div>
        </div>
      </section>

      {!authRequired && loaded && (
        <section id="rankings" className="rounded-[2.4rem] border border-white/10 bg-black/16 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.26em] text-[var(--muted)]">Your board</p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-none text-[var(--foreground)] sm:text-5xl">
                Your top recipes
              </h2>
            </div>
            <Link
              href="/discover"
              className="text-sm uppercase tracking-[0.18em] text-[var(--muted)] transition hover:text-[var(--accent)]"
            >
              Compare &amp; discover &rarr;
            </Link>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Ranked by head-to-head comparisons. Cook a recipe and compare it against your board to find where it belongs.
          </p>
          <div className="mt-8">
            <RankingList recipes={boardRecipes} />
          </div>
        </section>
      )}

      <section className="rounded-[2.4rem] border border-white/10 bg-black/16 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-[var(--muted)]">Community picks</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-none text-[var(--foreground)] sm:text-5xl">
              Trending recipes
            </h2>
          </div>
          <Link
            href="/discover"
            className="text-sm uppercase tracking-[0.18em] text-[var(--muted)] transition hover:text-[var(--accent)]"
          >
            Browse all recipes &rarr;
          </Link>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Recipes with the most likes from the community, updated as people react.
        </p>
        {trendingRecipes.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--muted)]">
            No trending recipes yet. Be the first to like a recipe.
          </p>
        ) : (
          <ol className="mt-8 space-y-3">
            {trendingRecipes.map((recipe, index) => (
              <li
                key={recipe.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-[var(--muted)]">
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/recipes/${recipe.slug}`}
                      className="truncate text-sm font-semibold text-[var(--foreground)] transition hover:text-[var(--accent)]"
                    >
                      {recipe.title}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {recipe.cuisine} · {recipe.cookTime} min
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {recipe.likeCount} like{recipe.likeCount === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}