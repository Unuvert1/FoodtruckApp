// The cart holds only IDs and quantities. Names and prices are looked up from
// the menu when displayed, and the server recomputes everything at checkout.

import type { Menu, MenuItem, ModifierOption } from "@/lib/types";
import { unitPriceCents } from "@/lib/money";

export type CartLine = {
  key: string; // item + chosen options, so identical picks merge into one line
  menuItemId: string;
  optionIds: string[];
  quantity: number;
};

export function cartStorageKey(truckSlug: string, serviceId: string): string {
  return `cart:${truckSlug}:${serviceId}`;
}

export function lineKey(menuItemId: string, optionIds: string[]): string {
  return [menuItemId, ...[...optionIds].sort()].join("|");
}

export function findItem(menu: Menu, menuItemId: string): MenuItem | undefined {
  for (const section of menu.sections) {
    const item = section.items.find((i) => i.id === menuItemId);
    if (item) return item;
  }
}

export type ResolvedLine = CartLine & {
  item: MenuItem;
  options: ModifierOption[];
  unitCents: number;
  lineTotalCents: number;
};

/** Attach menu details to a cart line. Returns null if the item no longer exists. */
export function resolveLine(menu: Menu, line: CartLine): ResolvedLine | null {
  const item = findItem(menu, line.menuItemId);
  if (!item) return null;
  const options = item.modifierGroups.flatMap((g) => g.options).filter((o) => line.optionIds.includes(o.id));
  const unitCents = unitPriceCents(item, line.optionIds);
  return { ...line, item, options, unitCents, lineTotalCents: unitCents * line.quantity };
}
