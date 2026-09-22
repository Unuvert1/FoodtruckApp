// ★ The single order-creation path. The web checkout calls this today; a future
// SMS or API bot calls the same function with a different `source`.
//
// In one transaction: check the stop is taking orders, price everything from
// the database, take a seat in the pickup slot with a conditional update, and
// write the order + line-item snapshots as PENDING_PAYMENT.

import "server-only";
import { PricingError, priceOrder, type RequestedLine } from "@/lib/pricing";
import {
  getOrderingContext,
  getPricingItems,
  insertOrder,
  nextOrderNumber,
  reserveSlot,
  withTransaction,
} from "@/lib/tenant";

export type CreateOrderInput = {
  truckId: string; // from getTruckFromRequest(), never from the request body
  serviceId: string;
  pickupSlotId: string;
  lines: RequestedLine[];
  tipBps: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  source: "WEB" | "SMS" | "API";
};

export type CreateOrderResult = { ok: true; orderId: string; orderNumber: string } | { ok: false; error: string };

/** A reason the order can't be placed that the customer can act on. */
class OrderError extends Error {}

export async function createOrder(input: CreateOrderInput, now: Date = new Date()): Promise<CreateOrderResult> {
  try {
    return await withTransaction(async (tx) => {
      const ctx = await getOrderingContext(tx, input.truckId, input.serviceId);
      if (!ctx || now < ctx.orderingOpensAt || now > ctx.orderingClosesAt) {
        throw new OrderError("This stop isn't taking online orders right now.");
      }

      const itemIds = [...new Set(input.lines.map((l) => l.menuItemId))];
      const priced = priceOrder({
        items: await getPricingItems(tx, input.truckId, itemIds),
        lines: input.lines,
        taxRateBps: ctx.taxRateBps,
        tipBps: input.tipBps,
        platformFeeBps: ctx.platformFeeBps,
      });

      const reserved = await reserveSlot(tx, input.truckId, input.serviceId, input.pickupSlotId, now);
      if (!reserved) throw new OrderError("That pickup time just filled up. Pick another time.");

      const orderNumber = await nextOrderNumber(tx, input.truckId, input.serviceId);
      const orderId = await insertOrder(tx, input.truckId, {
        serviceId: input.serviceId,
        pickupSlotId: input.pickupSlotId,
        orderNumber,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail ?? null,
        subtotalCents: priced.subtotalCents,
        taxCents: priced.taxCents,
        tipCents: priced.tipCents,
        platformFeeCents: priced.platformFeeCents,
        totalCents: priced.totalCents,
        status: "PENDING_PAYMENT",
        source: input.source,
        placedAt: now,
        lineItems: priced.lines.map((l) => ({
          menuItemId: l.menuItemId,
          nameSnapshot: l.nameSnapshot,
          unitPriceCents: l.unitPriceCents,
          quantity: l.quantity,
          modifiersSnapshot: l.modifiersSnapshot,
          lineTotalCents: l.lineTotalCents,
        })),
      });

      return { ok: true as const, orderId, orderNumber };
    });
  } catch (error) {
    // Throwing inside the transaction rolled back the slot reservation.
    if (error instanceof OrderError || error instanceof PricingError) return { ok: false, error: error.message };
    throw error;
  }
}
