import { randomUUID } from "crypto";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export type AppUser = {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  visibility: "followers" | "public" | "private";
};

export type DiscoverUser = {
  id: string;
  handle: string;
  displayName: string;
  visibility: AppUser["visibility"];
  isFollowing: boolean;
};

type UserRow = {
  id: string;
  email: string;
  handle: string;
  display_name: string;
  password_hash: string;
  visibility: string;
};

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    handle: row.handle,
    displayName: row.display_name,
    visibility: row.visibility as AppUser["visibility"],
  };
}

export function getUserById(userId: string): AppUser | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function getUserByHandle(handle: string): AppUser | null {
  const row = db.prepare("SELECT * FROM users WHERE handle = ?").get(handle.toLowerCase()) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function getUserByEmail(email: string): (AppUser & { passwordHash: string }) | null {
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as UserRow | undefined;
  if (!row) {
    return null;
  }

  return {
    ...mapUser(row),
    passwordHash: row.password_hash,
  };
}

function normalizeHandle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export function registerUser(input: { email: string; password: string; displayName: string; handle?: string }) {
  const email = input.email.toLowerCase().trim();
  const displayName = input.displayName.trim();

  if (!email || !displayName || !input.password) {
    throw new Error("Email, display name, and password are required.");
  }

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const base = normalizeHandle(input.handle || displayName || email.split("@")[0] || "cook");
  if (!base) {
    throw new Error("A valid handle is required.");
  }

  const userId = randomUUID();
  const passwordHash = hashPassword(input.password);

  let handle = base;
  let suffix = 2;
  while (db.prepare("SELECT 1 FROM users WHERE handle = ?").get(handle)) {
    handle = `${base}${suffix}`;
    suffix += 1;
  }

  db.prepare(
    `INSERT INTO users (id, email, handle, display_name, password_hash, visibility)
     VALUES (@id, @email, @handle, @displayName, @passwordHash, 'followers')`
  ).run({
    id: userId,
    email,
    handle,
    displayName,
    passwordHash,
  });

  return getUserById(userId);
}

export function verifyUserCredentials(email: string, password: string): AppUser | null {
  const user = getUserByEmail(email);
  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    handle: user.handle,
    displayName: user.displayName,
    visibility: user.visibility,
  };
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function searchUsersForDiscovery(input: {
  viewerUserId: string;
  query?: string;
  limit?: number;
}): DiscoverUser[] {
  const normalizedQuery = input.query?.trim().toLowerCase() ?? "";
  const limit = Math.max(1, Math.min(input.limit ?? 12, 30));
  const pattern = `%${escapeLike(normalizedQuery)}%`;

  const rows = db
    .prepare(
      `SELECT
        u.id,
        u.handle,
        u.display_name,
        u.visibility,
        CASE WHEN f.followed_user_id IS NULL THEN 0 ELSE 1 END AS is_following
      FROM users u
      LEFT JOIN follows f
        ON f.follower_user_id = @viewerUserId
       AND f.followed_user_id = u.id
      WHERE u.id <> @viewerUserId
        AND (
          @query = ''
          OR u.handle LIKE @pattern ESCAPE '\\'
          OR u.display_name LIKE @pattern ESCAPE '\\'
        )
      ORDER BY is_following DESC, u.handle ASC
      LIMIT @limit`
    )
    .all({
      viewerUserId: input.viewerUserId,
      query: normalizedQuery,
      pattern,
      limit,
    }) as Array<{
    id: string;
    handle: string;
    display_name: string;
    visibility: string;
    is_following: number;
  }>;

  return rows.map((row) => ({
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    visibility: row.visibility as AppUser["visibility"],
    isFollowing: row.is_following === 1,
  }));
}
