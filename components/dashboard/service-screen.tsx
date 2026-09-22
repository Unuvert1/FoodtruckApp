"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Location, ManagedSection, OrderView, Service, Truck } from "@/lib/types";
import { formatDayLabel, formatTimeRange } from "@/lib/time";
import { cn } from "@/lib/utils";
import { OrderQueue } from "@/components/dashboard/order-queue";
import { StockBoard } from "@/components/dashboard/stock-board";
import { Badge } from "@/components/dashboard/badge";

type Props = {
  truck: Truck;
  services: Service[];
  locations: Record<string, Location>;
  selectedId: string;
  orders: OrderView[];
  stockSections: ManagedSection[];
};

/**
 * The screen a vendor keeps open during service: orders on the left, stock on
 * the right. On a phone the two become tabs.
 */
export function ServiceScreen({ truck, services, locations, selectedId, orders, stockSections }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "stock">("orders");
  const tz = truck.timezone;
  const newCount = orders.filter((o) => o.status === "PAID").length;
  const soldOutCount = stockSections.flatMap((s) => s.items).filter((i) => !i.isAvailable).length;

  return (
    <main className="mx-auto max-w-7xl px-4 pt-4 pb-16">
      <label className="block max-w-md">
        <span className="sr-only">Stop</span>
        <select
          value={selectedId}
          onChange={(e) => router.push(`/dashboard?service=${e.target.value}`)}
          className="h-12 w-full rounded-xl border border-input bg-surface px-3 text-base font-semibold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {formatDayLabel(s.startsAt, tz)}: {locations[s.locationId]?.name}, {formatTimeRange(s.startsAt, s.endsAt, tz)}
            </option>
          ))}
        </select>
      </label>

      {/* Phone: tabs. Tablet and up: side by side. */}
      <div role="tablist" aria-label="Service screen" className="mt-4 grid grid-cols-2 rounded-xl bg-muted p-1 md:hidden">
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")} controls="panel-orders">
          Orders{newCount > 0 && <Badge tone="signal">{newCount} new</Badge>}
        </TabButton>
        <TabButton active={tab === "stock"} onClick={() => setTab("stock")} controls="panel-stock">
          Stock{soldOutCount > 0 && <Badge tone="muted">{soldOutCount} out</Badge>}
        </TabButton>
      </div>

      <div className="mt-5 md:grid md:grid-cols-[minmax(0,1fr)_20rem] md:gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section id="panel-orders" aria-label="Orders" className={cn(tab !== "orders" && "hidden md:block")}>
          <OrderQueue truck={truck} orders={orders} />
        </section>
        <section id="panel-stock" aria-label="Stock" className={cn(tab !== "stock" && "hidden md:block")}>
          <StockBoard sections={stockSections} />
        </section>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  controls,
  children,
}: {
  active: boolean;
  onClick: () => void;
  controls: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-lg text-[0.9375rem] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
        active ? "bg-surface shadow-sm" : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}
