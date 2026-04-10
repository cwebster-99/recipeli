import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

import { FollowButton } from "@/components/follow-button";
import { RecipeCard } from "@/components/recipe-card";
import { getAuthSession } from "@/lib/auth";
import { getAllRecipes, getDiscoveryQueue, getTopRankedRecipes } from "@/lib/recipes";
import { searchUsersForDiscovery } from "@/lib/users";

type DiscoverPageProps = {
	searchParams: Promise<{ q?: string }>;
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
	const session = await getAuthSession();
	const userId = session?.user?.id;

	if (!userId) {
		redirect("/login?callbackUrl=/discover" as Route);
	}

	const params = await searchParams;
	const query = params.q?.trim().slice(0, 40) ?? "";

	const recipes = getAllRecipes(userId);
	const discoveryQueue = getDiscoveryQueue(userId);
	const topRankedRecipes = getTopRankedRecipes(userId);
	const friendResults = searchUsersForDiscovery({
		viewerUserId: userId,
		query,
		limit: query ? 18 : 8,
	});

	return (
		<main className="space-y-8">
			<section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
				<p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Discover recipes</p>
				<h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-[var(--foreground)] sm:text-6xl">
					Browse everything worth cooking next.
				</h1>
				<p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
					Scan every recipe, compare head-to-head, and decide what to cook next versus what has already earned a spot on the board.
				</p>

				<div className="mt-8 grid gap-4 sm:grid-cols-3">
					<div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
						<p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Total recipes</p>
						<p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">{recipes.length}</p>
					</div>
					<div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
						<p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">On the board</p>
						<p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">{topRankedRecipes.length}</p>
					</div>
					<div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
						<p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Still discovering</p>
						<p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">{discoveryQueue.length}</p>
					</div>
				</div>
			</section>

			<section className="rounded-[2.3rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">Find friends</p>
						<h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">
							Discover cooks you know.
						</h2>
						<p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
							Search by handle or display name, then follow to keep up with their rankings.
						</p>
					</div>
					<form action="/discover" method="get" className="w-full max-w-md">
						<label htmlFor="friend-search" className="sr-only">
							Find friends
						</label>
						<div className="flex gap-2 rounded-2xl border border-white/12 bg-black/20 p-2">
							<input
								id="friend-search"
								name="q"
								type="search"
								defaultValue={query}
								placeholder="Search @handle or name"
								className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
							/>
							<button
								type="submit"
								className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] transition hover:border-[var(--accent)]"
							>
								Search
							</button>
						</div>
					</form>
				</div>

				<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{friendResults.map((user) => (
						<div
							key={user.id}
							className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<Link
										href={`/u/${user.handle}` as Route}
										className="font-[family-name:var(--font-display)] text-2xl leading-none text-[var(--foreground)] transition hover:text-[var(--accent)]"
									>
										@{user.handle}
									</Link>
									<p className="mt-2 text-sm text-[var(--muted)]">{user.displayName}</p>
								</div>
								<FollowButton handle={user.handle} initiallyFollowing={user.isFollowing} />
							</div>
							<p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
								{user.visibility === "public"
									? "Public profile"
									: user.visibility === "private"
										? "Private profile"
										: "Followers-only profile"}
							</p>
						</div>
					))}
				</div>

				{friendResults.length === 0 ? (
					<p className="mt-6 rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-5 text-sm text-[var(--muted)]">
						No matching cooks found. Try another handle or name.
					</p>
				) : null}
			</section>

			<section className="space-y-4">
				<p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Recipe catalog</p>
				<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
					{recipes.map((recipe) => (
						<RecipeCard key={recipe.id} recipe={recipe} />
					))}
				</div>
			</section>
		</main>
	);
}