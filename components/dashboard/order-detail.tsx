import type { OrderView } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/orders/status";
import { formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

const REASON_LABEL: Record<string, string> = {
  SOLD_OUT: "sold out",
  CUSTOMER_REQUEST: "customer request",
  MISTAKE: "mistake",
};

type Zone = "new" | "cooking" | "ready" | "none";

function zoneOf(status: OrderView["status"]): Zone {
  if (status === "PAID") return "new";
  if (status === "ACCEPTED" || status === "PREPARING") return "cooking";
  if (status === "READY") return "ready";
  return "none";
}

/** Header, items, totals and timestamps. Read-only, so a Server Component. */
export function OrderDetail({ order, timezone }: { order: OrderView; timezone: string }) {
  const zone = zoneOf(order.status);
  const itemCount = order.lines.filter((l) => !l.voidedAt).reduce((n, l) => n + l.quantity, 0);
  const time = (iso: string | null) => (iso ? formatTime(iso, timezone) : "—");

  return (
    <>
      <header className="relative px-4 py-4 pl-5">
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            zone === "new" && "bg-new",
            zone === "cooking" && "bg-cooking",
            zone === "ready" && "bg-ready",
            zone === "none" && "bg-border"
          )}
        />
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-[1.75rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">{order.orderNumber}</h1>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[0.8125rem] font-semibold",
              zone === "new" && "border-new bg-new-tint text-foreground",
              zone === "cooking" && "border-cooking bg-cooking-tint text-cooking-ink",
              zone === "ready" && "border-ready bg-ready-tint text-ready-ink",
              zone === "none" && "border-border text-muted-foreground"
            )}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className="mt-2 text-base font-semibold break-words">{order.customerName}</p>
        <p className="mt-1 text-[0.8125rem] text-muted-foreground tabular-nums">
          Pickup {formatTime(order.pickupAt, timezone)} · {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </header>

      <section aria-labelledby="items-heading" className="border-t border-border px-4 py-4">
        <h2 id="items-heading" className="text-[0.8125rem] font-semibold tracking-wider text-muted-foreground uppercase">
          Items
        </h2>
        <ul className="mt-2 divide-y divide-border border-t border-border">
          {order.lines.map((line) => (
            <li key={line.id} className="py-3">
              <div className={cn("flex items-baseline justify-between gap-3", line.voidedAt && "opacity-60")}>
                <p className={cn("min-w-0 text-[0.9375rem] leading-snug break-words", line.voidedAt && "line-through")}>
                  <span className="font-semibold tabular-nums">{line.quantity}×</span> {line.name}
                </p>
                <p className={cn("shrink-0 text-[0.9375rem] tabular-nums", line.voidedAt && "line-through")}>
                  {formatCents(line.lineTotalCents)}
                </p>
              </div>
              {line.modifiers.length > 0 && (
                <p className={cn("pl-6 text-[0.8125rem] text-muted-foreground", line.voidedAt && "line-through opacity-60")}>
                  {line.modifiers.join(", ")}
                </p>
              )}
              {line.voidedAt && (
                <p className="mt-2 rounded-lg bg-cooking-tint px-3 py-2 text-[0.8125rem] font-semibold text-cooking-ink">
                  Removed ({REASON_LABEL[line.voidedReason ?? ""] ?? "no reason given"})
                  {line.voidedCents > 0 && (
                    <span className="block font-normal tabular-nums">refund owed {formatCents(line.voidedCents)}</span>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
        {order.lines.length > 0 && order.lines.every((l) => l.voidedAt) && (
          <p className="mt-3 rounded-lg bg-cooking-tint px-3 py-2 text-[0.9375rem] font-semibold text-cooking-ink">
            Every item on this order is removed. Use Cancel order below to close it and free the pickup slot.
          </p>
        )}
      </section>

      <dl className="space-y-1 border-t border-border px-4 py-4 text-[0.9375rem] tabular-nums">
        <Row label="Subtotal" cents={order.subtotalCents} />
        <Row label="Tax" cents={order.taxCents} />
        <Row label="Tip" cents={order.tipCents} />
        <Row label="Total" cents={order.totalCents} strong />
        {order.refundedCents > 0 && (
          <div className="mt-2 space-y-1 border-t border-border pt-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Refund owed</dt>
              <dd>−{formatCents(order.refundedCents)}</dd>
            </div>
            <Row label="Net" cents={order.totalCents - order.refundedCents} strong />
          </div>
        )}
      </dl>

      <dl className="space-y-1 border-t border-border px-4 py-4 text-[0.9375rem] tabular-nums">
        <Stamp label="Placed" value={time(order.placedAt)} />
        <Stamp label="Accepted" value={time(order.acceptedAt)} />
        <Stamp label="Ready" value={time(order.readyAt)} />
        <Stamp label={order.autoCompletedAt ? "Picked up (auto)" : "Picked up"} value={time(order.pickedUpAt)} />
      </dl>
    </>
  );
}

function Row({ label, cents, strong }: { label: string; cents: number; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong && "font-semibold")}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd>{formatCents(cents)}</dd>
    </div>
  );
}

function Stamp({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
