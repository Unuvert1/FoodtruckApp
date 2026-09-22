import { getManagedMenu, requireTruckAccess } from "@/lib/tenant";
import { MenuManager } from "@/components/dashboard/menu-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu" };

export default async function MenuPage() {
  const { truck } = await requireTruckAccess();
  const menu = await getManagedMenu(truck.id);

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-16">
      <MenuManager sections={menu?.sections ?? []} />
    </main>
  );
}
