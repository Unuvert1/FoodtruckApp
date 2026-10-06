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

/**
 * Parse a percentage a vendor types ("8.25", "8.25%", "7") into basis points
 * (825, 825, 700) with string math, so there is no float rounding. At most two
 * decimals, since a basis point is 0.01%. Returns null for anything else.
 */
export function parsePercentToBps(input: string): number | null {
  const match = input.trim().replace(/%$/, "").trim().match(/^(\d{1,3})(?:\.(\d{0,2}))?$/);
  if (!match) return null;
  const [, whole, fraction = ""] = match;
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Basis points → the plain string a percent input shows, e.g. 825 → "8.25", 700 → "7". */
export function bpsToPercentInput(bps: number): string {
  const whole = Math.floor(bps / 100);
  const fraction = String(bps % 100).padStart(2, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}
