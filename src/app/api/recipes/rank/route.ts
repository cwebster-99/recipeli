import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { insertIntoRanking } from "@/lib/recipes";

type RankBody = {
  recipeId?: string;
  position?: number;
};

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as RankBody;

    if (!body.recipeId || typeof body.recipeId !== "string") {
      return NextResponse.json({ error: "recipeId is required." }, { status: 400 });
    }

    if (typeof body.position !== "number" || body.position < 0) {
      return NextResponse.json({ error: "Valid position is required." }, { status: 400 });
    }

    const recipe = insertIntoRanking(userId, body.recipeId, body.position);

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
    }

    return NextResponse.json({ recipe, position: body.position });
  } catch {
    return NextResponse.json({ error: "Unable to rank recipe." }, { status: 400 });
  }
}
