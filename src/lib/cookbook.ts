import { db } from "@/lib/db";
import type { Recipe } from "@/lib/recipes";

type CookbookRecipeRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  cuisine: string;
  cook_time: number;
  difficulty: string;
  author: string;
  stage: string;
  personal_rating: number;
  note: string;
  tags: string;
  ingredients: string;
  instructions: string;
  source_url: string | null;
  image_url: string | null;
  added_at: string;
};

export type CookbookEntry = Recipe & {
  addedAt: string;
};

function mapCookbookRow(row: CookbookRecipeRow): CookbookEntry {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    cuisine: row.cuisine,
    cookTime: row.cook_time,
    difficulty: row.difficulty as Recipe["difficulty"],
    author: row.author,
    stage: row.stage as Recipe["stage"],
    personalRating: row.personal_rating,
    note: row.note,
    tags: JSON.parse(row.tags) as string[],
    ingredients: JSON.parse(row.ingredients) as string[],
    instructions: JSON.parse(row.instructions) as string[],
    sourceUrl: row.source_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    addedAt: row.added_at,
  };
}

export function addRecipeToCookbook(userId: string, recipeId: string): void {
  const recipe = db.prepare("SELECT 1 FROM recipes WHERE id = ?").get(recipeId);
  if (!recipe) {
    throw new Error("Recipe not found.");
  }

  db.prepare(
    `INSERT OR IGNORE INTO cookbook_entries (user_id, recipe_id) VALUES (?, ?)`
  ).run(userId, recipeId);
}

export function removeRecipeFromCookbook(userId: string, recipeId: string): void {
  db.prepare(
    `DELETE FROM cookbook_entries WHERE user_id = ? AND recipe_id = ?`
  ).run(userId, recipeId);
}

export function isRecipeInCookbook(userId: string, recipeId: string): boolean {
  const row = db
    .prepare(`SELECT 1 FROM cookbook_entries WHERE user_id = ? AND recipe_id = ?`)
    .get(userId, recipeId);

  return Boolean(row);
}

export function getCookbookRecipes(userId: string): CookbookEntry[] {
  const rows = db
    .prepare(
      `
        SELECT
          r.id,
          r.slug,
          r.title,
          r.summary,
          r.cuisine,
          r.cook_time,
          r.difficulty,
          r.author,
          COALESCE(urs.stage, 'saved') AS stage,
          COALESCE(urs.personal_rating, 0) AS personal_rating,
          COALESCE(urs.note, '') AS note,
          r.tags,
          r.ingredients,
          r.instructions,
          r.source_url,
          r.image_url,
          ce.added_at
        FROM cookbook_entries ce
        JOIN recipes r ON r.id = ce.recipe_id
        LEFT JOIN user_recipe_state urs
          ON urs.recipe_id = r.id AND urs.user_id = ce.user_id
        WHERE ce.user_id = ?
        ORDER BY ce.added_at DESC
      `
    )
    .all(userId) as CookbookRecipeRow[];

  return rows.map(mapCookbookRow);
}

export function getCookbookCount(userId: string): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM cookbook_entries WHERE user_id = ?`)
    .get(userId) as { n: number };

  return row.n;
}
