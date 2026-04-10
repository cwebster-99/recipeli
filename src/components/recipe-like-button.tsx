"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

type RecipeLikeButtonProps = {
  recipeId: string;
  initialLiked: boolean;
  initialLikeCount: number;
};

export function RecipeLikeButton({
  recipeId,
  initialLiked,
  initialLikeCount,
}: RecipeLikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialLikeCount);
  const [saving, setSaving] = useState(false);

  const onClick = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/social/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipeId, like: !liked }),
      });

      if (response.status === 401) {
        router.push("/login" as Route);
        return;
      }

      const payload = (await response.json()) as { likeCount: number; likedByUser: boolean };
      if (response.ok) {
        setLiked(payload.likedByUser);
        setCount(payload.likeCount);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      disabled={saving}
      onClick={onClick}
      className="w-full rounded-full border border-white/12 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? "Saving..." : liked ? `Liked (${count})` : `Like (${count})`}
    </button>
  );
}
