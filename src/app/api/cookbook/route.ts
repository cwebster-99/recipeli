import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { getCookbookRecipes } from "@/lib/cookbook";

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const recipes = getCookbookRecipes(userId);
    return NextResponse.json({ recipes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch cookbook.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
