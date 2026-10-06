import { SettingsRail } from "@/components/dashboard/settings/settings-rail";
import { requireTruckAccess } from "@/lib/tenant";

// The only place the settings two-column geometry lives. The rail is on the
// left; moving it right is `md:flex-row-reverse` here and swapping
// `md:border-r md:pr-6` / `md:pl-6` for `md:border-l md:pl-6` / `md:pr-6`.
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireTruckAccess();

  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 pb-16">
      <h1 className="text-[2rem] leading-none font-semibold tracking-[-0.03em]">Settings</h1>
      <div className="mt-6 flex flex-col gap-6 md:flex-row md:gap-0">
        <div className="md:sticky md:top-6 md:self-start md:border-r md:border-border md:pr-6">
          <SettingsRail role={role} />
        </div>
        <div className="min-w-0 flex-1 md:pl-6">{children}</div>
      </div>
    </main>
  );
}
