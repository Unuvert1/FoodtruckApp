"use client";

import { ChevronDown } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

type Props = { item: MenuItem; onSelect: (item: MenuItem) => void };

export function DishTile({ item, onSelect }: Props) {
  const soldOut = !item.isAvailable;
  return (
    <button
      type="button"
      disabled={soldOut}
      aria-disabled={soldOut}
      onClick={() => onSelect(item)}
      className={cn(
        "flex min-h-20 flex-col justify-between gap-2 rounded-xl p-3 text-left outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 md:min-h-[5.5rem]",
        soldOut ? "bg-muted" : "border border-border bg-surface"
      )}
    >
      <span
        className={cn(
          "line-clamp-2 text-[1.0625rem] leading-[1.15] font-semibold",
          soldOut && "text-muted-foreground line-through"
        )}
      >
        {item.name}
      </span>
      <span className="flex items-center justify-between text-[0.8125rem] text-muted-foreground tabular-nums">
        {soldOut ? <span>Sold out</span> : <span>{formatCents(item.priceCents)}</span>}
        {!soldOut && item.modifierGroups.length > 0 && <ChevronDown aria-label="Has options" className="size-4" />}
      </span>
    </button>
  );
}
