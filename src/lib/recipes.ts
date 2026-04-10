import { db } from "@/lib/db";

export type RecipeStage = "saved" | "cooked" | "ranked";

export type Recipe = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  cuisine: string;
  cookTime: number;
  difficulty: "Easy" | "Intermediate" | "Project";
  author: string;
  stage: RecipeStage;
  personalRating: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  note: string;
  sourceUrl?: string;
  imageUrl?: string;
};

export type TrendingRecipe = Recipe & {
  likeCount: number;
};

export type NewRecipeInput = {
  title: string;
  summary?: string;
  cuisine?: string;
  cookTime?: number;
  ingredients?: string[];
  instructions?: string[];
  note?: string;
  sourceUrl?: string;
  imageUrl?: string;
  author?: string;
};

type RecipeWithStateRow = {
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
};

type TrendingRecipeRow = RecipeWithStateRow & {
  like_count: number;
};

const stageScoreWeight: Record<RecipeStage, number> = {
  saved: 0,
  cooked: 0.6,
  ranked: 1,
};

const difficultyScorePoints: Record<Recipe["difficulty"], number> = {
  Easy: 2,
  Intermediate: 3.5,
  Project: 5,
};

export type RecipeScoreBreakdown = {
  rating: number;
  stage: number;
  difficulty: number;
  speed: number;
  total: number;
};

function mapRow(row: RecipeWithStateRow): Recipe {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    cuisine: row.cuisine,
    cookTime: row.cook_time,
    difficulty: row.difficulty as Recipe["difficulty"],
    author: row.author,
    stage: row.stage as RecipeStage,
    personalRating: row.personal_rating,
    note: row.note,
    tags: JSON.parse(row.tags) as string[],
    ingredients: JSON.parse(row.ingredients) as string[],
    instructions: JSON.parse(row.instructions) as string[],
    sourceUrl: row.source_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

function mapTrendingRow(row: TrendingRecipeRow): TrendingRecipe {
  return {
    ...mapRow(row),
    likeCount: row.like_count,
  };
}

function withUserStateSelect(userId: string) {
  return `
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
      r.image_url
    FROM recipes r
    LEFT JOIN user_recipe_state urs
      ON urs.recipe_id = r.id
     AND urs.user_id = @userId
  `;
}

function withLegacyStateSelect() {
  return `
    SELECT
      r.id,
      r.slug,
      r.title,
      r.summary,
      r.cuisine,
      r.cook_time,
      r.difficulty,
      r.author,
      r.stage,
      r.personal_rating,
      r.note,
      r.tags,
      r.ingredients,
      r.instructions,
      r.source_url,
      r.image_url
    FROM recipes r
  `;
}

function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toUniqueSlug(value: string) {
  const baseSlug = slugify(value) || "recipe";
  let candidate = baseSlug;
  let suffix = 2;

  while (db.prepare("SELECT 1 FROM recipes WHERE slug = ?").get(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function normalizeList(values: string[] | undefined, fallback: string[]) {
  if (!values || values.length === 0) {
    return fallback;
  }

  const cleaned = values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);

  return cleaned.length > 0 ? cleaned : fallback;
}

function inferDifficulty(cookTime: number): Recipe["difficulty"] {
  if (cookTime <= 30) {
    return "Easy";
  }

  if (cookTime <= 55) {
    return "Intermediate";
  }

  return "Project";
}

function ensureUserRecipeState(userId: string, recipeId: string) {
  db.prepare(
    `INSERT OR IGNORE INTO user_recipe_state (user_id, recipe_id, stage, personal_rating, note)
     VALUES (?, ?, 'saved', 0, '')`
  ).run(userId, recipeId);
}

export function addRecipe(userId: string, input: NewRecipeInput): Recipe {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Recipe title is required.");
  }

  const slug = toUniqueSlug(title);
  const cookTime = Number.isFinite(input.cookTime)
    ? Math.max(5, Math.round(input.cookTime ?? 30))
    : 30;
  const summary =
    input.summary?.trim() ||
    "Imported recipe draft ready for your first cook and ranking.";
  const cuisine = input.cuisine?.trim() || "Imported";
  const note = input.note?.trim() || "Added from a recipe link and ready to refine.";
  const ingredients = normalizeList(input.ingredients, [
    "Review and finalize ingredient list",
  ]);
  const instructions = normalizeList(input.instructions, [
    "Review imported method steps and adjust as needed.",
  ]);
  const author = input.author?.trim() || "You";

  db.prepare(
    `INSERT INTO recipes (id, slug, title, summary, cuisine, cook_time, difficulty, author, stage, personal_rating, tags, ingredients, instructions, note, source_url, image_url)
     VALUES (@id, @slug, @title, @summary, @cuisine, @cookTime, @difficulty, @author, 'saved', 0, @tags, @ingredients, @instructions, '', @sourceUrl, @imageUrl)`
  ).run({
    id: slug,
    slug,
    title,
    summary,
    cuisine,
    cookTime,
    difficulty: inferDifficulty(cookTime),
    author,
    tags: JSON.stringify(["imported", "user-submitted"]),
    ingredients: JSON.stringify(ingredients),
    instructions: JSON.stringify(instructions),
    sourceUrl: input.sourceUrl?.trim() || null,
    imageUrl: input.imageUrl?.trim() || null,
  });

  db.prepare(
    `INSERT INTO user_recipe_state (user_id, recipe_id, stage, personal_rating, note)
     VALUES (?, ?, 'saved', 0, ?)`
  ).run(userId, slug, note);

  const recipe = getRecipeBySlug(slug, userId);
  if (!recipe) {
    throw new Error("Unable to load saved recipe.");
  }

  return recipe;
}

export function getRecipeScoreBreakdown(recipe: Recipe): RecipeScoreBreakdown {
  const rating = recipe.personalRating > 0 ? (recipe.personalRating / 5) * 70 : 0;
  const stage = stageScoreWeight[recipe.stage] * 15;
  const difficulty = difficultyScorePoints[recipe.difficulty];
  const speed = Math.max(0, 10 - recipe.cookTime / 6);

  return {
    rating: roundScore(rating),
    stage: roundScore(stage),
    difficulty: roundScore(difficulty),
    speed: roundScore(speed),
    total: roundScore(rating + stage + difficulty + speed),
  };
}

export function calculateRecipeScore(recipe: Recipe) {
  return getRecipeScoreBreakdown(recipe).total;
}

export function compareRecipes(left: Recipe, right: Recipe) {
  const scoreDifference = calculateRecipeScore(right) - calculateRecipeScore(left);

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  if (right.personalRating !== left.personalRating) {
    return right.personalRating - left.personalRating;
  }

  if (left.cookTime !== right.cookTime) {
    return left.cookTime - right.cookTime;
  }

  return left.title.localeCompare(right.title);
}

export function rankRecipes(inputRecipes: Recipe[]) {
  return [...inputRecipes].sort(compareRecipes);
}

export function getAllRecipes(userId?: string): Recipe[] {
  const query = `${userId ? withUserStateSelect(userId) : withLegacyStateSelect()} ORDER BY r.title ASC`;
  const rows = userId
    ? db.prepare(query).all({ userId })
    : db.prepare(query).all();
  return rows.map((row) => mapRow(row as RecipeWithStateRow));
}

export function getTopRankedRecipes(userId?: string) {
  if (!userId) {
    const rows = db.prepare(`${withLegacyStateSelect()} WHERE r.personal_rating > 0`).all();
    return rankRecipes(rows.map((row) => mapRow(row as RecipeWithStateRow)));
  }

  const rows = db
    .prepare(`${withUserStateSelect(userId)} WHERE COALESCE(urs.personal_rating, 0) > 0`)
    .all({ userId });
  const recipes = rows.map((row) => mapRow(row as RecipeWithStateRow));
  return rankRecipes(recipes);
}

export function getDiscoveryQueue(userId?: string) {
  if (!userId) {
    const rows = db.prepare(`${withLegacyStateSelect()} WHERE r.stage != 'ranked'`).all();
    return rows.map((row) => mapRow(row as RecipeWithStateRow));
  }

  const rows = db
    .prepare(`${withUserStateSelect(userId)} WHERE COALESCE(urs.stage, 'saved') != 'ranked'`)
    .all({ userId });
  return rows.map((row) => mapRow(row as RecipeWithStateRow));
}

export function getRecipeBySlug(slug: string, userId?: string) {
  const query = `${userId ? withUserStateSelect(userId) : withLegacyStateSelect()} WHERE r.slug = @slug`;
  const row = userId
    ? db.prepare(query).get({ userId, slug })
    : db.prepare(query).get({ slug });

  return row ? mapRow(row as RecipeWithStateRow) : undefined;
}

export function getRankedRecipes(userId?: string): Recipe[] {
  if (!userId) {
    const rows = db
      .prepare(
        `
          SELECT r.id, r.slug, r.title, r.summary, r.cuisine, r.cook_time, r.difficulty, r.author,
                 r.stage, r.personal_rating, r.note, r.tags, r.ingredients, r.instructions, r.source_url, r.image_url
          FROM ranked_order ro
          JOIN recipes r ON r.id = ro.recipe_id
          ORDER BY ro.position
        `
      )
      .all();
    return rows.map((row) => mapRow(row as RecipeWithStateRow));
  }

  const rows = db
    .prepare(
      `
        SELECT r.id, r.slug, r.title, r.summary, r.cuisine, r.cook_time, r.difficulty, r.author,
               COALESCE(urs.stage, 'saved') AS stage,
               COALESCE(urs.personal_rating, 0) AS personal_rating,
               COALESCE(urs.note, '') AS note,
               r.tags, r.ingredients, r.instructions, r.source_url, r.image_url
        FROM ranking_entries re
        JOIN recipes r ON r.id = re.recipe_id
        LEFT JOIN user_recipe_state urs ON urs.recipe_id = r.id AND urs.user_id = re.user_id
        WHERE re.user_id = ?
        ORDER BY re.position
      `
    )
    .all(userId);

  return rows.map((row) => mapRow(row as RecipeWithStateRow));
}

export function getTrendingRecipes(limit = 6): TrendingRecipe[] {
  const safeLimit = Math.max(1, Math.min(Math.round(limit), 24));
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
          r.stage,
          r.personal_rating,
          r.note,
          r.tags,
          r.ingredients,
          r.instructions,
          r.source_url,
          r.image_url,
          COUNT(rr.recipe_id) AS like_count
        FROM recipes r
        LEFT JOIN recipe_reactions rr
          ON rr.recipe_id = r.id
         AND rr.reaction = 'like'
        GROUP BY r.id
        ORDER BY like_count DESC, r.title ASC
        LIMIT @limit
      `
    )
    .all({ limit: safeLimit });

  return rows.map((row) => mapTrendingRow(row as TrendingRecipeRow));
}

export function insertIntoRanking(userId: string, recipeId: string, position: number): Recipe | null {
  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(recipeId) as
    | RecipeWithStateRow
    | undefined;

  if (!row) {
    return null;
  }

  const tx = db.transaction(() => {
    ensureUserRecipeState(userId, recipeId);

    db.prepare("DELETE FROM ranking_entries WHERE user_id = ? AND recipe_id = ?").run(userId, recipeId);

    const maxPos = db
      .prepare("SELECT COALESCE(MAX(position), -1) AS m FROM ranking_entries WHERE user_id = ?")
      .get(userId) as { m: number };

    const clamped = Math.max(0, Math.min(position, maxPos.m + 1));

    db.prepare("UPDATE ranking_entries SET position = position + 1 WHERE user_id = ? AND position >= ?").run(
      userId,
      clamped
    );

    db.prepare("INSERT INTO ranking_entries (user_id, position, recipe_id) VALUES (?, ?, ?)").run(
      userId,
      clamped,
      recipeId
    );

    db.prepare("UPDATE user_recipe_state SET stage = 'ranked' WHERE user_id = ? AND recipe_id = ?").run(
      userId,
      recipeId
    );
  });

  tx();

  return getRecipeBySlug(row.slug, userId) ?? null;
}
