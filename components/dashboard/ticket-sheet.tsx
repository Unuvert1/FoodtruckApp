"use client";

import { useState } from "react";
import type { OrderView } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

type Props = {
  order: OrderView | null;
  onClose: () => void;
  onCancel: (order: OrderView) => void;
};

/** The things you need once a service, not once a ticket: phone, receipt, cancel. */
export function TicketSheet({ order, onClose, onCancel }: Props) {
  return (
    <Sheet open={order !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-3xl bg-surface p-0 shadow-none">
        {order && <Body key={order.id} order={order} onClose={onClose} onCancel={onCancel} />}
      </SheetContent>
    </Sheet>
  );
}

function Body({ order, onClose, onCancel }: { order: OrderView; onClose: () => void; onCancel: (order: OrderView) => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <div className="px-4 pt-4 pr-14 pb-3">
        <SheetTitle className="text-base font-semibold">
          Order {order.orderNumber} · {order.customerName}
        </SheetTitle>
        <SheetDescription className="text-[0.8125rem]">Contact, receipt and cancel.</SheetDescription>
      </div>

      <a
        href={`tel:${order.customerPhone}`}
        className="flex min-h-14 items-center justify-between border-t border-border px-4 font-semibold"
      >
        <span>Call {order.customerName}</span>
        <span className="text-muted-foreground tabular-nums">{order.customerPhone}</span>
      </a>

      <dl className="space-y-1 border-t border-border px-4 py-4 text-[0.9375rem] tabular-nums">
        <Row label="Subtotal" cents={order.subtotalCents} />
        <Row label="Tax" cents={order.taxCents} />
        <Row label="Tip" cents={order.tipCents} />
        <div className="flex justify-between pt-1 font-semibold">
          <dt>Total</dt>
          <dd>{formatCents(order.totalCents)}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => {
          if (confirming) {
            onCancel(order);
            onClose();
          } else {
            setConfirming(true);
          }
        }}
        onBlur={() => setConfirming(false)}
        className={cn(
          "min-h-14 border-t border-border px-4 text-left font-semibold text-destructive outline-none focus-visible:bg-destructive/10",
          confirming && "bg-destructive/10"
        )}
      >
        {confirming ? "Tap again to cancel this order" : "Cancel order"}
      </button>
    </>
  );
}

function Row({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{formatCents(cents)}</dd>
    </div>
  );
}
