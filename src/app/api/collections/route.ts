import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { createCollection, getCollectionsByUser } from "@/lib/collections";

type CreateCollectionBody = {
  name?: string;
  description?: string;
  isPublic?: boolean;
};

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const collections = getCollectionsByUser(userId);
    return NextResponse.json({ collections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch collections.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateCollectionBody;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Collection name is required." }, { status: 400 });
    }

    const collection = createCollection(userId, {
      name: body.name,
      description: body.description,
      isPublic: body.isPublic,
    });

    return NextResponse.json({ collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create collection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
