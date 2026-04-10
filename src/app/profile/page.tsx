import { redirect } from "next/navigation";
import type { Route } from "next";

import { getAuthSession } from "@/lib/auth";
import { getUserById } from "@/lib/users";

export default async function ProfileRedirectPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile" as Route);
  }

  const user = getUserById(session.user.id);
  if (!user) {
    redirect("/login?callbackUrl=/profile" as Route);
  }

  redirect(`/u/${user.handle}`);
}
