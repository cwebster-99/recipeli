import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

import { RecipeCard } from "@/components/recipe-card";
import { getAuthSession } from "@/lib/auth";
import { getCookbookRecipes } from "@/lib/cookbook";

export default async function CookbookPage() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=/cookbook" as Route);
  }

  const recipes = getCookbookRecipes(userId);
  const rankedCount = recipes.filter((r) => r.stage === "ranked").length;
  const cookedCount = recipes.filter((r) => r.stage === "cooked").length;

  return (
    <main className="space-y-8">
      <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Your cookbook</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-[var(--foreground)] sm:text-6xl">
          Recipes you saved to make.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          Your personal library of recipes worth keeping. Save anything that catches your eye and
          keep it within reach the next time you decide what to cook.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Saved recipes</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">
              {recipes.length}
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Already cooked</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">
              {cookedCount}
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Ranked</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">
              {rankedCount}
            </p>
          </div>
        </div>
      </section>

      {recipes.length === 0 ? (
        <section className="rounded-[2.4rem] border border-white/10 bg-black/16 p-6 sm:p-8">
          <p className="text-center text-sm text-[var(--muted)]">
            Your cookbook is empty.{" "}
            <Link
              href={"/discover" as Route}
              className="text-[var(--accent)] transition hover:text-[var(--foreground)]"
            >
              Discover recipes
            </Link>{" "}
            and tap &ldquo;Save to cookbook&rdquo; to start building your library.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">In your cookbook</p>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
