"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { OrderStatus, OrderView, Truck } from "@/lib/types";
import { ACTIVE_STATUSES, NEXT_STATUS, STATUS_LABEL, isAdvanceable } from "@/lib/orders/status";
import { formatCents } from "@/lib/money";
import { advanceOrder, cancelOrderAction } from "@/app/(dashboard)/dashboard/actions";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { OrderTicket, type TicketTone } from "@/components/dashboard/order-ticket";
import { TicketSheet } from "@/components/dashboard/ticket-sheet";

type Change = { id: string; status: OrderStatus };

// Zones are defined by the action they need, not by pickup time.
const ZONES: { tone: TicketTone; label: string; statuses: OrderStatus[] }[] = [
  { tone: "new", label: "New", statuses: ["PAID"] },
  { tone: "cooking", label: "Cooking", statuses: ["ACCEPTED", "PREPARING"] },
  { tone: "ready", label: "Ready", statuses: ["READY"] },
];

export function OrderQueue({ truck, orders, arrived }: { truck: Truck; orders: OrderView[]; arrived: string[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Tickets move the instant they're tapped; the server confirms in the background.
  const [shown, applyChange] = useOptimistic(orders, (state, change: Change) =>
    state.map((o) => (o.id === change.id ? { ...o, status: change.status } : o))
  );

  function advance(order: OrderView) {
    if (!isAdvanceable(order.status)) return;
    const from = order.status;
    setError(null);
    startTransition(async () => {
      applyChange({ id: order.id, status: NEXT_STATUS[from] });
      const result = await advanceOrder({ orderId: order.id, from });
      if (!result.ok) {
        setError(result.error);
        router.refresh();
      }
    });
  }

  function cancel(order: OrderView) {
    setError(null);
    startTransition(async () => {
      applyChange({ id: order.id, status: "CANCELLED" });
      const result = await cancelOrderAction(order.id);
      if (!result.ok) {
        setError(result.error);
        router.refresh();
      }
    });
  }

  const active = shown.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const done = shown.filter((o) => !ACTIVE_STATUSES.includes(o.status));
  const byPickup = (a: OrderView, b: OrderView) => Date.parse(a.pickupAt) - Date.parse(b.pickupAt);

  return (
    <div>
      <ErrorBanner message={error} className="mx-4 mt-3" />

      {active.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-base font-semibold">All caught up.</p>
          <p className="mt-1 text-[0.8125rem] text-muted-foreground">New orders land here on their own.</p>
        </div>
      ) : (
        ZONES.map((zone) => {
          const tickets = active.filter((o) => zone.statuses.includes(o.status)).sort(byPickup);
          if (tickets.length === 0) return null;
          return (
            <section key={zone.tone} className="mt-8 first:mt-6">
              <h2 className="px-4 pb-2 text-[0.8125rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                {zone.label} · {tickets.length}
              </h2>
              <ul className="divide-y divide-border overflow-hidden bg-surface md:rounded-2xl">
                {tickets.map((order) => (
                  <OrderTicket
                    key={order.id}
                    order={order}
                    tone={zone.tone}
                    timezone={truck.timezone}
                    arriving={order.status === "PAID" && arrived.includes(order.id)}
                    onAdvance={() => advance(order)}
                    onOpenDetails={() => setDetailId(order.id)}
                  />
                ))}
              </ul>
            </section>
          );
        })
      )}

      {done.length > 0 && (
        <details className="group mt-8 border-t border-border">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 text-[0.8125rem] text-muted-foreground">
            <span>{done.length} done today</span>
            <ChevronRight aria-hidden className="size-4 group-open:rotate-90" />
          </summary>
          <ul className="divide-y divide-border border-t border-border">
            {done.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-4 py-3 text-[0.8125rem]">
                <span className="w-10 text-base font-semibold tabular-nums">{o.orderNumber}</span>
                <span className="flex-1 truncate">{o.customerName}</span>
                <span className="text-muted-foreground">{STATUS_LABEL[o.status]}</span>
                <span className="w-16 text-right tabular-nums">{formatCents(o.totalCents)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <TicketSheet
        order={shown.find((o) => o.id === detailId && ACTIVE_STATUSES.includes(o.status)) ?? null}
        onClose={() => setDetailId(null)}
        onCancel={cancel}
      />
    </div>
  );
}
