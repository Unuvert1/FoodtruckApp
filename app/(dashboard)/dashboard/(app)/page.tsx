import { getDashboardServices, getManagedMenu, getServiceOrders, requireTruckAccess } from "@/lib/tenant";
import { isHappeningNow } from "@/lib/service";
import { AutoRefresh } from "@/components/auto-refresh";
import { ServiceScreen } from "@/components/dashboard/service-screen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service" };

type Props = { searchParams: Promise<{ service?: string }> };

export default async function ServicePage({ searchParams }: Props) {
  const { truck } = await requireTruckAccess();
  const { service: serviceParam } = await searchParams;

  const now = new Date();
  const { services, locations } = await getDashboardServices(truck.id, now);
  const selected =
    services.find((s) => s.id === serviceParam) ?? services.find((s) => isHappeningNow(s, now)) ?? services[0];

  if (!selected) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="font-display text-4xl font-bold">No stops scheduled</h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Orders show up here once you have a stop on the schedule. Scheduling stops from the dashboard is coming
          next. Meanwhile you can set up your menu.
        </p>
      </main>
    );
  }

  const [orders, menu] = await Promise.all([getServiceOrders(truck.id, selected.id), getManagedMenu(truck.id)]);
  const stockSections = (menu?.sections ?? [])
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.archived) }))
    .filter((s) => s.items.length > 0);

  return (
    <>
      <ServiceScreen
        truck={truck}
        services={services}
        locations={locations}
        selectedId={selected.id}
        orders={orders}
        stockSections={stockSections}
      />
      <AutoRefresh seconds={10} />
    </>
  );
}
