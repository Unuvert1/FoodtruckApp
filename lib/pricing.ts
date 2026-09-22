// Server-side order pricing. The browser only sends item IDs, option IDs, and
// quantities; every price, total, and fee is recomputed here from menu rows
// loaded from the database. Pure function (no DB access) so it's easy to test.

import { applyBps } from "@/lib/money";

export type PricingOption = {
  id: string;
  name: string;
  priceDeltaCents: number;
  isAvailable: boolean;
};

export type PricingGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: PricingOption[];
};

export type PricingItem = {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
  archivedAt: Date | null;
  modifierGroups: PricingGroup[];
};

export type RequestedLine = {
  menuItemId: string;
  optionIds: string[];
  quantity: number;
};

export type ModifierSnapshot = { group: string; name: string; priceDeltaCents: number };

export type PricedLine = {
  menuItemId: string;
  nameSnapshot: string;
  unitPriceCents: number;
  quantity: number;
  modifiersSnapshot: ModifierSnapshot[];
  lineTotalCents: number;
};

export type PricedOrder = {
  lines: PricedLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  platformFeeCents: number; // our cut, taken from the truck's payout, not added to the customer's total
  totalCents: number;
};

/** A problem the customer can fix (sold-out item, bad choice). The message is safe to show. */
export class PricingError extends Error {}

export const MAX_QUANTITY_PER_LINE = 20;
export const MAX_TIP_BPS = 5000; // 50%

export function priceOrder(input: {
  items: PricingItem[];
  lines: RequestedLine[];
  taxRateBps: number;
  tipBps: number;
  platformFeeBps: number;
}): PricedOrder {
  const { items, lines, taxRateBps, tipBps, platformFeeBps } = input;

  if (lines.length === 0) throw new PricingError("Your order is empty.");
  if (!Number.isInteger(tipBps) || tipBps < 0 || tipBps > MAX_TIP_BPS) {
    throw new PricingError("That tip amount isn't allowed.");
  }

  const byId = new Map(items.map((item) => [item.id, item]));

  const priced = lines.map((line): PricedLine => {
    const item = byId.get(line.menuItemId);
    if (!item || item.archivedAt) throw new PricingError("An item in your order is no longer on the menu.");
    if (!item.isAvailable) throw new PricingError(`${item.name} just sold out. Remove it to continue.`);
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY_PER_LINE) {
      throw new PricingError(`Choose between 1 and ${MAX_QUANTITY_PER_LINE} of ${item.name}.`);
    }

    const chosen = new Set(line.optionIds);
    if (chosen.size !== line.optionIds.length) throw new PricingError(`Check your choices for ${item.name}.`);

    let unitPriceCents = item.priceCents;
    const modifiersSnapshot: ModifierSnapshot[] = [];
    let matched = 0;

    for (const group of item.modifierGroups) {
      const picks = group.options.filter((o) => chosen.has(o.id));
      matched += picks.length;

      const min = group.required ? Math.max(1, group.minSelect) : group.minSelect;
      if (picks.length < min) throw new PricingError(`Choose a ${group.name.toLowerCase()} for ${item.name}.`);
      if (picks.length > group.maxSelect) {
        throw new PricingError(`Choose at most ${group.maxSelect} ${group.name.toLowerCase()} for ${item.name}.`);
      }

      for (const option of picks) {
        if (!option.isAvailable) throw new PricingError(`${option.name} just sold out. Pick another option.`);
        unitPriceCents += option.priceDeltaCents;
        modifiersSnapshot.push({ group: group.name, name: option.name, priceDeltaCents: option.priceDeltaCents });
      }
    }

    // Any option ID that didn't belong to this item's groups is forged or stale.
    if (matched !== chosen.size) throw new PricingError(`Check your choices for ${item.name}.`);

    return {
      menuItemId: item.id,
      nameSnapshot: item.name,
      unitPriceCents,
      quantity: line.quantity,
      modifiersSnapshot,
      lineTotalCents: unitPriceCents * line.quantity,
    };
  });

  const subtotalCents = priced.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const taxCents = applyBps(subtotalCents, taxRateBps);
  const tipCents = applyBps(subtotalCents, tipBps);

  return {
    lines: priced,
    subtotalCents,
    taxCents,
    tipCents,
    platformFeeCents: applyBps(subtotalCents, platformFeeBps),
    totalCents: subtotalCents + taxCents + tipCents,
  };
}
