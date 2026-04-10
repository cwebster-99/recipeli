import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { getRecipeLikeSummary, toggleRecipeLike } from "@/lib/social";

type LikeBody = {
  recipeId?: string;
  like?: boolean;
};

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as LikeBody;

    if (!body.recipeId || typeof body.recipeId !== "string") {
      return NextResponse.json({ error: "recipeId is required." }, { status: 400 });
    }

    toggleRecipeLike(userId, body.recipeId, body.like !== false);
    const summary = getRecipeLikeSummary(body.recipeId, userId);

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: "Unable to update reaction." }, { status: 400 });
  }
}
