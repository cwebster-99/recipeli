import { db } from "@/lib/db";

export function isFollowing(followerUserId: string, followedUserId: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM follows WHERE follower_user_id = ? AND followed_user_id = ?")
    .get(followerUserId, followedUserId);
  return Boolean(row);
}

export function followUser(followerUserId: string, followedUserId: string) {
  if (followerUserId === followedUserId) {
    throw new Error("You cannot follow yourself.");
  }

  db.prepare(
    "INSERT OR IGNORE INTO follows (follower_user_id, followed_user_id) VALUES (?, ?)"
  ).run(followerUserId, followedUserId);
}

export function unfollowUser(followerUserId: string, followedUserId: string) {
  db.prepare("DELETE FROM follows WHERE follower_user_id = ? AND followed_user_id = ?").run(
    followerUserId,
    followedUserId
  );
}

export function toggleRecipeLike(userId: string, recipeId: string, shouldLike: boolean) {
  if (shouldLike) {
    db.prepare(
      "INSERT OR IGNORE INTO recipe_reactions (user_id, recipe_id, reaction) VALUES (?, ?, 'like')"
    ).run(userId, recipeId);
    return;
  }

  db.prepare(
    "DELETE FROM recipe_reactions WHERE user_id = ? AND recipe_id = ? AND reaction = 'like'"
  ).run(userId, recipeId);
}

export function getRecipeLikeSummary(recipeId: string, userId?: string) {
  const row = db
    .prepare("SELECT COUNT(*) AS like_count FROM recipe_reactions WHERE recipe_id = ? AND reaction = 'like'")
    .get(recipeId) as { like_count: number };

  const likedByUser = userId
    ? Boolean(
        db
          .prepare(
            "SELECT 1 FROM recipe_reactions WHERE user_id = ? AND recipe_id = ? AND reaction = 'like'"
          )
          .get(userId, recipeId)
      )
    : false;

  return {
    likeCount: row.like_count,
    likedByUser,
  };
}

export function getFollowerCount(userId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM follows WHERE followed_user_id = ?")
    .get(userId) as { c: number };
  return row.c;
}

export function getFollowingCount(userId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM follows WHERE follower_user_id = ?")
    .get(userId) as { c: number };
  return row.c;
}

export function canViewProfile(input: {
  ownerId: string;
  ownerVisibility: "followers" | "public" | "private";
  viewerId?: string;
}) {
  if (input.viewerId && input.viewerId === input.ownerId) {
    return true;
  }

  if (input.ownerVisibility === "public") {
    return true;
  }

  if (input.ownerVisibility === "private") {
    return false;
  }

  if (!input.viewerId) {
    return false;
  }

  return isFollowing(input.viewerId, input.ownerId);
}
