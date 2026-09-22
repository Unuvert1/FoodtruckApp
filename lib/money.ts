// Integer-cents math and formatting. Pure functions with no database access, so
// the client can use them to *display* an estimate. The authoritative totals
// are always recomputed on the server in lib/pricing.ts (Stream C).

import type { MenuItem } from "@/lib/types";

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** Apply a basis-point rate to an amount, rounding half up to the cent. */
export function applyBps(amountCents: number, bps: number): number {
  return Math.round((amountCents * bps) / 10_000);
}

export function unitPriceCents(item: MenuItem, optionIds: string[]): number {
  let cents = item.priceCents;
  for (const group of item.modifierGroups) {
    for (const option of group.options) {
      if (optionIds.includes(option.id)) cents += option.priceDeltaCents;
    }
  }
  return cents;
}

export function orderTotals(subtotalCents: number, taxRateBps: number, tipCents: number) {
  const taxCents = applyBps(subtotalCents, taxRateBps);
  return {
    subtotalCents,
    taxCents,
    tipCents,
    totalCents: subtotalCents + taxCents + tipCents,
  };
}
