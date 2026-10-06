"use client";

import { useState } from "react";
import { ChevronLeft, Delete } from "lucide-react";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

type Props = { totalCents: number; onBack: () => void; onComplete: (tenderedCents: number) => void };

const MAX_CENTS = 9_999_999;
const focus = "outline-none focus-visible:ring-4 focus-visible:ring-foreground/30";
const keyClass = cn(
  "flex h-14 items-center justify-center rounded-xl border border-border bg-surface text-[1.0625rem] font-semibold tabular-nums",
  focus
);

export function CashPad({ totalCents, onBack, onComplete }: Props) {
  const [cents, setCents] = useState(0);

  // Integer cents only: digits shift in from the right, no decimal point.
  const pushDigit = (d: number) => setCents((c) => Math.min(c * 10 + d, MAX_CENTS));
  const pushDouble = () => setCents((c) => Math.min(Math.min(c * 10, MAX_CENTS) * 10, MAX_CENTS));
  const backspace = () => setCents((c) => Math.floor(c / 10));

  const quick = [
    totalCents,
    Math.ceil(totalCents / 500) * 500,
    Math.ceil(totalCents / 1000) * 1000,
    Math.ceil(totalCents / 2000) * 2000,
  ].filter((v, i, all) => all.indexOf(v) === i);

  const change = cents - totalCents;
  const enough = change >= 0;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className={cn("mb-1 -ml-2 inline-flex h-11 items-center gap-1 rounded-xl px-2 text-[0.9375rem] font-semibold text-muted-foreground", focus)}
      >
        <ChevronLeft className="size-4" /> Back
      </button>
      <dl className="space-y-1 text-[0.8125rem] tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Total</dt>
          <dd>{formatCents(totalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Cash received</dt>
          <dd>{formatCents(cents)}</dd>
        </div>
      </dl>
      <div className="mt-2 border-t border-dashed border-border pt-2" aria-live="polite">
        {enough ? (
          <>
            <p className="text-[0.8125rem] text-muted-foreground">Change due</p>
            <p className="text-[2.5rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">{formatCents(change)}</p>
          </>
        ) : (
          <p className="text-[1.0625rem] leading-[2.5rem] font-semibold text-muted-foreground tabular-nums">
            Short {formatCents(-change)}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quick.map((v, i) => (
          <button
            key={v}
            type="button"
            onClick={() => setCents(v)}
            className={cn("h-11 rounded-full border border-border bg-surface px-4 text-[0.9375rem] font-semibold tabular-nums", focus)}
          >
            {i === 0 ? "Exact" : formatCents(v)}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button key={d} type="button" onClick={() => pushDigit(d)} className={keyClass}>
            {d}
          </button>
        ))}
        <button type="button" onClick={() => pushDigit(0)} className={keyClass}>
          0
        </button>
        <button type="button" onClick={pushDouble} className={keyClass}>
          00
        </button>
        <button type="button" aria-label="Backspace" onClick={backspace} className={keyClass}>
          <Delete className="size-5" />
        </button>
      </div>

      <button
        type="button"
        disabled={!enough}
        onClick={() => onComplete(cents)}
        className={cn(
          "mt-3 flex h-16 w-full items-center justify-center rounded-xl bg-foreground text-[1.0625rem] font-bold text-background disabled:opacity-40",
          focus
        )}
      >
        Complete sale
      </button>
    </div>
  );
}
