import type { Recipe } from "@/lib/recipes";

type RankingListProps = {
  recipes: Recipe[];
};

export function RankingList({ recipes }: RankingListProps) {
  return (
    <ol className="space-y-4">
      {recipes.map((recipe, index) => (
        <li
          key={recipe.id}
          className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(251,216,176,0.12),rgba(255,255,255,0.04))] p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-semibold text-[var(--background)]">
            #{index + 1}
          </div>

          <div className="space-y-1">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">{recipe.title}</p>
            <p className="text-sm text-[var(--muted)]">{recipe.note}</p>
          </div>

          <div className="text-sm uppercase tracking-[0.18em] text-[var(--foreground)]/80 sm:text-right">
            <p>{recipe.cuisine}</p>
            <p className="mt-2 text-[var(--muted)]">{recipe.cookTime} min · {recipe.difficulty}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}