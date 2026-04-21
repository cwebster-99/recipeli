import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

import type { Recipe } from "./recipes";

const DB_PATH = path.join(process.cwd(), "data", "recipe-ranker.db");

type RecipeRow = {
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
  tags: string;
  ingredients: string;
  instructions: string;
  note: string;
  source_url: string | null;
  image_url: string | null;
};

export function rowToRecipe(row: RecipeRow): Recipe {
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
    tags: JSON.parse(row.tags) as string[],
    ingredients: JSON.parse(row.ingredients) as string[],
    instructions: JSON.parse(row.instructions) as string[],
    note: row.note,
    sourceUrl: row.source_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

function openDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      cuisine TEXT NOT NULL DEFAULT '',
      cook_time INTEGER NOT NULL DEFAULT 30,
      difficulty TEXT NOT NULL DEFAULT 'Easy',
      author TEXT NOT NULL DEFAULT '',
      stage TEXT NOT NULL DEFAULT 'saved',
      personal_rating REAL NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]',
      ingredients TEXT NOT NULL DEFAULT '[]',
      instructions TEXT NOT NULL DEFAULT '[]',
      note TEXT NOT NULL DEFAULT '',
      source_url TEXT,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS ranked_order (
      position INTEGER NOT NULL,
      recipe_id TEXT NOT NULL REFERENCES recipes(id),
      PRIMARY KEY (position)
    );

    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  runMigrations(db);

  const count = db.prepare("SELECT COUNT(*) AS n FROM recipes").get() as { n: number };
  if (count.n === 0) {
    seed(db);
  }

  return db;
}

function hasMigration(db: Database.Database, id: number) {
  const row = db
    .prepare("SELECT 1 AS present FROM schema_migrations WHERE id = ?")
    .get(id) as { present?: number } | undefined;
  return row?.present === 1;
}

function markMigration(db: Database.Database, id: number) {
  db.prepare("INSERT INTO schema_migrations (id) VALUES (?)").run(id);
}

function runMigrations(db: Database.Database) {
  if (!hasMigration(db, 1)) {
    const tx = db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          handle TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          visibility TEXT NOT NULL DEFAULT 'followers'
        );

        CREATE TABLE IF NOT EXISTS user_recipe_state (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
          stage TEXT NOT NULL DEFAULT 'saved',
          personal_rating REAL NOT NULL DEFAULT 0,
          note TEXT NOT NULL DEFAULT '',
          PRIMARY KEY (user_id, recipe_id)
        );

        CREATE TABLE IF NOT EXISTS ranking_entries (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          position INTEGER NOT NULL,
          recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
          PRIMARY KEY (user_id, position),
          UNIQUE (user_id, recipe_id)
        );

        CREATE TABLE IF NOT EXISTS follows (
          follower_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          followed_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (follower_user_id, followed_user_id),
          CHECK (follower_user_id <> followed_user_id)
        );

        CREATE TABLE IF NOT EXISTS recipe_reactions (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
          reaction TEXT NOT NULL DEFAULT 'like',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, recipe_id, reaction)
        );

        CREATE INDEX IF NOT EXISTS idx_user_recipe_state_recipe ON user_recipe_state (recipe_id);
        CREATE INDEX IF NOT EXISTS idx_ranking_entries_user ON ranking_entries (user_id, position);
        CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows (followed_user_id);
        CREATE INDEX IF NOT EXISTS idx_recipe_reactions_recipe ON recipe_reactions (recipe_id);
      `);

      markMigration(db, 1);
    });

    tx();
  }
}

function seed(db: Database.Database) {
  const insertRecipe = db.prepare(`
    INSERT INTO recipes (id, slug, title, summary, cuisine, cook_time, difficulty, author, stage, personal_rating, tags, ingredients, instructions, note)
    VALUES (@id, @slug, @title, @summary, @cuisine, @cook_time, @difficulty, @author, @stage, @personal_rating, @tags, @ingredients, @instructions, @note)
  `);

  const insertRank = db.prepare(`
    INSERT INTO ranked_order (position, recipe_id) VALUES (@position, @recipe_id)
  `);

  const seedRecipes = [
    {
      id: "crispy-gochujang-pasta",
      slug: "crispy-gochujang-pasta",
      title: "Crispy Gochujang Pasta",
      summary: "Silky cream, gochujang heat, and blistered breadcrumbs for the kind of weeknight recipe that still feels worth ranking.",
      cuisine: "Korean-Italian",
      cook_time: 25,
      difficulty: "Easy",
      author: "Cam Webster",
      stage: "ranked",
      personal_rating: 4.9,
      tags: JSON.stringify(["comfort", "spicy", "under-30"]),
      ingredients: JSON.stringify(["rigatoni", "gochujang", "heavy cream", "parmesan", "garlic", "panko", "butter"]),
      instructions: JSON.stringify([
        "Toast the panko in butter until deeply golden and set aside.",
        "Cook the pasta until just shy of al dente and reserve a mug of pasta water.",
        "Bloom garlic and gochujang together, then stir in cream and parmesan to build the sauce.",
        "Toss the pasta into the sauce, loosen with pasta water, and finish with the crispy crumbs.",
      ]),
      note: "Best weeknight-to-dinner-party ratio in the current list.",
    },
    {
      id: "charred-cabbage-caesar",
      slug: "charred-cabbage-caesar",
      title: "Charred Cabbage Caesar",
      summary: "A high-contrast salad with smoky leaves, glossy dressing, and enough texture to feel like more than a side.",
      cuisine: "Modern American",
      cook_time: 20,
      difficulty: "Easy",
      author: "Jules Hart",
      stage: "ranked",
      personal_rating: 4.7,
      tags: JSON.stringify(["vegetarian", "salad", "high-contrast"]),
      ingredients: JSON.stringify(["green cabbage", "anchovies", "dijon mustard", "parmesan", "lemon", "olive oil", "croutons"]),
      instructions: JSON.stringify([
        "Sear thick cabbage wedges in a hot pan until the cut sides char.",
        "Blend anchovies, mustard, lemon, parmesan, and olive oil into a loose caesar dressing.",
        "Dress the warm cabbage while it still takes on the vinaigrette.",
        "Finish with croutons, extra cheese, and black pepper.",
      ]),
      note: "Unexpectedly craveable. Feels restaurant-level with almost no effort.",
    },
    {
      id: "miso-brownie-skillet",
      slug: "miso-brownie-skillet",
      title: "Miso Brownie Skillet",
      summary: "Dense chocolate with a savory edge, built for the category of dessert you remember later.",
      cuisine: "Baking",
      cook_time: 35,
      difficulty: "Intermediate",
      author: "Maya Leung",
      stage: "ranked",
      personal_rating: 4.6,
      tags: JSON.stringify(["dessert", "salty-sweet", "shareable"]),
      ingredients: JSON.stringify(["dark chocolate", "brown sugar", "white miso", "butter", "eggs", "flour", "cocoa powder"]),
      instructions: JSON.stringify([
        "Melt the butter and chocolate together until glossy.",
        "Whisk in sugar, miso, and eggs until the batter thickens.",
        "Fold in flour and cocoa just until combined.",
        "Bake in a hot skillet until the center is set at the edges and fudgy in the middle.",
      ]),
      note: "The salty finish is what keeps it in the top tier.",
    },
    {
      id: "green-curry-noodle-bowl",
      slug: "green-curry-noodle-bowl",
      title: "Green Curry Noodle Bowl",
      summary: "An herby coconut broth with rice noodles and enough freshness to stay in the repeat-cook rotation.",
      cuisine: "Thai-inspired",
      cook_time: 30,
      difficulty: "Intermediate",
      author: "River Soto",
      stage: "cooked",
      personal_rating: 4.4,
      tags: JSON.stringify(["herby", "brothy", "weeknight"]),
      ingredients: JSON.stringify(["green curry paste", "coconut milk", "rice noodles", "spinach", "lime", "cilantro", "shallots"]),
      instructions: JSON.stringify([
        "Cook shallots with curry paste until aromatic.",
        "Add coconut milk and water, then simmer into a light broth.",
        "Drop in noodles and spinach right at the end.",
        "Brighten with lime and herbs before serving.",
      ]),
      note: "Close to ranking territory, but still missing one surprise texture.",
    },
    {
      id: "roasted-fennel-flatbread",
      slug: "roasted-fennel-flatbread",
      title: "Roasted Fennel Flatbread",
      summary: "Caramelized fennel, ricotta, and lemon on blistered dough. More of a hosting move than a pantry fallback.",
      cuisine: "Mediterranean-inspired",
      cook_time: 40,
      difficulty: "Project",
      author: "Nina Vale",
      stage: "saved",
      personal_rating: 0,
      tags: JSON.stringify(["hosting", "vegetarian", "crispy"]),
      ingredients: JSON.stringify(["pizza dough", "fennel bulbs", "ricotta", "lemon zest", "mozzarella", "chili flakes"]),
      instructions: JSON.stringify([
        "Roast the fennel until the edges are deeply caramelized.",
        "Stretch the dough onto a hot tray and layer with cheeses.",
        "Scatter fennel on top and bake until the crust blisters.",
        "Finish with lemon zest and chili flakes.",
      ]),
      note: "Saved for the next dinner with friends.",
    },
    {
      id: "coconut-lime-salmon-rice",
      slug: "coconut-lime-salmon-rice",
      title: "Coconut Lime Salmon Rice",
      summary: "Sticky rice, lacquered salmon, and a bright coconut finish aimed directly at the repeat-lunch category.",
      cuisine: "Pacific-inspired",
      cook_time: 28,
      difficulty: "Easy",
      author: "Ari Jones",
      stage: "saved",
      personal_rating: 0,
      tags: JSON.stringify(["protein", "meal-prep", "bright"]),
      ingredients: JSON.stringify(["salmon", "jasmine rice", "coconut cream", "lime", "soy sauce", "brown sugar", "scallions"]),
      instructions: JSON.stringify([
        "Steam the rice and hold warm.",
        "Glaze the salmon with soy and brown sugar, then roast until just cooked.",
        "Warm coconut cream with lime zest into a quick finishing sauce.",
        "Serve over rice with scallions and extra lime.",
      ]),
      note: "Saved because it looks like a strong Sunday reset recipe.",
    },
  ];

  const rankedByRating = seedRecipes
    .filter((r) => r.stage === "ranked")
    .sort((a, b) => b.personal_rating - a.personal_rating);

  const tx = db.transaction(() => {
    for (const recipe of seedRecipes) {
      insertRecipe.run(recipe);
    }
    for (let i = 0; i < rankedByRating.length; i++) {
      insertRank.run({ position: i, recipe_id: rankedByRating[i].id });
    }
  });

  tx();
}

declare global {
  // eslint-disable-next-line no-var
  var __recipeRankerDb__: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (typeof window !== "undefined") {
    throw new Error("Database is not available on the client.");
  }

  if (!globalThis.__recipeRankerDb__) {
    globalThis.__recipeRankerDb__ = openDatabase();
  }

  return globalThis.__recipeRankerDb__;
}

export const db = new Proxy({} as Database.Database, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
