"use client";

import { ChevronDown } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

// Written out in full because Tailwind reads source literally; a template
// string would compile to nothing. Position in the grid picks the colour, so a
// dish keeps the same one every service and becomes muscle memory.
const TONES = ["bg-dish-1", "bg-dish-2", "bg-dish-3", "bg-dish-4", "bg-dish-5", "bg-dish-6"];

type Props = { item: MenuItem; index: number; onSelect: (item: MenuItem) => void };

/**
 * A key, not a card. The dark bottom edge is the whole trick: it reads as a
 * physical keycap, and pressing it shortens that edge and drops the face by the
 * same 2px, so the key travels without the grid reflowing (border-box plus a
 * fixed aspect ratio keeps the outer size constant).
 */
export function DishTile({ item, index, onSelect }: Props) {
  const soldOut = !item.isAvailable;

  return (
    <button
      type="button"
      disabled={soldOut}
      aria-disabled={soldOut}
      onClick={() => onSelect(item)}
      className={cn(
        "relative flex aspect-5/4 flex-col justify-between rounded-lg px-2.5 py-2 text-left",
        "border-b-4 border-black/20 outline-none focus-visible:ring-4 focus-visible:ring-foreground/40",
        "transition-[transform,border-width] duration-75 ease-out motion-reduce:transition-none",
        soldOut
          ? "border-black/10 bg-muted"
          : [TONES[index % TONES.length], "active:translate-y-0.5 active:border-b-2 hover:brightness-[1.03]"]
      )}
    >
      <span
        className={cn(
          "line-clamp-3 text-[0.9375rem] leading-[1.15] font-bold",
          soldOut ? "text-muted-foreground line-through" : "text-foreground"
        )}
      >
        {item.name}
      </span>

      <span className="flex items-end justify-between gap-1">
        {!soldOut && item.modifierGroups.length > 0 ? (
          <ChevronDown aria-label="Has options" className="size-3.5 shrink-0 text-foreground/55" />
        ) : (
          <span />
        )}
        <span
          className={cn(
            "text-[0.875rem] leading-none font-bold tabular-nums",
            soldOut ? "text-muted-foreground" : "text-foreground/80"
          )}
        >
          {soldOut ? "Sold out" : formatCents(item.priceCents)}
        </span>
      </span>
    </button>
  );
}
