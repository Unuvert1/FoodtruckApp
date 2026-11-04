// ★ The single order-creation path. The web checkout calls this today; a future
// SMS or API bot calls the same function with a different `source`.
//
// Two shapes of order come through here:
//
//   A web order, in one transaction: check the stop is taking orders, price
//   everything from the database, take a seat in the pickup slot with a
//   conditional update, and write the order as PENDING_PAYMENT.
//
//   A counter sale, rung up at the window: no stop, so no ordering window and
//   no slot to reserve, and the food is already in the customer's hands by the
//   time it is recorded — so it is written PICKED_UP. Everything else, above
//   all the pricing, is the same code.

import "server-only";
import { PricingError, priceOrder, type RequestedLine } from "@/lib/pricing";
import {
  getCounterPricingContext,
  getOrderingContext,
  getPricingItems,
  insertOrder,
  nextCounterOrderNumber,
  nextOrderNumber,
  reserveSlot,
  withTransaction,
} from "@/lib/tenant";
import type { TenderType } from "@/lib/types";

type OrderBase = {
  truckId: string; // from getTruckFromRequest(), never from the request body
  lines: RequestedLine[];
  customerName: string;
};

export type CreateOrderInput =
  | (OrderBase & {
      source: "WEB" | "SMS" | "API";
      serviceId: string;
      pickupSlotId: string;
      tipBps: number;
      customerPhone: string;
      customerEmail?: string | null;
    })
  | (OrderBase & {
      source: "COUNTER";
      tender: TenderType;
    });

export type CreateOrderResult = { ok: true; orderId: string; orderNumber: string } | { ok: false; error: string };

/** A reason the order can't be placed that the customer can act on. */
class OrderError extends Error {}

export async function createOrder(input: CreateOrderInput, now: Date = new Date()): Promise<CreateOrderResult> {
  try {
    return await withTransaction(async (tx) => {
      const itemIds = [...new Set(input.lines.map((l) => l.menuItemId))];

      if (input.source === "COUNTER") {
        const truck = await getCounterPricingContext(tx, input.truckId);
        if (!truck) throw new OrderError("This truck isn't taking sales right now.");

        const priced = priceOrder({
          items: await getPricingItems(tx, input.truckId, itemIds),
          lines: input.lines,
          taxRateBps: truck.taxRateBps,
          tipBps: 0, // nobody tips a till through this screen
          platformFeeBps: truck.platformFeeBps,
        });

        const orderNumber = await nextCounterOrderNumber(tx, input.truckId);
        const orderId = await insertOrder(tx, input.truckId, {
          serviceId: null,
          pickupSlotId: null,
          orderNumber,
          customerName: input.customerName,
          customerPhone: null,
          customerEmail: null,
          ...totalsOf(priced),
          // Handed over before it was recorded, so it starts at the end of the
          // status flow rather than walking through it.
          status: "PICKED_UP",
          source: "COUNTER",
          tender: input.tender,
          placedAt: now,
          pickedUpAt: now,
          lineItems: lineItemsOf(priced),
        });

        return { ok: true as const, orderId, orderNumber };
      }

      const ctx = await getOrderingContext(tx, input.truckId, input.serviceId);
      if (!ctx || now < ctx.orderingOpensAt || now > ctx.orderingClosesAt) {
        throw new OrderError("This stop isn't taking online orders right now.");
      }

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
        ...totalsOf(priced),
        status: "PENDING_PAYMENT",
        source: input.source,
        placedAt: now,
        lineItems: lineItemsOf(priced),
      });

      return { ok: true as const, orderId, orderNumber };
    });
  } catch (error) {
    // Throwing inside the transaction rolled back the slot reservation.
    if (error instanceof OrderError || error instanceof PricingError) return { ok: false, error: error.message };
    throw error;
  }
}

type Priced = ReturnType<typeof priceOrder>;

const totalsOf = (priced: Priced) => ({
  subtotalCents: priced.subtotalCents,
  taxCents: priced.taxCents,
  tipCents: priced.tipCents,
  platformFeeCents: priced.platformFeeCents,
  totalCents: priced.totalCents,
});

const lineItemsOf = (priced: Priced) =>
  priced.lines.map((l) => ({
    menuItemId: l.menuItemId,
    nameSnapshot: l.nameSnapshot,
    unitPriceCents: l.unitPriceCents,
    quantity: l.quantity,
    modifiersSnapshot: l.modifiersSnapshot,
    lineTotalCents: l.lineTotalCents,
  }));
