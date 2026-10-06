"use client";

import type { MenuItem } from "@/lib/types";
import { DishTile } from "@/components/dashboard/pos/dish-tile";

type Props = { items: MenuItem[]; onSelect: (item: MenuItem) => void };

// Sold-out tiles keep their place: the grid never reflows.
export function DishGrid({ items, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-1 p-3 pt-1 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item, index) => (
        <DishTile key={item.id} item={item} index={index} onSelect={onSelect} />
      ))}
    </div>
  );
}
