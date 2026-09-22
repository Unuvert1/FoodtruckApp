// Development-only login bypass. With DEV_AUTH_BYPASS=true in .env.local, the
// dashboard skips Clerk and treats you as the owner of the demo truck.
// It can never turn on in a production build (NODE_ENV === "production").

import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";

export const DEV_AUTH_BYPASS = process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true";

export const DEV_USER_ID = "dev_demo_owner";

/** Whether onboarding offers "Manage the demo truck": always in development, opt-in elsewhere. */
export const DEMO_JOIN_ALLOWED =
  process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_TRUCK_JOIN === "true";

/** The signed-in user's Clerk ID, or the dev user when the bypass is on. */
export async function getUserId(): Promise<string | null> {
  if (DEV_AUTH_BYPASS) return DEV_USER_ID;
  const { userId } = await auth();
  return userId;
}

export async function getUserEmail(): Promise<string | null> {
  if (DEV_AUTH_BYPASS) return null;
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress ?? null;
}
