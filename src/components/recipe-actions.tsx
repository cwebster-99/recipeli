"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { RankFlow } from "@/components/rank-flow";

type RankedRecipeInfo = {
  id: string;
  title: string;
  cuisine: string;
};

type RecipeActionsProps = {
  recipeId: string;
  recipeTitle: string;
  recipeStage: string;
  rankedRecipes: RankedRecipeInfo[];
};

export function RecipeActions({
  recipeId,
  recipeTitle,
  recipeStage,
  rankedRecipes,
}: RecipeActionsProps) {
  const [showRankFlow, setShowRankFlow] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const canRank = recipeStage === "saved" || recipeStage === "cooked";

  if (!canRank) return null;

  const startRanking = async () => {
    if (rankedRecipes.length === 0) {
      setSaving(true);
      const response = await fetch("/api/recipes/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, position: 0 }),
      });

      if (response.status === 401) {
        setSaving(false);
        router.push("/login" as Route);
        return;
      }

      setSaving(false);
      router.push("/#rankings");
      router.refresh();
      return;
    }

    setShowRankFlow(true);
  };

  return (
    <>
      <button
        type="button"
        disabled={saving}
        onClick={startRanking}
        className="w-full rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--background)] transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
      >
        {saving
          ? "Ranking…"
          : recipeStage === "saved"
            ? "I cooked this!"
            : "Rank this recipe"}
      </button>

      {showRankFlow && (
        <RankFlow
          recipeId={recipeId}
          recipeTitle={recipeTitle}
          rankedRecipes={rankedRecipes}
          onComplete={() => {
            setShowRankFlow(false);
            router.push("/#rankings");
            router.refresh();
          }}
          onCancel={() => setShowRankFlow(false)}
        />
      )}
    </>
  );
}
