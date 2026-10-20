"use client";

import type { MenuItem } from "@/lib/types";
import { DishTile, type TileSize } from "@/components/dashboard/pos/dish-tile";

type Props = { items: MenuItem[]; onSelect: (item: MenuItem) => void };

// Density follows the item count, then the viewport. Written out in full for
// the same reason as TONES. Rows share the free height (1fr) down to a
// comfortable floor, so a few dishes become big keys and a long list tightens
// up until the floor, and only then scrolls.
const TIERS: { upTo: number; size: TileSize; grid: string }[] = [
  // Capped height so three keys don't become three towers on a wide screen.
  { upTo: 4, size: "lg", grid: "grid-cols-2 auto-rows-[minmax(8rem,1fr)] lg:max-h-[34rem]" },
  { upTo: 6, size: "lg", grid: "grid-cols-2 auto-rows-[minmax(7rem,1fr)] sm:grid-cols-3 lg:max-h-[38rem]" },
  { upTo: 12, size: "md", grid: "grid-cols-3 auto-rows-[minmax(6rem,1fr)] sm:grid-cols-4" },
  { upTo: 20, size: "sm", grid: "grid-cols-3 auto-rows-[minmax(5.5rem,1fr)] sm:grid-cols-4 xl:grid-cols-5" },
  { upTo: Infinity, size: "sm", grid: "grid-cols-3 auto-rows-[minmax(5rem,1fr)] sm:grid-cols-5 xl:grid-cols-6" },
];

// Sold-out tiles keep their place: the grid never reflows.
export function DishGrid({ items, onSelect }: Props) {
  const tier = TIERS.find((t) => items.length <= t.upTo) ?? TIERS[TIERS.length - 1];

  return (
    <div className={`grid min-h-full gap-1.5 p-3 pt-1 ${tier.grid}`}>
      {items.map((item, index) => (
        <DishTile key={item.id} item={item} index={index} size={tier.size} onSelect={onSelect} />
      ))}
    </div>
  );
}
