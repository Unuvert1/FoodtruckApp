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

/**
 * Parse what a vendor types into a price field ("12", "12.5", "$12.50") into
 * integer cents, using string math so there is no float rounding.
 * Returns null for anything that isn't a plain amount with at most 2 decimals.
 */
export function parseDollarsToCents(input: string): number | null {
  const match = input.trim().replace(/^\$/, "").replace(/,/g, "").match(/^(\d{1,6})(?:\.(\d{0,2}))?$/);
  if (!match) return null;
  const [, dollars, fraction = ""] = match;
  return Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Cents → the plain string an input field shows, e.g. 1250 → "12.50". */
export function centsToInput(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
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
