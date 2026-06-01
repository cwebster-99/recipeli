import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import {
  addRecipeToCookbook,
  isRecipeInCookbook,
  removeRecipeFromCookbook,
} from "@/lib/cookbook";

type RecipeParams = {
  params: Promise<{ recipeId: string }>;
};

export async function GET(_request: Request, { params }: RecipeParams) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { recipeId } = await params;
  const inCookbook = isRecipeInCookbook(userId, recipeId);
  return NextResponse.json({ inCookbook });
}

export async function POST(_request: Request, { params }: RecipeParams) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { recipeId } = await params;
    addRecipeToCookbook(userId, recipeId);
    return NextResponse.json({ success: true, inCookbook: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add recipe.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RecipeParams) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { recipeId } = await params;
    removeRecipeFromCookbook(userId, recipeId);
    return NextResponse.json({ success: true, inCookbook: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove recipe.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
