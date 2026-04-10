import { notFound, redirect } from "next/navigation";
import type { Route } from "next";

import { BackLink } from "@/components/back-link";
import { RecipeActions } from "@/components/recipe-actions";
import { RecipeLikeButton } from "@/components/recipe-like-button";
import { getAuthSession } from "@/lib/auth";
import { getAllRecipes, getRecipeBySlug, getRankedRecipes } from "@/lib/recipes";
import { getRecipeLikeSummary } from "@/lib/social";

type RecipePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllRecipes().map((recipe) => ({ slug: recipe.slug }));
}

export const dynamicParams = true;

export default async function RecipePage({ params }: RecipePageProps) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    const incoming = await params;
    redirect(`/login?callbackUrl=/recipes/${incoming.slug}` as Route);
  }

  const { slug } = await params;
  const recipe = getRecipeBySlug(slug, userId);

  if (!recipe) {
    notFound();
  }

  const rankedRecipes = getRankedRecipes(userId);
  const rankingIndex = rankedRecipes.findIndex((boardRecipe) => boardRecipe.id === recipe.id);
  const rankingLabel = rankingIndex >= 0 ? `#${rankingIndex + 1}` : "Not ranked";
  const rankedForComparison = rankedRecipes
    .filter((r) => r.id !== recipe.id)
    .map((r) => ({ id: r.id, title: r.title, cuisine: r.cuisine }));
  const likeSummary = getRecipeLikeSummary(recipe.id, userId);

  return (
    <main className="grid gap-8 lg:grid-cols-[0.75fr_0.25fr]">
      <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <BackLink fallbackHref="/discover" fallbackLabel="Back to discovery" />

        {recipe.imageUrl ? (
          <div className="mt-6 overflow-hidden rounded-[1.75rem]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="h-64 w-full object-cover sm:h-80"
            />
          </div>
        ) : null}

        <div className="mt-6 space-y-5">
          <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">{recipe.cuisine}</p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[0.92] text-[var(--foreground)] sm:text-6xl">
            {recipe.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">{recipe.summary}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.75rem] bg-black/16 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Cook time</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{recipe.cookTime} min</p>
          </div>
          <div className="rounded-[1.75rem] bg-black/16 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Difficulty</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{recipe.difficulty}</p>
          </div>
          <div className="rounded-[1.75rem] bg-black/16 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Recipe state</p>
            <p className="mt-3 text-2xl font-semibold capitalize text-[var(--foreground)]">{recipe.stage}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <p className="text-sm uppercase tracking-[0.26em] text-[var(--muted)]">Ingredients</p>
            <ul className="mt-5 space-y-3">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--foreground)]">
                  {ingredient}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-sm uppercase tracking-[0.26em] text-[var(--muted)]">Method</p>
            <ol className="mt-5 space-y-4">
              {recipe.instructions.map((step, index) => (
                <li key={step} className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] font-semibold text-[var(--background)]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[var(--foreground)]/92">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>

      <aside className="space-y-5 rounded-[2.5rem] border border-white/10 bg-black/16 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Submitted by</p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--foreground)]">{recipe.author}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Personal note</p>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground)]/88">{recipe.note}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Tags</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--foreground)]/78">
                {tag}
              </li>
            ))}
          </ul>
        </div>

        {recipe.sourceUrl ? (
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Source URL</p>
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm leading-6 text-[var(--foreground)]/88 underline decoration-white/25 underline-offset-4 transition hover:decoration-[var(--accent)]"
            >
              Open original recipe
            </a>
          </div>
        ) : null}

        <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(244,179,106,0.18),rgba(239,127,68,0.08))] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Ranking status</p>
          <p className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">
            {rankingLabel}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--foreground)]/88">
            {rankingIndex >= 0
              ? "Ranked through head-to-head comparisons against your board."
              : "Cook this recipe, then compare it against your favorites to find where it belongs."}
          </p>
        </div>

        <RecipeActions
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          recipeStage={recipe.stage}
          rankedRecipes={rankedForComparison}
        />
        <RecipeLikeButton
          recipeId={recipe.id}
          initialLiked={likeSummary.likedByUser}
          initialLikeCount={likeSummary.likeCount}
        />
      </aside>
    </main>
  );
}