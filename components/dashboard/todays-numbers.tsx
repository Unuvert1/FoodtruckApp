import type { TodaysNumbers as Numbers } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { formatTime } from "@/lib/time";

/**
 * The day so far, above the queue. Deliberately four plain figures rather than
 * a chart: this is read at a glance between orders, often one-handed.
 */
export function TodaysNumbers({ numbers, timeZone }: { numbers: Numbers; timeZone: string }) {
  const { orderCount, netCents, counterCents, onlineCents, cashCents, topItems, busiestSlot } = numbers;

  if (orderCount === 0) {
    return (
      <section aria-label="Today" className="rounded-2xl bg-surface px-5 py-4">
        <p className="text-[0.9375rem] text-muted-foreground">No sales yet today.</p>
      </section>
    );
  }

  return (
    <section aria-label="Today" className="rounded-2xl bg-surface px-5 py-4">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Figure label="Taken" value={formatCents(netCents)} />
        <Figure label={orderCount === 1 ? "Order" : "Orders"} value={String(orderCount)} />
        <Figure label="At the window" value={formatCents(counterCents)} sub={`${formatCents(cashCents)} cash`} />
        <Figure label="Online" value={formatCents(onlineCents)} />
      </div>

      {(topItems.length > 0 || busiestSlot) && (
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-3 text-[0.9375rem]">
          {topItems.length > 0 && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Selling</dt>
              <dd className="font-medium">
                {topItems.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
              </dd>
            </div>
          )}
          {busiestSlot && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Busiest pickup</dt>
              <dd className="font-medium tabular-nums">
                {formatTime(busiestSlot.startsAt, timeZone)}
                <span className="font-normal text-muted-foreground"> · {busiestSlot.count}</span>
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}

function Figure({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[1.5rem] leading-none font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
      <p className="mt-1 text-[0.8125rem] text-muted-foreground">
        {label}
        {sub && <span className="tabular-nums"> · {sub}</span>}
      </p>
    </div>
  );
}
