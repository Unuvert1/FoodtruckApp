"use server";

import { z } from "zod";
import { createPaymentLink, requestOrigin } from "@/lib/payments/startPayment";
import { paymentsEnabled } from "@/lib/stripe";
import { getTruckFromRequest } from "@/lib/tenant";

const schema = z.object({ truckSlug: z.string().min(1).max(100), orderId: z.string().min(1).max(50) });

export type PayForOrderResult = { ok: true; url: string } | { ok: false; error: string };

/** The "Pay now" button on an order that is still waiting for payment. */
export async function payForOrder(input: z.input<typeof schema>): Promise<PayForOrderResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "We can't find that order." };
  if (!paymentsEnabled()) return { ok: false, error: "Online payment isn't turned on yet." };

  const truck = await getTruckFromRequest(parsed.data.truckSlug);
  if (!truck) return { ok: false, error: "We can't find that order." };

  try {
    return await createPaymentLink({ truckId: truck.id, truckSlug: truck.slug, orderId: parsed.data.orderId, origin: await requestOrigin() });
  } catch (error) {
    console.error("[stripe] couldn't start checkout", error);
    return { ok: false, error: "We couldn't reach the payment page. Please try again." };
  }
}
