import { requireTruckAccess } from "@/lib/tenant";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { truck, notificationEmail } = await requireTruckAccess();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-16">
      <h1 className="font-display text-[2.25rem] leading-none font-extrabold">Settings</h1>

      <SettingsForm notificationEmail={notificationEmail} />

      <section className="mt-8 rounded-2xl bg-surface p-5">
        <h2 className="font-display text-xl font-bold">Your truck</h2>
        <dl className="mt-3 space-y-3 text-[0.9375rem]">
          <div>
            <dt className="text-sm text-muted-foreground">Ordering page</dt>
            <dd>
              <a href={`/${truck.slug}`} target="_blank" className="font-medium underline underline-offset-4">
                {appUrl.replace(/^https?:\/\//, "")}/{truck.slug}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Timezone</dt>
            <dd>{truck.timezone.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Sales tax</dt>
            <dd>{truck.taxRateBps / 100}%</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
