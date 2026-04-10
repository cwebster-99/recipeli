"use client";

import { useState } from "react";

type FollowButtonProps = {
  handle: string;
  initiallyFollowing: boolean;
  disabled?: boolean;
};

export function FollowButton({ handle, initiallyFollowing, disabled }: FollowButtonProps) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle, follow: !following }),
      });

      if (response.ok) {
        setFollowing(!following);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || saving}
      onClick={toggle}
      className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? "Saving..." : following ? "Following" : "Follow"}
    </button>
  );
}
