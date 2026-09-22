import { redirect } from "next/navigation";
import { DEMO_JOIN_ALLOWED, getUserId } from "@/lib/dev-auth";
import { userHasTruck } from "@/lib/tenant";
import { Wordmark } from "@/components/platform/wordmark";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";

export const metadata = { title: "Set up your truck" };

export default async function OnboardingPage() {
  const userId = await getUserId();
  if (!userId) redirect("/sign-in");
  if (await userHasTruck(userId)) redirect("/dashboard");

  const appHost = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/^https?:\/\//, "");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Wordmark />
      <h1 className="mt-10 font-display text-[2.75rem] leading-none font-extrabold">Set up your truck</h1>
      <p className="mt-3 text-muted-foreground">
        This creates your ordering page and dashboard. You can add your menu right after.
      </p>
      <OnboardingForm appHost={appHost} demoAllowed={DEMO_JOIN_ALLOWED} />
    </main>
  );
}
