"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

// Written out in full because Tailwind reads source literally; a template
// string would compile to nothing. Position in the grid picks the colour, so a
// dish keeps the same one every service and becomes muscle memory.
const TONES = ["bg-dish-1", "bg-dish-2", "bg-dish-3", "bg-dish-4", "bg-dish-5", "bg-dish-6"];

type Props = { item: MenuItem; index: number; onSelect: (item: MenuItem) => void };

export function DishTile({ item, index, onSelect }: Props) {
  const soldOut = !item.isAvailable;
  const [bumped, setBumped] = useState(false);

  useEffect(() => {
    if (!bumped) return;
    const timer = setTimeout(() => setBumped(false), 320);
    return () => clearTimeout(timer);
  }, [bumped]);

  return (
    <button
      type="button"
      disabled={soldOut}
      aria-disabled={soldOut}
      onClick={() => {
        setBumped(true);
        onSelect(item);
      }}
      className={cn(
        "relative flex min-h-[4.25rem] flex-col justify-between gap-1 overflow-hidden rounded-xl px-2.5 py-2 text-left",
        "outline-none transition-transform duration-100 ease-out focus-visible:ring-4 focus-visible:ring-foreground/30",
        // The press itself has to feel like something: the tile gives, then
        // settles. Without this a tap reads as nothing happening.
        "motion-safe:active:scale-[0.96] motion-reduce:transition-none",
        soldOut ? "bg-muted" : TONES[index % TONES.length],
        bumped && "motion-safe:ring-2 motion-safe:ring-foreground/40"
      )}
    >
      <span
        className={cn(
          "line-clamp-2 text-[0.9375rem] leading-[1.2] font-semibold",
          soldOut && "text-muted-foreground line-through"
        )}
      >
        {item.name}
      </span>
      <span className="flex items-center justify-between text-[0.8125rem] font-medium text-foreground/70 tabular-nums">
        {soldOut ? <span>Sold out</span> : <span>{formatCents(item.priceCents)}</span>}
        {!soldOut && item.modifierGroups.length > 0 && <ChevronDown aria-label="Has options" className="size-3.5" />}
      </span>

      {/* Confirms the tap landed, on the tile the thumb is already on. */}
      {bumped && !soldOut && (
        <span
          aria-hidden
          className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-foreground text-background motion-reduce:hidden"
        >
          <Plus className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
