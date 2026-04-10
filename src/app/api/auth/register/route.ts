import { NextResponse } from "next/server";

import { registerUser } from "@/lib/users";

type RegisterBody = {
  email?: string;
  password?: string;
  displayName?: string;
  handle?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;

    const user = registerUser({
      email: body.email || "",
      password: body.password || "",
      displayName: body.displayName || "",
      handle: body.handle,
    });

    return NextResponse.json({
      user: user
        ? {
            id: user.id,
            email: user.email,
            handle: user.handle,
            displayName: user.displayName,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to register user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
