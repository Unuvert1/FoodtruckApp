"use client";

import type { Location, ManagedSection, OrderView, Service, Truck } from "@/lib/types";
import { OrderQueue } from "@/components/dashboard/order-queue";
import { ServiceBar } from "@/components/dashboard/service-bar";
import { ServiceSwitcher } from "@/components/dashboard/service-switcher";
import { StockSheet } from "@/components/dashboard/stock-sheet";
import { NewOrderChime } from "@/components/dashboard/new-order-chime";
import { useNewOrders } from "@/components/dashboard/use-new-orders";

type Props = {
  truck: Truck;
  services: Service[];
  locations: Record<string, Location>;
  selectedId: string;
  orders: OrderView[];
  stockSections: ManagedSection[];
};

/** The screen a vendor keeps open during service: a sticky bar over one order queue. */
export function ServiceScreen({ truck, services, locations, selectedId, orders, stockSections }: Props) {
  const { arrived, arrivalKey, newCount } = useNewOrders(orders);
  const soldOutCount = stockSections.flatMap((s) => s.items).filter((i) => !i.isAvailable).length;

  return (
    <main className="pb-16">
      <h1 className="sr-only">Service</h1>
      <ServiceBar newCount={newCount} arrivalKey={arrivalKey}>
        <ServiceSwitcher truck={truck} services={services} locations={locations} selectedId={selectedId} />
        <NewOrderChime arrivalKey={arrivalKey} />
        <StockSheet sections={stockSections} soldOutCount={soldOutCount} />
      </ServiceBar>
      <div className="mx-auto max-w-[40rem] md:px-4 lg:max-w-[44rem]">
        <OrderQueue truck={truck} orders={orders} arrived={arrived} />
      </div>
    </main>
  );
}
