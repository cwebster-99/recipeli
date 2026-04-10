import { NextResponse } from "next/server";

import { getTrendingRecipes } from "@/lib/recipes";

export async function GET() {
  const trending = getTrendingRecipes();

  return NextResponse.json({
    trending,
    total: trending.length,
  });
}
