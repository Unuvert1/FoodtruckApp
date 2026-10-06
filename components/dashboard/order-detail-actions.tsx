"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { OrderView } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { ACTIVE_STATUSES, ADVANCE_LABEL, isAdvanceable } from "@/lib/orders/status";
import { cn } from "@/lib/utils";
import { advanceOrder, cancelOrderAction } from "@/app/(dashboard)/dashboard/actions";
import { voidLineItem } from "@/app/(dashboard)/dashboard/(app)/orders/actions";

type Reason = "SOLD_OUT" | "CUSTOMER_REQUEST" | "MISTAKE";
const REASONS: { value: Reason; label: string }[] = [
  { value: "SOLD_OUT", label: "Sold out" },
  { value: "CUSTOMER_REQUEST", label: "Customer" },
  { value: "MISTAKE", label: "Mistake" },
];

const focusRing = "outline-none focus-visible:ring-4 focus-visible:ring-foreground/30";

type Props = { order: OrderView; truckName: string; pickupLabel: string };

/** Everything on the detail page that does something: advance, contact, void an item, cancel. */
export function OrderDetailActions({ order, truckName, pickupLabel }: Props) {
  const isActive = ACTIVE_STATUSES.includes(order.status);
  const canVoid = isActive || order.status === "PICKED_UP";

  return (
    <div className="border-t border-border">
      {isActive && <AdvanceButton order={order} />}
      <Contact order={order} truckName={truckName} />
      {canVoid && <IssueBlock order={order} pickupLabel={pickupLabel} canCancel={isActive} />}
    </div>
  );
}

function AdvanceButton({ order }: { order: OrderView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!isAdvanceable(order.status)) return null;
  const from = order.status;
  const tone = from === "PAID" ? "new" : from === "READY" ? "ready" : "cooking";

  return (
    <div className="px-4 pt-4">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await advanceOrder({ orderId: order.id, from });
            setError(result.ok ? null : result.error);
            router.refresh();
          })
        }
        className={cn(
          "h-14 w-full rounded-xl border text-[1.0625rem] font-bold disabled:opacity-60",
          focusRing,
          tone === "new" && "border-new bg-new text-new-foreground hover:bg-new/90",
          tone === "cooking" && "border-cooking bg-cooking-tint text-cooking-ink hover:bg-cooking-tint/70",
          tone === "ready" && "border-ready bg-ready-tint-strong text-ready-ink hover:bg-ready-tint-strong/70"
        )}
      >
        {ADVANCE_LABEL[from]}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-[0.9375rem] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Contact({ order, truckName }: { order: OrderView; truckName: string }) {
  const first = order.customerName.trim().split(/\s+/)[0] || "customer";
  const digits = order.customerPhone.replace(/[^\d+]/g, "");
  const message = `Hi ${first}, this is ${truckName} about order ${order.orderNumber}.`;
  const button = cn(
    "flex h-12 flex-1 items-center justify-center rounded-xl border border-border px-2 font-semibold",
    focusRing
  );

  return (
    <div className="px-4 pt-4">
      <div className="flex gap-2">
        <a href={`tel:${digits}`} className={button}>
          Call {first}
        </a>
        <a href={`sms:${digits}?&body=${encodeURIComponent(message)}`} className={button}>
          Text {first}
        </a>
      </div>
      <p className="mt-3 text-[0.9375rem] text-muted-foreground tabular-nums select-text">{order.customerPhone}</p>
      {order.customerEmail && (
        <>
          <a
            href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(`Your order ${order.orderNumber} from ${truckName}`)}`}
            className={cn(button, "mt-3 w-full flex-none")}
          >
            Email {first}
          </a>
          <p className="mt-2 text-[0.9375rem] break-all text-muted-foreground select-text">{order.customerEmail}</p>
        </>
      )}
    </div>
  );
}

function IssueBlock({ order, pickupLabel, canCancel }: { order: OrderView; pickupLabel: string; canCancel: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lineId, setLineId] = useState<string | null>(null);
  const [reason, setReason] = useState<Reason | null>(null);
  const [refund, setRefund] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const selected = order.lines.find((l) => l.id === lineId && !l.voidedAt) ?? null;
  const ready = selected !== null && reason !== null;

  function removeItem() {
    if (!selected || !reason) return;
    startTransition(async () => {
      const result = await voidLineItem({ orderId: order.id, lineItemId: selected.id, reason, refund });
      setError(result.ok ? null : result.error);
      if (result.ok) {
        setLineId(null);
        setReason(null);
      }
      router.refresh();
    });
  }

  function cancel() {
    startTransition(async () => {
      const result = await cancelOrderAction(order.id);
      if (result.ok) {
        router.push("/dashboard");
      } else {
        setError(result.error);
        setConfirming(false);
        router.refresh();
      }
    });
  }

  return (
    <details className="group mx-4 mt-6 rounded-xl border border-border">
      <summary
        className={cn(
          "flex h-12 cursor-pointer list-none items-center justify-between rounded-xl px-4 font-semibold [&::-webkit-details-marker]:hidden",
          focusRing
        )}
      >
        Issue with this order
        <ChevronRight aria-hidden className="size-5 transition-transform group-open:rotate-90" />
      </summary>

      <div className="border-t border-border px-4 py-4">
        <fieldset>
          <legend className="font-semibold">Remove an item</legend>
          <div className="mt-2 divide-y divide-border">
            {order.lines.map((line) => (
              <label
                key={line.id}
                className={cn(
                  "flex min-h-12 items-center gap-3 py-2 text-[0.9375rem]",
                  line.voidedAt ? "opacity-60" : "cursor-pointer"
                )}
              >
                <input
                  type="radio"
                  name="line"
                  value={line.id}
                  disabled={line.voidedAt !== null}
                  checked={lineId === line.id}
                  onChange={() => setLineId(line.id)}
                  className="size-5 shrink-0 accent-foreground"
                />
                <span className="min-w-0 flex-1 break-words">
                  <span className="font-semibold tabular-nums">{line.quantity}×</span> {line.name}
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {line.voidedAt ? "already removed" : formatCents(line.lineTotalCents)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="font-semibold">Why?</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={cn(
                  "flex h-12 cursor-pointer items-center justify-center rounded-xl border border-border text-[0.9375rem] font-semibold has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-foreground/30",
                  reason === r.value && "border-foreground bg-muted"
                )}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  required
                  className="sr-only"
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 text-[0.9375rem]">
          <input
            type="checkbox"
            checked={refund}
            onChange={(e) => setRefund(e.target.checked)}
            className="size-5 shrink-0 accent-foreground"
          />
          <span>Record a {selected ? formatCents(selected.lineTotalCents) : "$0.00"} refund owed</span>
        </label>

        <button
          type="button"
          disabled={!ready || pending}
          onClick={removeItem}
          className={cn(
            "mt-3 h-12 w-full rounded-xl border border-destructive bg-surface font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50",
            focusRing
          )}
        >
          Remove item
        </button>
        <p className="mt-2 text-[0.8125rem] text-muted-foreground">
          Nothing is charged or refunded yet. Settle with the customer at the window.
        </p>
        {/* TODO(Stream C): the partial Stripe refund for the voided line goes here (via voidOrderLineItem). */}

        {error && (
          <p role="alert" className="mt-3 text-[0.9375rem] font-medium text-destructive">
            {error}
          </p>
        )}

        {canCancel && (
          <div className="mt-5 border-t border-border pt-4">
            <button
              type="button"
              disabled={pending}
              onClick={() => (confirming ? cancel() : setConfirming(true))}
              onBlur={() => setConfirming(false)}
              className={cn(
                "h-12 w-full rounded-xl bg-destructive font-semibold text-white disabled:opacity-60",
                focusRing,
                confirming && "ring-4 ring-destructive/30"
              )}
            >
              {confirming ? "Tap again to cancel this order" : "Cancel order"}
            </button>
            <p className="mt-2 text-[0.8125rem] text-muted-foreground">
              Cancels every item and frees the {pickupLabel} pickup slot.
            </p>
          </div>
        )}
      </div>
    </details>
  );
}
