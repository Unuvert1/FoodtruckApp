"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { Tender } from "@/components/dashboard/pos/tender-step";

type Props = { tender: Tender; totalCents: number; changeCents: number; onNewSale: () => void };

const TENDER_NAME: Record<Tender, string> = { CARD: "Card", CASH: "Cash", OTHER: "Other" };

export function SaleClosed({ tender, totalCents, changeCents, onNewSale }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <div className="flex h-full flex-col bg-surface px-4 py-6">
      <div role="status" className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
        <Check aria-hidden className="mb-2 size-14 text-ok" strokeWidth={2.5} />
        <p className="text-[1.0625rem] font-semibold">Sale closed</p>
        <p className="text-[2.5rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">{formatCents(totalCents)}</p>
        <p className="mt-2 text-[0.9375rem] text-muted-foreground">
          {TENDER_NAME[tender]}
          {changeCents > 0 && (
            <>
              {" · change "}
              <span className="font-semibold text-foreground tabular-nums">{formatCents(changeCents)}</span>
            </>
          )}
        </p>
      </div>
      <button
        ref={ref}
        type="button"
        onClick={onNewSale}
        className="h-16 w-full rounded-xl bg-foreground text-[1.0625rem] font-bold text-background outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
      >
        New sale
      </button>
      <p className="mt-3 text-center text-[0.8125rem] text-muted-foreground">Tiles stay live. Tap a dish to start the next check.</p>
    </div>
  );
}
