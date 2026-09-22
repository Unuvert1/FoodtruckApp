"use server";

import { z } from "zod";
import { getTruckFromRequest } from "@/lib/tenant";
import { createOrder } from "@/lib/orders/createOrder";
import { markOrderPaid } from "@/lib/orders/markOrderPaid";
import { MAX_QUANTITY_PER_LINE, MAX_TIP_BPS } from "@/lib/pricing";

// Only IDs, quantities, and the customer's details come from the browser.
// Every price is recomputed in lib/pricing.ts.
const placeOrderSchema = z.object({
  truckSlug: z.string().min(1).max(100),
  serviceId: z.string().min(1).max(50),
  pickupSlotId: z.string().min(1).max(50),
  tipBps: z.number().int().min(0).max(MAX_TIP_BPS),
  customerName: z.string().trim().min(1, "Enter a name for the order.").max(60),
  customerPhone: z
    .string()
    .trim()
    .max(30)
    .refine((p) => p.replace(/\D/g, "").length >= 10, "Enter a phone number with area code."),
  lines: z
    .array(
      z.object({
        menuItemId: z.string().min(1).max(50),
        optionIds: z.array(z.string().min(1).max(50)).max(20),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
      })
    )
    .min(1, "Your order is empty.")
    .max(50),
});

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

export async function placeOrder(input: z.input<typeof placeOrderSchema>): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your order and try again." };
  const { truckSlug, ...order } = parsed.data;

  const truck = await getTruckFromRequest(truckSlug);
  if (!truck) return { ok: false, error: "This truck doesn't exist." };

  const result = await createOrder({ ...order, truckId: truck.id, source: "WEB" });
  if (!result.ok) return result;

  // TODO(Stream C): redirect to Stripe Checkout here instead. The Stripe
  // webhook then calls markOrderPaid. For now the order is treated as paid.
  await markOrderPaid(truck.id, result.orderId);

  return { ok: true, orderId: result.orderId };
}
