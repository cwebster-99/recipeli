import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import {
  deleteCollection,
  getCollection,
  updateCollection,
  getCollectionRecipes,
} from "@/lib/collections";

type UpdateCollectionBody = {
  name?: string;
  description?: string;
  isPublic?: boolean;
};

type CollectionParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: CollectionParams) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const collection = getCollection(userId, id);

    if (!collection) {
      return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    }

    const recipes = getCollectionRecipes(userId, id);

    return NextResponse.json({ collection, recipes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch collection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: CollectionParams) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateCollectionBody;

    const collection = updateCollection(userId, id, body);

    return NextResponse.json({ collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update collection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: CollectionParams) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { id } = await params;
    deleteCollection(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete collection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
