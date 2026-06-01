import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

import { getAuthSession } from "@/lib/auth";
import { getCollection, getCollectionRecipes } from "@/lib/collections";
import { getAllRecipes } from "@/lib/recipes";
import { BackLink } from "@/components/back-link";
import { RecipeCard } from "@/components/recipe-card";

type CollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    const { id } = await params;
    redirect(`/login?callbackUrl=/collections/${id}` as Route);
  }

  const { id } = await params;
  const collection = getCollection(userId, id);

  if (!collection) {
    notFound();
  }

  const recipeRefs = getCollectionRecipes(userId, id);
  const allRecipes = getAllRecipes(userId);
  const recipes = allRecipes.filter((r) => recipeRefs.some((ref) => ref.id === r.id));


  return (
    <main className="space-y-8">
      <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <BackLink fallbackHref="/collections" fallbackLabel="Back to collections" />

        <div className="mt-6 space-y-5">
          <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Collection</p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[0.92] text-[var(--foreground)] sm:text-6xl">
            {collection.name}
          </h1>
        </div>

        {collection.description && (
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            {collection.description}
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.75rem] bg-black/16 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Recipes</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {recipes.length}
            </p>
          </div>
          {collection.isPublic && (
            <div className="rounded-[1.75rem] bg-black/16 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Visibility</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Public</p>
            </div>
          )}
        </div>
      </section>

      {recipes.length === 0 ? (
        <section className="rounded-[2.4rem] border border-white/10 bg-black/16 p-6 sm:p-8">
          <p className="text-center text-sm text-[var(--muted)]">
            No recipes in this collection yet.{" "}
            <Link
              href="/discover"
              className="text-[var(--accent)] transition hover:text-[var(--foreground)]"
            >
              Browse and add recipes
            </Link>
            .
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Recipes</p>
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
