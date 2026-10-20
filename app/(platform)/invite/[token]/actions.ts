"use server";

import { redirect } from "next/navigation";
import { getUserEmail, getUserId } from "@/lib/dev-auth";
import { isWellFormedToken } from "@/lib/invites";
import { acceptInvite } from "@/lib/tenant";

// Public on purpose (the invitee isn't on the truck yet), so it has no
// requireTruckAccess(). The token is the credential, acceptInvite re-checks it
// inside a transaction, and every outcome ends in a redirect: the page then
// shows whichever state the invite is really in.
export async function acceptInviteAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  if (!isWellFormedToken(token)) redirect("/");

  const userId = await getUserId();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`);

  const result = await acceptInvite(token, userId, await getUserEmail(), new Date());
  redirect(result.status === "joined" || result.status === "already_member" ? "/dashboard" : `/invite/${token}`);
}
