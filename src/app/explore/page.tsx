import Link from "next/link";
import type { Route } from "next";

import { RecipeCard } from "@/components/recipe-card";
import { getAuthSession } from "@/lib/auth";
import { getAllRecipes } from "@/lib/recipes";

export default async function ExplorePage() {
	const session = await getAuthSession();
	const userId = session?.user?.id;

	const recipes = getAllRecipes(userId);

	return (
		<main className="space-y-8">
			<section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
				<p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Explore recipes</p>
				<h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-[var(--foreground)] sm:text-6xl">
					Discover new recipes to try.
				</h1>
				<p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
					Browse through our collection of recipes and find your next favorite dish to cook.
				</p>

				<div className="mt-8">
					<div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
						<p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Total recipes</p>
						<p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">
							{recipes.length}
						</p>
					</div>
				</div>
			</section>

			{recipes.length > 0 ? (
				<section className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{recipes.map((recipe) => (
							<Link
								key={recipe.slug}
								href={`/recipes/${recipe.slug}` as Route}
								className="group transition-transform duration-200 hover:scale-105"
							>
								<RecipeCard recipe={recipe} />
							</Link>
						))}
					</div>
				</section>
			) : (
				<section className="rounded-[1.6rem] border border-white/10 bg-black/20 p-8 text-center">
					<p className="text-[var(--muted)]">No recipes available yet.</p>
				</section>
			)}
		</main>
	);
}
