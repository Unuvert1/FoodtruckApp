// Stripe tells us here that a payment went through (or that a checkout expired).
// This, not the customer's browser coming back, is what marks an order paid.

import { markOrderPaid } from "@/lib/orders/markOrderPaid";
import { processStripeEvent, verifyStripeEvent } from "@/lib/payments/stripeEvents";
import { getStripe, paymentsEnabled } from "@/lib/stripe";
import { cancelUnpaidOrder, claimWebhookEvent, finishWebhookEvent, getOrderForPayment } from "@/lib/tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!paymentsEnabled() || !secret) return new Response("Stripe isn't configured.", { status: 503 });

  // The signature is checked against the raw body, so read it as text, not JSON.
  const body = await request.text();
  const event = verifyStripeEvent(getStripe(), body, request.headers.get("stripe-signature"), secret);
  if (!event) return new Response("Invalid signature.", { status: 400 });

  try {
    const outcome = await processStripeEvent(event, {
      claimEvent: claimWebhookEvent,
      finishEvent: finishWebhookEvent,
      getOrder: async (truckId, orderId) => {
        const found = await getOrderForPayment(truckId, orderId);
        return found
          ? { status: found.order.status, totalCents: found.order.totalCents, stripeCheckoutSessionId: found.stripeCheckoutSessionId }
          : null;
      },
      markPaid: markOrderPaid,
      cancelUnpaid: cancelUnpaidOrder,
    });
    return Response.json({ received: true, outcome });
  } catch (error) {
    // A 500 makes Stripe retry later, and the event wasn't marked finished.
    console.error("[stripe] webhook failed", error);
    return new Response("Webhook handler failed.", { status: 500 });
  }
}
