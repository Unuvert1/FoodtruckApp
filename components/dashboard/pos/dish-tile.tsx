"use client";

import { ChevronDown } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

// Written out in full because Tailwind reads source literally; a template
// string would compile to nothing. Position in the grid picks the colour, so a
// dish keeps the same one every service and becomes muscle memory.
const TONES = ["bg-dish-1", "bg-dish-2", "bg-dish-3", "bg-dish-4", "bg-dish-5", "bg-dish-6"];

export type TileSize = "sm" | "md" | "lg";

// Type grows with the key, so a short menu's big keys read from arm's length.
const NAME: Record<TileSize, string> = {
  sm: "line-clamp-3 text-[0.9375rem]",
  md: "line-clamp-3 text-[1.0625rem]",
  lg: "line-clamp-4 text-[1.375rem]",
};
const PRICE: Record<TileSize, string> = { sm: "text-[0.875rem]", md: "text-[1rem]", lg: "text-[1.25rem]" };

type Props = { item: MenuItem; index: number; size: TileSize; onSelect: (item: MenuItem) => void };

/**
 * A key, not a card. The dark bottom edge is the whole trick: it reads as a
 * physical keycap, and pressing it shortens that edge and drops the face by the
 * same 2px, so the key travels without the grid reflowing (border-box plus a
 * grid-assigned size keeps the outer size constant).
 */
export function DishTile({ item, index, size, onSelect }: Props) {
  const soldOut = !item.isAvailable;

  return (
    <button
      type="button"
      disabled={soldOut}
      aria-disabled={soldOut}
      onClick={() => onSelect(item)}
      className={cn(
        "relative flex min-h-0 flex-col justify-between rounded-lg px-3 py-2.5 text-left",
        "border-b-4 border-black/20 outline-none focus-visible:ring-4 focus-visible:ring-foreground/40",
        "transition-[transform,border-width,filter] duration-75 ease-out motion-reduce:transition-none",
        soldOut
          ? "border-black/10 bg-muted"
          : [TONES[index % TONES.length], "hover:brightness-[1.03] active:translate-y-0.5 active:border-b-2 active:brightness-95"]
      )}
    >
      <span
        className={cn(
          "leading-[1.15] font-bold",
          NAME[size],
          soldOut ? "text-muted-foreground line-through" : "text-foreground"
        )}
      >
        {item.name}
      </span>

      <span className="flex items-end justify-between gap-1">
        {!soldOut && item.modifierGroups.length > 0 ? (
          <ChevronDown aria-label="Has options" className="size-4 shrink-0 text-foreground/55" />
        ) : (
          <span />
        )}
        <span
          className={cn(
            "leading-none font-bold tabular-nums",
            PRICE[size],
            soldOut ? "text-muted-foreground" : "text-foreground/80"
          )}
        >
          {soldOut ? "Sold out" : formatCents(item.priceCents)}
        </span>
      </span>
    </button>
  );
}
