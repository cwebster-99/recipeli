import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { addRecipe } from "@/lib/recipes";

type CreateRecipeBody = {
  title?: string;
  summary?: string;
  cuisine?: string;
  cookTime?: number;
  ingredients?: string[];
  instructions?: string[];
  note?: string;
  sourceUrl?: string;
  imageUrl?: string;
};

function normalizeLines(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateRecipeBody;

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const recipe = addRecipe(userId, {
      title: body.title,
      summary: body.summary,
      cuisine: body.cuisine,
      cookTime: typeof body.cookTime === "number" ? body.cookTime : undefined,
      ingredients: normalizeLines(body.ingredients),
      instructions: normalizeLines(body.instructions),
      note: body.note,
      sourceUrl: body.sourceUrl,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
      author: session.user?.name || "You"
    });

    return NextResponse.json({ recipe });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create recipe.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
