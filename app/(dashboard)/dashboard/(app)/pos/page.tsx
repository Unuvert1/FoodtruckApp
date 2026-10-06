import Link from "next/link";
import { getManagedMenu, requireTruckAccess } from "@/lib/tenant";
import { PosScreen } from "@/components/dashboard/pos/pos-screen";

export const dynamic = "force-dynamic";
export const metadata = { title: "POS" };

export default async function PosPage() {
  const { truck } = await requireTruckAccess();
  const menu = await getManagedMenu(truck.id);

  const sections = (menu?.sections ?? [])
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.archived) }))
    .filter((s) => s.items.length > 0);

  if (sections.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-16">
        <p className="text-[1.0625rem] font-semibold">Nothing to sell yet.</p>
        <p className="mt-1 text-[0.9375rem] text-muted-foreground">
          Dishes you add in the Menu tab show up here automatically.
        </p>
        <Link
          href="/dashboard/menu"
          className="mt-4 inline-flex h-12 items-center rounded-xl bg-foreground px-5 text-[1.0625rem] font-bold text-background outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
        >
          Go to Menu
        </Link>
      </main>
    );
  }

  return <PosScreen sections={sections} taxRateBps={truck.taxRateBps} />;
}
