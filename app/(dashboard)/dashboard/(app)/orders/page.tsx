import { requireTruckAccess, searchOrders } from "@/lib/tenant";
import { zonedTimeFromParts } from "@/lib/time";
import { OrdersBrowser } from "@/components/dashboard/orders-browser";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

const PER_PAGE = 25;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Props = {
  searchParams: Promise<{ q?: string; from?: string; to?: string; source?: string; page?: string }>;
};

export default async function OrdersPage({ searchParams }: Props) {
  const { truck } = await requireTruckAccess();
  const params = await searchParams;

  const query = params.q?.trim() ?? "";
  const from = DATE.test(params.from ?? "") ? params.from! : "";
  const to = DATE.test(params.to ?? "") ? params.to! : "";
  const source = params.source === "WEB" || params.source === "COUNTER" ? params.source : "";
  const page = Math.max(1, Number(params.page) || 1);

  // The dates the vendor typed are their own days, so they're resolved through
  // the truck's timezone; "to" is inclusive, hence the start of the next day.
  const { orders, total } = await searchOrders(truck.id, {
    query,
    from: from ? zonedTimeFromParts(truck.timezone, from, "00:00") : undefined,
    to: to ? zonedTimeFromParts(truck.timezone, nextDay(to), "00:00") : undefined,
    source: source || undefined,
    take: PER_PAGE,
    skip: (page - 1) * PER_PAGE,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-16">
      <h1 className="text-[2rem] leading-none font-semibold tracking-[-0.03em]">Orders</h1>
      <p className="mt-2 text-[0.9375rem] text-muted-foreground">
        Every order you&apos;ve taken, online and at the window.
      </p>

      <div className="mt-8">
        <OrdersBrowser
          orders={orders}
          total={total}
          page={page}
          perPage={PER_PAGE}
          timeZone={truck.timezone}
          query={query}
          from={from}
          to={to}
          source={source}
        />
      </div>
    </main>
  );
}

function nextDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}
