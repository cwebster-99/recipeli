import Link from "next/link";

import type { Recipe } from "@/lib/recipes";

type RecipeCardProps = {
  recipe: Recipe;
};

const stageLabel: Record<Recipe["stage"], string> = {
  saved: "Saved",
  cooked: "Cooked",
  ranked: "Ranked"
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_30px_80px_rgba(9,10,15,0.2)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/60 hover:bg-white/10">
      {recipe.imageUrl ? (
        <div className="-mx-6 -mt-6 mb-5 overflow-hidden rounded-t-[2rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="h-44 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mb-5 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
        <span>{recipe.cuisine}</span>
        <span>{stageLabel[recipe.stage]}</span>
      </div>

      <div className="space-y-3">
        <h3 className="font-[family-name:var(--font-display)] text-3xl leading-none text-[var(--foreground)]">
          {recipe.title}
        </h3>
        <p className="text-sm leading-6 text-[var(--muted)]">{recipe.summary}</p>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-sm text-[var(--foreground)]">
        <div className="rounded-2xl bg-black/15 p-3">
          <dt className="text-[0.65rem] uppercase tracking-[0.22em] text-[var(--muted)]">Cook</dt>
          <dd className="mt-2 text-base font-medium">{recipe.cookTime} min</dd>
        </div>
        <div className="rounded-2xl bg-black/15 p-3">
          <dt className="text-[0.65rem] uppercase tracking-[0.22em] text-[var(--muted)]">Difficulty</dt>
          <dd className="mt-2 text-base font-medium">{recipe.difficulty}</dd>
        </div>
        <div className="rounded-2xl bg-black/15 p-3">
          <dt className="text-[0.65rem] uppercase tracking-[0.22em] text-[var(--muted)]">Rating</dt>
          <dd className="mt-2 text-base font-medium">
            {recipe.personalRating > 0 ? recipe.personalRating.toFixed(1) : "TBD"}
          </dd>
        </div>
      </dl>

      <ul className="mt-6 flex flex-wrap gap-2">
        {recipe.tags.map((tag) => (
          <li key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--foreground)]/78">
            {tag}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <Link
          href={`/recipes/${recipe.slug}`}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:bg-[var(--accent-strong)]"
        >
          Open recipe
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}