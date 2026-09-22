"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus, OrderView, Truck } from "@/lib/types";
import { ACTIVE_STATUSES, ADVANCE_LABEL, NEXT_STATUS, STATUS_LABEL, isAdvanceable } from "@/lib/orders/status";
import { formatCents } from "@/lib/money";
import { formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { advanceOrder, cancelOrderAction } from "@/app/(dashboard)/dashboard/actions";
import { Badge } from "@/components/dashboard/badge";

type Change = { id: string; status: OrderStatus };

export function OrderQueue({ truck, orders }: { truck: Truck; orders: OrderView[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
  const count = (status: OrderStatus) => active.filter((o) => o.status === status).length;
  const inProgress = count("ACCEPTED") + count("PREPARING");

  // Group active tickets by pickup time: that's the order the kitchen works in.
  const groups = new Map<string, OrderView[]>();
  for (const order of active) groups.set(order.pickupAt, [...(groups.get(order.pickupAt) ?? []), order]);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="font-display text-[2rem] leading-none font-extrabold">Orders</h1>
        <p className="flex flex-wrap gap-1.5 text-sm">
          {count("PAID") > 0 && <Badge tone="signal">{count("PAID")} new</Badge>}
          {inProgress > 0 && <Badge tone="muted">{inProgress} in progress</Badge>}
          {count("READY") > 0 && <Badge tone="ready">{count("READY")} ready</Badge>}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {active.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-5 py-10 text-center">
          <p className="font-semibold">No open orders</p>
          <p className="mt-1 text-sm text-muted-foreground">New online orders appear here automatically.</p>
        </div>
      ) : (
        [...groups.entries()].map(([pickupAt, tickets]) => (
          <section key={pickupAt} className="mt-6">
            <h2 className="mb-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold tabular-nums">{formatTime(pickupAt, truck.timezone)}</span>
              <span className="text-sm text-muted-foreground">
                pickup, {tickets.length} {tickets.length === 1 ? "order" : "orders"}
              </span>
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
              {tickets.map((order) => (
                <Ticket key={order.id} order={order} onAdvance={() => advance(order)} onCancel={() => cancel(order)} />
              ))}
            </div>
          </section>
        ))
      )}

      {done.length > 0 && (
        <details className="mt-8 rounded-2xl bg-surface">
          <summary className="cursor-pointer px-4 py-3 font-semibold">Completed and cancelled ({done.length})</summary>
          <ul className="divide-y divide-border border-t border-border">
            {done.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-10 font-display text-lg font-bold">{o.orderNumber}</span>
                <span className="flex-1 truncate">{o.customerName}</span>
                <span className="text-muted-foreground">{STATUS_LABEL[o.status]}</span>
                <span className="w-16 text-right tabular-nums">{formatCents(o.totalCents)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Ticket({ order, onAdvance, onCancel }: { order: OrderView; onAdvance: () => void; onCancel: () => void }) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const isNew = order.status === "PAID";
  const isReady = order.status === "READY";

  return (
    <article
      aria-label={`Order ${order.orderNumber} for ${order.customerName}`}
      className={cn(
        "flex flex-col rounded-2xl bg-surface ring-1 ring-border",
        isNew && "ring-2 ring-signal",
        isReady && "ring-2 ring-ready"
      )}
    >
      {isNew && <div aria-hidden className="h-2 rounded-t-2xl bg-signal" />}
      <div className="flex items-start gap-3 px-4 pt-3">
        <p className="font-display text-[2.25rem] leading-none font-extrabold tabular-nums">{order.orderNumber}</p>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate font-semibold">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">{STATUS_LABEL[order.status]}</p>
        </div>
      </div>

      <ul className="mt-3 flex-1 space-y-1.5 px-4">
        {order.lines.map((line) => (
          <li key={line.id} className="text-[0.9375rem] leading-snug">
            <span className="font-semibold tabular-nums">{line.quantity}×</span> {line.name}
            {line.modifiers.length > 0 && (
              <span className="block pl-6 text-sm text-muted-foreground">{line.modifiers.join(", ")}</span>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-3 flex justify-between px-4 text-sm text-muted-foreground">
        <a href={`tel:${order.customerPhone}`} className="underline-offset-4 hover:underline">
          {order.customerPhone}
        </a>
        <span className="tabular-nums">{formatCents(order.totalCents)}</span>
      </p>

      <div className="p-3">
        <button
          type="button"
          onClick={onAdvance}
          className={cn(
            "h-14 w-full rounded-xl text-base font-bold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-foreground/30",
            isNew && "bg-signal text-signal-foreground hover:bg-signal/85",
            isReady && "bg-ready text-white hover:bg-ready/90",
            !isNew && !isReady && "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          {isAdvanceable(order.status) && ADVANCE_LABEL[order.status]}
        </button>
        <button
          type="button"
          onClick={() => (confirmingCancel ? onCancel() : setConfirmingCancel(true))}
          onBlur={() => setConfirmingCancel(false)}
          className={cn(
            "mt-1 h-10 w-full rounded-lg text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-foreground/30",
            confirmingCancel ? "bg-destructive/10 text-destructive" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {confirmingCancel ? "Tap again to cancel this order" : "Cancel order"}
        </button>
      </div>
    </article>
  );
}
