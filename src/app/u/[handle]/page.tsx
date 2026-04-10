import { notFound, redirect } from "next/navigation";
import type { Route } from "next";

import { FollowButton } from "@/components/follow-button";
import { RankingList } from "@/components/ranking-list";
import { getAuthSession } from "@/lib/auth";
import { getRankedRecipes } from "@/lib/recipes";
import { canViewProfile, getFollowerCount, getFollowingCount, isFollowing } from "@/lib/social";
import { getUserByHandle } from "@/lib/users";

type UserProfilePageProps = {
  params: Promise<{ handle: string }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { handle } = await params;
  const profile = getUserByHandle(handle.toLowerCase());

  if (!profile) {
    notFound();
  }

  const session = await getAuthSession();
  const viewerId = session?.user?.id;
  const canView = canViewProfile({
    ownerId: profile.id,
    ownerVisibility: profile.visibility,
    viewerId,
  });

  if (!canView) {
    if (!viewerId) {
      redirect(`/login?callbackUrl=/u/${profile.handle}` as Route);
    }

    return (
      <main className="space-y-6">
        <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">Private board</p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-[var(--foreground)] sm:text-6xl">
            @{profile.handle}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            This board is followers-only. Follow to view rankings.
          </p>
          {viewerId ? (
            <div className="mt-6">
              <FollowButton handle={profile.handle} initiallyFollowing={false} />
            </div>
          ) : null}
        </section>
      </main>
    );
  }

  const ranked = getRankedRecipes(profile.id);
  const followerCount = getFollowerCount(profile.id);
  const followingCount = getFollowingCount(profile.id);
  const isOwner = viewerId === profile.id;
  const following = viewerId && !isOwner ? isFollowing(viewerId, profile.id) : false;

  return (
    <main className="space-y-8">
      <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">Profile</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-[var(--foreground)] sm:text-6xl">
              @{profile.handle}
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{profile.displayName}</p>
          </div>
          {!isOwner ? (
            <FollowButton handle={profile.handle} initiallyFollowing={Boolean(following)} />
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Followers</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">{followerCount}</p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Following</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">{followingCount}</p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Ranked</p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--foreground)]">{ranked.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2.4rem] border border-white/10 bg-black/16 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Ranking board</p>
        <div className="mt-6">
          <RankingList recipes={ranked} />
        </div>
      </section>
    </main>
  );
}
