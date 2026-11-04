import Link from "next/link";
import { getDashboardServices, getManagedMenu, getServiceOrders, getTodaysNumbers, requireTruckAccess } from "@/lib/tenant";
import { isHappeningNow } from "@/lib/service";
import { AutoRefresh } from "@/components/auto-refresh";
import { ServiceScreen } from "@/components/dashboard/service-screen";
import { TodaysNumbers } from "@/components/dashboard/todays-numbers";

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
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em]">No stops scheduled</h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Orders show up here once you have a stop on the schedule. Add one and publish it, and this screen becomes
          your queue for the day.
        </p>
        <Link
          href="/dashboard/schedule"
          className="mt-4 inline-flex h-12 items-center rounded-xl bg-foreground px-5 text-[1.0625rem] font-bold text-background outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
        >
          Go to Schedule
        </Link>
      </main>
    );
  }

  const [orders, menu, today] = await Promise.all([
    getServiceOrders(truck.id, selected.id),
    getManagedMenu(truck.id),
    getTodaysNumbers(truck.id, truck.timezone, now),
  ]);
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
        today={<TodaysNumbers numbers={today} timeZone={truck.timezone} />}
      />
      <AutoRefresh seconds={10} />
    </>
  );
}
