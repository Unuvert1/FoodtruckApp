// Checks on a saved cart against the menu as it is right now. The cart can be
// hours old: the truck may have taken an item off the menu or sold out since.

import type { ResolvedLine } from "@/lib/cart";

/** Why a line can't be ordered right now, or null if it can. Names what to remove. */
export function soldOutReason(line: ResolvedLine): string | null {
  if (!line.item.isAvailable) return "Sold out";
  const option = line.options.find((o) => !o.isAvailable);
  return option ? `${option.name} is sold out` : null;
}

/** "Al pastor", "Al pastor and Chips", "Al pastor, Chips and Rice". Repeats are listed once. */
export function joinNames(names: string[]): string {
  const unique = [...new Set(names)];
  if (unique.length <= 1) return unique[0] ?? "";
  return `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}`;
}

/** The notice shown after items that are no longer on the menu were taken out of the order. */
export function removedMessage(names: string[]): string {
  const unique = [...new Set(names)];
  if (unique.length === 0) return "";
  const subject = joinNames(unique);
  return unique.length === 1
    ? `${subject} is no longer on the menu, so we took it out of your order.`
    : `${subject} are no longer on the menu, so we took them out of your order.`;
}
