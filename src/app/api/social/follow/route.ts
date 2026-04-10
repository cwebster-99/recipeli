import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { followUser, isFollowing, unfollowUser } from "@/lib/social";
import { getUserByHandle } from "@/lib/users";

type FollowBody = {
  handle?: string;
  follow?: boolean;
};

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as FollowBody;
    const handle = body.handle?.trim().toLowerCase();

    if (!handle) {
      return NextResponse.json({ error: "handle is required." }, { status: 400 });
    }

    const target = getUserByHandle(handle);
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const shouldFollow = body.follow !== false;

    if (shouldFollow) {
      followUser(userId, target.id);
    } else {
      unfollowUser(userId, target.id);
    }

    return NextResponse.json({
      following: isFollowing(userId, target.id),
      handle: target.handle,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update follow state.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
