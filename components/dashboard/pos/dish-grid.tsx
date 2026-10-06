"use client";

import type { MenuItem } from "@/lib/types";
import { DishTile } from "@/components/dashboard/pos/dish-tile";

type Props = { items: MenuItem[]; onSelect: (item: MenuItem) => void };

// Sold-out tiles keep their place: the grid never reflows.
export function DishGrid({ items, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4 pt-1 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <DishTile key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}
