import { randomUUID } from "crypto";

import { db } from "@/lib/db";

export type Collection = {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  recipeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CollectionWithRecipes = Collection & {
  recipes: Array<{ id: string; title: string; slug: string }>;
};

type CollectionRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_public: number;
  created_at: string;
  updated_at: string;
  recipe_count?: number;
};

type CollectionRecipeRow = { id: string; title: string; slug: string };

function mapCollectionRow(row: CollectionRow): Collection {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public === 1,
    recipeCount: row.recipe_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createCollection(
  userId: string,
  input: { name: string; description?: string; isPublic?: boolean }
): Collection {
  const name = input.name.trim();

  if (!name || name.length > 50) {
    throw new Error("Collection name must be 1-50 characters.");
  }

  // Check if collection with same name already exists for this user
  const existing = db
    .prepare("SELECT 1 FROM collections WHERE user_id = ? AND name = ?")
    .get(userId, name);

  if (existing) {
    throw new Error("You already have a collection with this name.");
  }

  const id = randomUUID();
  const description = input.description?.trim() || "";
  const isPublic = input.isPublic ? 1 : 0;

  db.prepare(
    `INSERT INTO collections (id, user_id, name, description, is_public)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, name, description, isPublic);

  return getCollection(userId, id)!;
}

export function getCollection(userId: string, collectionId: string): Collection | null {
  const row = db
    .prepare(
      `SELECT
        c.id,
        c.user_id,
        c.name,
        c.description,
        c.is_public,
        c.created_at,
        c.updated_at,
        COUNT(cr.recipe_id) AS recipe_count
      FROM collections c
      LEFT JOIN collection_recipes cr ON cr.collection_id = c.id
      WHERE c.id = ? AND c.user_id = ?
      GROUP BY c.id`
    )
    .get(collectionId, userId) as CollectionRow | undefined;

  return row ? mapCollectionRow(row) : null;
}

export function getCollectionsByUser(userId: string): Collection[] {
  const rows = db
    .prepare(
      `SELECT
        c.id,
        c.user_id,
        c.name,
        c.description,
        c.is_public,
        c.created_at,
        c.updated_at,
        COUNT(cr.recipe_id) AS recipe_count
      FROM collections c
      LEFT JOIN collection_recipes cr ON cr.collection_id = c.id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.updated_at DESC`
    )
    .all(userId) as CollectionRow[];

  return rows.map(mapCollectionRow);
}

export function getPublicCollectionsByUser(userId: string): Collection[] {
  const rows = db
    .prepare(
      `SELECT
        c.id,
        c.user_id,
        c.name,
        c.description,
        c.is_public,
        c.created_at,
        c.updated_at,
        COUNT(cr.recipe_id) AS recipe_count
      FROM collections c
      LEFT JOIN collection_recipes cr ON cr.collection_id = c.id
      WHERE c.user_id = ? AND c.is_public = 1
      GROUP BY c.id
      ORDER BY c.updated_at DESC`
    )
    .all(userId) as CollectionRow[];

  return rows.map(mapCollectionRow);
}

export function updateCollection(
  userId: string,
  collectionId: string,
  input: { name?: string; description?: string; isPublic?: boolean }
): Collection {
  const collection = getCollection(userId, collectionId);

  if (!collection) {
    throw new Error("Collection not found.");
  }

  const name = input.name?.trim() ?? collection.name;
  const description = input.description?.trim() ?? collection.description;
  const isPublic = input.isPublic !== undefined ? (input.isPublic ? 1 : 0) : (collection.isPublic ? 1 : 0);

  // Check for name conflict if name changed
  if (name !== collection.name) {
    const existing = db
      .prepare("SELECT 1 FROM collections WHERE user_id = ? AND name = ?")
      .get(userId, name);

    if (existing) {
      throw new Error("You already have a collection with this name.");
    }
  }

  db.prepare(
    `UPDATE collections
     SET name = ?, description = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`
  ).run(name, description, isPublic, collectionId, userId);

  return getCollection(userId, collectionId)!;
}

export function deleteCollection(userId: string, collectionId: string): void {
  const result = db
    .prepare("DELETE FROM collections WHERE id = ? AND user_id = ?")
    .run(collectionId, userId);

  if (!result.changes) {
    throw new Error("Collection not found.");
  }
}

export function addRecipeToCollection(
  userId: string,
  collectionId: string,
  recipeId: string
): void {
  // Verify collection belongs to user
  const collection = getCollection(userId, collectionId);
  if (!collection) {
    throw new Error("Collection not found.");
  }

  // Verify recipe exists
  const recipe = db.prepare("SELECT 1 FROM recipes WHERE id = ?").get(recipeId);
  if (!recipe) {
    throw new Error("Recipe not found.");
  }

  db.prepare(
    `INSERT OR IGNORE INTO collection_recipes (collection_id, recipe_id)
     VALUES (?, ?)`
  ).run(collectionId, recipeId);

  // Update collection updated_at
  db.prepare("UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
    collectionId
  );
}

export function removeRecipeFromCollection(
  userId: string,
  collectionId: string,
  recipeId: string
): void {
  // Verify collection belongs to user
  const collection = getCollection(userId, collectionId);
  if (!collection) {
    throw new Error("Collection not found.");
  }

  db.prepare("DELETE FROM collection_recipes WHERE collection_id = ? AND recipe_id = ?").run(
    collectionId,
    recipeId
  );

  // Update collection updated_at
  db.prepare("UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
    collectionId
  );
}

export function getCollectionRecipes(
  userId: string,
  collectionId: string
): Array<{ id: string; title: string; slug: string }> {
  // Verify collection belongs to user
  const collection = getCollection(userId, collectionId);
  if (!collection) {
    throw new Error("Collection not found.");
  }

  return db
    .prepare(
      `SELECT r.id, r.title, r.slug
       FROM collection_recipes cr
       JOIN recipes r ON r.id = cr.recipe_id
       WHERE cr.collection_id = ?
       ORDER BY cr.added_at DESC`
    )
    .all(collectionId) as CollectionRecipeRow[];
}

export function getRecipeCollections(userId: string, recipeId: string): Collection[] {
  const rows = db
    .prepare(
      `SELECT
        c.id,
        c.user_id,
        c.name,
        c.description,
        c.is_public,
        c.created_at,
        c.updated_at,
        COUNT(cr.recipe_id) AS recipe_count
      FROM collections c
      LEFT JOIN collection_recipes cr ON cr.collection_id = c.id
      WHERE c.user_id = ? AND c.id IN (
        SELECT collection_id FROM collection_recipes WHERE recipe_id = ?
      )
      GROUP BY c.id
      ORDER BY c.name ASC`
    )
    .all(userId, recipeId) as CollectionRow[];
  return rows.map(mapCollectionRow);
}

export function isRecipeInCollection(collectionId: string, recipeId: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM collection_recipes WHERE collection_id = ? AND recipe_id = ?")
    .get(collectionId, recipeId);

  return Boolean(row);
}
