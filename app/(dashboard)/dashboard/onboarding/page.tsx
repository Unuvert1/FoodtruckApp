import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { userHasTruck } from "@/lib/tenant";
import { Wordmark } from "@/components/platform/wordmark";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";

export const metadata = { title: "Set up your truck" };

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (await userHasTruck(userId)) redirect("/dashboard");

  const demoAllowed = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_TRUCK_JOIN === "true";
  const appHost = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/^https?:\/\//, "");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Wordmark />
      <h1 className="mt-10 font-display text-[2.75rem] leading-none font-extrabold">Set up your truck</h1>
      <p className="mt-3 text-muted-foreground">
        This creates your ordering page and dashboard. You can add your menu right after.
      </p>
      <OnboardingForm appHost={appHost} demoAllowed={demoAllowed} />
    </main>
  );
}
