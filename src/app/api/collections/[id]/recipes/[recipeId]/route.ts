import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { addRecipeToCollection, removeRecipeFromCollection } from "@/lib/collections";

type RecipeBody = {
  recipeId?: string;
};

type RecipeParams = {
  params: Promise<{ id: string; recipeId: string }>;
};

export async function POST(request: Request, { params }: RecipeParams) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { id: collectionId } = await params;
    const body = (await request.json()) as RecipeBody;

    if (!body.recipeId?.trim()) {
      return NextResponse.json({ error: "recipeId is required." }, { status: 400 });
    }

    addRecipeToCollection(userId, collectionId, body.recipeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add recipe to collection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RecipeParams) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { id: collectionId, recipeId } = await params;

    removeRecipeFromCollection(userId, collectionId, recipeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to remove recipe from collection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
