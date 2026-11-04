// Sends a customer to Stripe's hosted payment page for an order that is
// waiting for payment. Used right after the order is placed, and again by the
// "Pay now" button if the customer left Stripe without paying.

import "server-only";
import { headers } from "next/headers";
import { buildStripeLineItems, MIN_CHARGE_CENTS } from "@/lib/payments/lineItems";
import { getStripe } from "@/lib/stripe";
import { cancelUnpaidOrder, getOrderForPayment, setOrderCheckoutSession } from "@/lib/tenant";

// Stripe won't create a session that expires in under 30 minutes. The pickup-slot seat is held until then.
const SESSION_LIFETIME_SECONDS = 31 * 60;

export type PaymentLinkResult = { ok: true; url: string } | { ok: false; error: string };

/** The address the customer is on, so Stripe sends them back to the same place (localhost, a preview, or production). */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function createPaymentLink(input: {
  truckId: string;
  truckSlug: string;
  orderId: string;
  origin: string;
}): Promise<PaymentLinkResult> {
  const found = await getOrderForPayment(input.truckId, input.orderId);
  if (!found) return { ok: false, error: "We can't find that order." };
  const { order } = found;
  if (order.status !== "PENDING_PAYMENT") {
    return { ok: false, error: "This order is already paid or closed." };
  }
  if (order.totalCents < MIN_CHARGE_CENTS) {
    return { ok: false, error: "Orders under $0.50 can't be paid online. Please order something more." };
  }

  const stripe = getStripe();

  // The customer may have left Stripe without paying: reuse their session while it is still open.
  if (found.stripeCheckoutSessionId) {
    const existing = await stripe.checkout.sessions.retrieve(found.stripeCheckoutSessionId);
    if (existing.status === "open" && existing.url) return { ok: true, url: existing.url };
    if (existing.status === "complete") {
      return { ok: false, error: "We've received your payment. This page will update in a moment." };
    }
    // Expired: the hold on the pickup time is over.
    await cancelUnpaidOrder(input.truckId, input.orderId);
    return { ok: false, error: "This order expired before it was paid. Please place it again." };
  }

  const orderUrl = `${input.origin}/${input.truckSlug}/order/${order.id}`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: buildStripeLineItems(order),
    client_reference_id: order.id,
    metadata: { orderId: order.id, truckId: input.truckId },
    payment_intent_data: {
      description: `Order ${order.orderNumber}`,
      metadata: { orderId: order.id, truckId: input.truckId },
    },
    success_url: `${orderUrl}?paid=1`,
    cancel_url: `${orderUrl}?canceled=1`,
    expires_at: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
  });

  if (!session.url || !(await setOrderCheckoutSession(input.truckId, order.id, session.id))) {
    return { ok: false, error: "We couldn't start the payment. Please try again." };
  }
  return { ok: true, url: session.url };
}
