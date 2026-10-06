"use client";

import Link from "next/link";
import type { OrderView } from "@/lib/types";
import { ADVANCE_LABEL, STATUS_LABEL, isAdvanceable } from "@/lib/orders/status";
import { formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export type TicketTone = "new" | "cooking" | "ready";

type Props = {
  order: OrderView;
  tone: TicketTone;
  timezone: string;
  /** Plays the arrival animation (new orders only). */
  arriving: boolean;
  onAdvance: () => void;
};

/** One row in the queue. Presentational: callbacks only, no data or actions. */
export function OrderTicket({ order, tone, timezone, arriving, onAdvance }: Props) {
  const time = formatTime(order.pickupAt, timezone);
  const meta = tone === "new" ? `${time} pickup` : `${time} · ${STATUS_LABEL[order.status]}`;
  const summary = order.lines.map((l) => `${l.quantity}× ${l.name}`).join(" · ");

  return (
    <li
      aria-label={`Order ${order.orderNumber} for ${order.customerName}`}
      className={cn(
        "relative px-4 py-4 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-4",
        arriving && "motion-safe:animate-ticket-in"
      )}
    >
      {tone !== "cooking" && (
        <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", tone === "new" ? "bg-new" : "bg-ready")} />
      )}

      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <p className="text-[1.75rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">{order.orderNumber}</p>
          <p className="min-w-0 flex-1 truncate text-base font-semibold">{order.customerName}</p>
          <p className="shrink-0 text-[0.8125rem] text-muted-foreground tabular-nums">{meta}</p>
        </div>

        {tone === "new" ? (
          <p title={summary} className="mt-2 truncate text-[0.9375rem] leading-snug">
            {summary}
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {order.lines.map((line) => (
              <li key={line.id} className="text-[0.9375rem] leading-snug">
                <span className="font-semibold tabular-nums">{line.quantity}×</span> {line.name}
                {line.modifiers.length > 0 && (
                  <span className="block pl-6 text-[0.8125rem] text-muted-foreground">{line.modifiers.join(", ")}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex gap-2 md:mt-0">
        <button
          type="button"
          onClick={onAdvance}
          className={cn(
            "min-w-0 flex-1 rounded-xl text-[1.0625rem] font-bold outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 md:w-44 md:flex-none",
            tone === "new" ? "h-16" : "h-14",
            tone === "new" && "bg-new text-new-foreground hover:bg-new/90",
            tone === "cooking" && "border border-cooking bg-cooking-tint text-cooking-ink hover:bg-cooking-tint/70",
            tone === "ready" && "border border-ready bg-ready-tint-strong text-ready-ink hover:bg-ready-tint-strong/70"
          )}
        >
          {isAdvanceable(order.status) && ADVANCE_LABEL[order.status]}
        </button>
        <Link
          href={`/dashboard/orders/${order.id}`}
          aria-label={`Details for order ${order.orderNumber}`}
          className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border text-xl leading-none font-bold outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
        >
          <span aria-hidden>⋯</span>
        </Link>
      </div>
    </li>
  );
}
