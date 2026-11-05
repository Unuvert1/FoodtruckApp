"use client";

// Finding one order. The Service screen answers "what do I cook next"; this
// answers "a customer is on the phone about A07 from Saturday".
//
// State lives in the URL rather than React, so a search can be reloaded,
// bookmarked and sent to the other person working the truck.

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { formatCents } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/orders/status";
import { formatDayParts, formatTime } from "@/lib/time";
import type { OrderView } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  orders: OrderView[];
  total: number;
  page: number;
  perPage: number;
  timeZone: string;
  query: string;
  from: string;
  to: string;
  source: string;
};

const SOURCES = [
  { value: "", label: "All orders" },
  { value: "WEB", label: "Online" },
  { value: "COUNTER", label: "At the window" },
];

export function OrdersBrowser({ orders, total, page, perPage, timeZone, query, from, to, source }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [text, setText] = useState(query);
  const first = useRef(true);

  // Debounced, so typing an order number doesn't fire a query per keystroke.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => apply({ q: text, page: "1" }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function apply(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const filtered = Boolean(query || from || to || source);

  return (
    <div className={cn("transition-opacity motion-reduce:transition-none", pending && "opacity-60")}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor="order-search" className="mb-1.5 block text-sm font-semibold">
            Find an order
          </label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="order-search"
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Order number, name or phone"
              className="h-12 w-full rounded-xl border border-input bg-surface pr-3.5 pl-10 text-base outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40"
            />
          </div>
        </div>

        <div>
          <label htmlFor="order-from" className="mb-1.5 block text-sm font-semibold">
            From
          </label>
          <input id="order-from" type="date" value={from} onChange={(e) => apply({ from: e.target.value, page: "1" })} className={dateInput} />
        </div>
        <div>
          <label htmlFor="order-to" className="mb-1.5 block text-sm font-semibold">
            To
          </label>
          <input id="order-to" type="date" value={to} onChange={(e) => apply({ to: e.target.value, page: "1" })} className={dateInput} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => apply({ source: s.value, page: "1" })}
            aria-pressed={source === s.value}
            className={cn(
              "h-10 rounded-full border px-4 text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
              source === s.value ? "border-transparent bg-foreground text-background" : "border-input hover:bg-muted"
            )}
          >
            {s.label}
          </button>
        ))}
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setText("");
              apply({ q: "", from: "", to: "", source: "", page: "1" });
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <X aria-hidden className="size-4" />
            Clear
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-muted-foreground">
        {total === 0 ? "No orders" : `${total} ${total === 1 ? "order" : "orders"}`}
        {filtered && total > 0 && " matching"}
      </p>

      {orders.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-surface/60 px-4 py-10 text-center text-sm text-muted-foreground">
          {filtered ? "Nothing matches that. Try a different search or widen the dates." : "Orders appear here as they come in."}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl bg-surface">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} timeZone={timeZone} />
          ))}
        </ul>
      )}

      {lastPage > 1 && (
        <div className="mt-5 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => apply({ page: String(page - 1) })}
            className={pageButton}
          >
            Newer
          </button>
          <p className="text-sm text-muted-foreground tabular-nums">
            Page {page} of {lastPage}
          </p>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => apply({ page: String(page + 1) })}
            className={pageButton}
          >
            Older
          </button>
        </div>
      )}
    </div>
  );
}

const dateInput =
  "h-12 w-[9.5rem] rounded-xl border border-input bg-surface px-3 text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40";

const pageButton =
  "h-11 rounded-xl border border-input px-4 text-sm font-semibold outline-none hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-4 focus-visible:ring-ring/40";

function OrderRow({ order, timeZone }: { order: OrderView; timeZone: string }) {
  const { weekday, day } = formatDayParts(order.placedAt, timeZone);
  const counter = order.source === "COUNTER";
  const net = order.totalCents - order.refundedCents;

  return (
    <li>
      <Link
        href={`/dashboard/orders/${order.id}`}
        className="flex items-start gap-4 px-4 py-3.5 outline-none focus-visible:bg-muted/70"
      >
        <div className="w-10 shrink-0 text-center">
          <p className="text-xs font-medium text-muted-foreground">{weekday}</p>
          <p className="font-display text-[1.5rem] leading-none font-bold tabular-nums">{day}</p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-lg leading-none font-bold tabular-nums">{order.orderNumber}</span>
            <span className="truncate font-semibold">{order.customerName}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {counter ? "At the window" : order.pickupAt ? `Pickup ${formatTime(order.pickupAt, timeZone)}` : "Online"}
            <span className="mx-1.5" aria-hidden>
              ·
            </span>
            {STATUS_LABEL[order.status] ?? order.status}
            {order.refundedCents > 0 && (
              <>
                <span className="mx-1.5" aria-hidden>
                  ·
                </span>
                <span className="text-destructive">{formatCents(order.refundedCents)} refunded</span>
              </>
            )}
          </p>
        </div>

        <p className="shrink-0 pt-0.5 font-semibold tabular-nums">{formatCents(net)}</p>
      </Link>
    </li>
  );
}
