// What the customer sees on Stripe's payment page. Pure, so it can be tested.
//
// Every amount comes from the order row (prices were fixed when the order was
// placed), never from the browser. Stripe line items need whole-cent unit
// amounts, so each order line goes across as one item for its full line total.

import type { OrderView } from "@/lib/types";

export type StripeLineItem = {
  quantity: 1;
  price_data: {
    currency: "usd";
    unit_amount: number;
    product_data: { name: string; description?: string };
  };
};

/** Stripe refuses to charge less than 50 cents. */
export const MIN_CHARGE_CENTS = 50;

type PayableOrder = Pick<OrderView, "orderNumber" | "lines" | "taxCents" | "tipCents" | "totalCents">;

function item(name: string, cents: number, description?: string): StripeLineItem {
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: cents,
      product_data: { name: name.slice(0, 200), ...(description ? { description: description.slice(0, 400) } : {}) },
    },
  };
}

/**
 * Itemised lines plus tax and tip. If they don't add up to the order total
 * (they always should), fall back to one line for the whole order, so the
 * customer is never charged a different amount from the one we recorded.
 */
export function buildStripeLineItems(order: PayableOrder): StripeLineItem[] {
  const items: StripeLineItem[] = [];

  for (const line of order.lines) {
    if (line.voidedAt || line.lineTotalCents <= 0) continue;
    const name = line.quantity > 1 ? `${line.quantity} × ${line.name}` : line.name;
    items.push(item(name, line.lineTotalCents, line.modifiers.join(", ") || undefined));
  }
  if (order.taxCents > 0) items.push(item("Tax", order.taxCents));
  if (order.tipCents > 0) items.push(item("Tip", order.tipCents));

  const sum = items.reduce((total, i) => total + i.price_data.unit_amount, 0);
  if (items.length === 0 || sum !== order.totalCents) {
    return [item(`Order ${order.orderNumber}`, order.totalCents)];
  }
  return items;
}
