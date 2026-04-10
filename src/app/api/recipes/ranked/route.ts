import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { getAllRecipes, getRankedRecipes } from "@/lib/recipes";

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const recipes = getAllRecipes(userId);
  const ranked = getRankedRecipes(userId);
  const discovery = recipes.filter((r) => r.stage !== "ranked").length;

  return NextResponse.json({
    ranked,
    total: recipes.length,
    discovery,
  });
}
