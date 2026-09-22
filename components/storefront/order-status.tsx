import Link from "next/link";
import { Check } from "lucide-react";
import type { Location, OrderStatus as Status, OrderView, Truck } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { formatDayLabel, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

// Customer-facing progress, in the order it happens. PAID and ACCEPTED both
// read as "received": the customer doesn't need the distinction.
const STEPS: { label: string; statuses: Status[] }[] = [
  { label: "Order received", statuses: ["PAID", "ACCEPTED"] },
  { label: "Being prepared", statuses: ["PREPARING"] },
  { label: "Ready at the window", statuses: ["READY"] },
  { label: "Picked up", statuses: ["PICKED_UP"] },
];

export function OrderStatus({ truck, order, location }: { truck: Truck; order: OrderView; location: Location }) {
  const tz = truck.timezone;
  const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const current = STEPS.findIndex((s) => s.statuses.includes(order.status));
  const ready = order.status === "READY";

  return (
    <main className="mx-auto max-w-2xl pb-16">
      <section className="bg-brand px-4 pt-8 pb-8 text-brand-foreground sm:rounded-b-3xl">
        <p className="font-display text-xl font-bold tracking-wide">{truck.name}</p>
        <p className="mt-8 text-base font-medium">
          {ready ? `${order.customerName}, your order is ready.` : `Thanks, ${order.customerName}. Your order number is`}
        </p>
        <h1 className="font-display text-[clamp(6rem,34vw,10rem)] leading-[0.85] font-extrabold tabular-nums">
          {order.orderNumber}
        </h1>
        <p className="mt-3 text-[0.9375rem] opacity-90">Show this number at the pickup window.</p>
      </section>

      <section className="px-4 pt-8">
        <h2 className="font-display text-[1.5rem] leading-tight font-bold">Pickup</h2>
        <div className="mt-3 rounded-2xl bg-surface p-4">
          <p className="font-display text-[1.75rem] leading-none font-bold tabular-nums">
            {formatDayLabel(order.pickupAt, tz)}, {formatTime(order.pickupAt, tz)}
          </p>
          <p className="mt-2 font-semibold">{location.name}</p>
          <p className="text-sm text-muted-foreground">
            {location.addressLine}, {location.city}
          </p>
        </div>
      </section>

      <section className="px-4 pt-8">
        <h2 className="font-display text-[1.5rem] leading-tight font-bold">Status</h2>
        {cancelled ? (
          <p className="mt-3 rounded-2xl bg-surface p-4">
            This order was cancelled. If you were charged, you&apos;ll be refunded. Questions? Ask at the window.
          </p>
        ) : (
          <ol className="mt-3 rounded-2xl bg-surface p-4">
            {STEPS.map((step, i) => {
              const done = i <= current;
              return (
                <li key={step.label} className="relative flex items-center gap-3 pb-5 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className={cn("absolute top-7 bottom-0 left-[0.8125rem] w-0.5", i < current ? "bg-brand" : "bg-border")}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      done ? "bg-brand text-brand-foreground" : "bg-background text-muted-foreground ring-1 ring-border"
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn(done ? "font-semibold" : "text-muted-foreground")}>
                    {step.label}
                    {i === current && <span className="sr-only"> (current step)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="px-4 pt-8">
        <h2 className="font-display text-[1.5rem] leading-tight font-bold">Receipt</h2>
        <div className="mt-3 rounded-2xl bg-surface p-4 text-[0.9375rem]">
          <ul className="divide-y divide-border">
            {order.lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-4 py-2.5 first:pt-0">
                <div>
                  <p>
                    <span className="tabular-nums">{line.quantity}×</span> {line.name}
                  </p>
                  {line.modifiers.length > 0 && (
                    <p className="text-sm text-muted-foreground">{line.modifiers.join(", ")}</p>
                  )}
                </div>
                <p className="tabular-nums">{formatCents(line.lineTotalCents)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1.5 border-t border-border pt-3 tabular-nums">
            <ReceiptRow label="Subtotal" cents={order.subtotalCents} />
            <ReceiptRow label="Tax" cents={order.taxCents} />
            <ReceiptRow label="Tip" cents={order.tipCents} />
            <div className="flex justify-between pt-1 font-semibold">
              <dt>Total</dt>
              <dd>{formatCents(order.totalCents)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <p className="px-4 pt-8">
        <Link href={`/${truck.slug}`} className="font-semibold text-brand underline underline-offset-4">
          Back to {truck.name}
        </Link>
      </p>
    </main>
  );
}

function ReceiptRow({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{formatCents(cents)}</dd>
    </div>
  );
}
