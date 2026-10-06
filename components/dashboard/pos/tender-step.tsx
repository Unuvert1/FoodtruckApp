"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";

export type Tender = "CARD" | "CASH" | "OTHER";

type Props = { onBack: () => void; onCard: () => void; onCash: () => void; onOther: () => void };

const row =
  "flex h-16 w-full items-center px-5 text-left text-[1.0625rem] font-bold outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-foreground/30";

export function TenderStep({ onBack, onCard, onCash, onOther }: Props) {
  const cardRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cardRef.current?.focus(), []);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-2 -ml-2 inline-flex h-11 items-center gap-1 rounded-xl px-2 text-[0.9375rem] font-semibold text-muted-foreground outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
      >
        <ChevronLeft className="size-4" /> Back to check
      </button>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        <button ref={cardRef} type="button" onClick={onCard} className={row}>
          Card
        </button>
        <button type="button" onClick={onCash} className={row}>
          Cash
        </button>
        <button type="button" onClick={onOther} className={row}>
          Other
        </button>
      </div>
    </div>
  );
}
