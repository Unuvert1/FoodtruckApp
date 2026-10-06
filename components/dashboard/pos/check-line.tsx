"use client";

import { useEffect, useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { formatCents } from "@/lib/money";
import { MAX_QUANTITY_PER_LINE } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { DisplayLine } from "@/components/dashboard/pos/use-check";

type Props = {
  line: DisplayLine;
  selected: boolean;
  flashN: number | null; // changes each time this line is added/incremented; null when not flashing
  onSelect: () => void;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onOptions: () => void;
};

const focus = "outline-none focus-visible:ring-4 focus-visible:ring-foreground/30";

export function CheckLine({ line, selected, flashN, onSelect, onQuantity, onRemove, onOptions }: Props) {
  const ref = useRef<HTMLLIElement>(null);
  const lit = flashN !== null;

  useEffect(() => {
    if (flashN !== null) ref.current?.scrollIntoView({ block: "nearest" });
  }, [flashN]);

  return (
    <li ref={ref} className={cn("motion-safe:transition-colors motion-safe:duration-150", lit && "bg-muted")}>
      <button
        type="button"
        aria-expanded={selected}
        onClick={onSelect}
        className={cn("flex min-h-11 w-full items-start px-4 py-2 text-left focus-visible:ring-inset", focus)}
      >
        <span className="w-9 shrink-0 text-[0.9375rem] leading-snug font-semibold tabular-nums">{line.quantity}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9375rem] leading-snug">{line.name}</span>
          {line.modifiers.length > 0 && (
            <span className="block text-[0.8125rem] text-muted-foreground">{line.modifiers.join(", ")}</span>
          )}
        </span>
        <span className="pl-3 text-[0.9375rem] leading-snug tabular-nums">{formatCents(line.lineTotalCents)}</span>
      </button>
      {selected && (
        <div className="flex items-center gap-2 pr-4 pb-3 pl-[3.25rem]">
          <div className="flex items-center rounded-xl border border-border">
            <button
              type="button"
              aria-label="Remove one"
              disabled={line.quantity <= 1}
              onClick={() => onQuantity(line.quantity - 1)}
              className={cn("flex size-11 items-center justify-center rounded-l-xl disabled:opacity-40", focus)}
            >
              <Minus className="size-4" />
            </button>
            <span aria-live="polite" className="w-8 text-center text-[0.9375rem] font-semibold tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Add one"
              disabled={line.quantity >= MAX_QUANTITY_PER_LINE}
              onClick={() => onQuantity(line.quantity + 1)}
              className={cn("flex size-11 items-center justify-center rounded-r-xl disabled:opacity-40", focus)}
            >
              <Plus className="size-4" />
            </button>
          </div>
          {line.hasOptions && (
            <button type="button" onClick={onOptions} className={cn("h-11 rounded-xl px-3 text-[0.8125rem] font-semibold", focus)}>
              Options
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className={cn("ml-auto h-11 rounded-xl px-3 text-[0.8125rem] font-semibold text-destructive", focus)}
          >
            Remove
          </button>
        </div>
      )}
    </li>
  );
}
