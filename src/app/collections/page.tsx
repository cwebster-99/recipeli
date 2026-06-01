import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

import { getAuthSession } from "@/lib/auth";
import { getCollectionsByUser } from "@/lib/collections";
import { CollectionsList } from "@/components/collections-list";

export default async function CollectionsPage() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=/collections" as Route);
  }

  const collections = getCollectionsByUser(userId);

  return (
    <main className="space-y-8">
      <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Your collections</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-[var(--foreground)] sm:text-6xl">
          Organize your recipes.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          Group recipes into collections like Weeknight, Date Night, or Meal Prep to keep your
          favorites organized and easy to find.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Collections</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">
              {collections.length}
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Total recipes</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">
              {collections.reduce((sum, c) => sum + c.recipeCount, 0)}
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Public</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">
              {collections.filter((c) => c.isPublic).length}
            </p>
          </div>
        </div>
      </section>

      {collections.length === 0 ? (
        <section className="rounded-[2.4rem] border border-white/10 bg-black/16 p-6 sm:p-8">
          <p className="text-center text-sm text-[var(--muted)]">
            No collections yet.{" "}
            <Link href="/discover" className="text-[var(--accent)] transition hover:text-[var(--foreground)]">
              Browse recipes
            </Link>{" "}
            and start grouping them into collections.
          </p>
        </section>
      ) : (
        <section className="rounded-[2.4rem] border border-white/10 bg-black/16 p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Your collections</p>
          <div className="mt-6">
            <CollectionsList collections={collections} isOwn={true} />
          </div>
        </section>
      )}
    </main>
  );
}
