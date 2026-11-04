// Turning a Stripe webhook into order changes. Kept free of database and
// "server-only" imports: the route passes the real functions in, and the
// tests pass fakes.

import type Stripe from "stripe";

/** Returns the event only if Stripe really sent it. Anything else is null. */
export function verifyStripeEvent(
  stripe: Pick<Stripe, "webhooks">,
  body: string,
  signature: string | null,
  secret: string
): Stripe.Event | null {
  if (!signature) return null;
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return null;
  }
}

export type PaymentDeps = {
  /** True if this event still needs processing (new, or seen before but never finished). */
  claimEvent(eventId: string, type: string): Promise<boolean>;
  finishEvent(eventId: string): Promise<void>;
  getOrder(
    truckId: string,
    orderId: string
  ): Promise<{ status: string; totalCents: number; stripeCheckoutSessionId: string | null } | null>;
  markPaid(truckId: string, orderId: string, paymentIntentId: string | null): Promise<void>;
  cancelUnpaid(truckId: string, orderId: string): Promise<boolean>;
};

export type EventOutcome = "paid" | "cancelled" | "duplicate" | "ignored" | "rejected";

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
}

export async function processStripeEvent(event: Stripe.Event, deps: PaymentDeps): Promise<EventOutcome> {
  if (!(await deps.claimEvent(event.id, event.type))) return "duplicate";

  const outcome = await handle(event, deps);
  // Not reached if handle() throws: the event stays unfinished and Stripe's retry processes it again.
  await deps.finishEvent(event.id);
  return outcome;
}

async function handle(event: Stripe.Event, deps: PaymentDeps): Promise<EventOutcome> {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.expired"
  ) {
    return "ignored";
  }

  const session = event.data.object;
  const orderId = session.metadata?.orderId;
  const truckId = session.metadata?.truckId;
  if (!orderId || !truckId) return "ignored"; // not one of our checkouts

  if (event.type === "checkout.session.expired") {
    // The customer never paid: give their pickup-slot seat back.
    return (await deps.cancelUnpaid(truckId, orderId)) ? "cancelled" : "ignored";
  }

  // A completed session isn't always a paid one (some payment methods settle later).
  if (session.payment_status !== "paid") return "ignored";

  const order = await deps.getOrder(truckId, orderId);
  if (!order) return "ignored";

  // Only accept the exact session we created, for exactly the amount we recorded.
  if (order.stripeCheckoutSessionId !== session.id || session.amount_total !== order.totalCents) {
    console.error("[stripe] payment doesn't match the order; not marking it paid", {
      orderId,
      sessionId: session.id,
      expectedCents: order.totalCents,
      paidCents: session.amount_total,
    });
    return "rejected";
  }

  if (order.status !== "PENDING_PAYMENT") {
    // Already paid (a repeat), or cancelled before the payment landed. A cancelled
    // order that was paid needs a manual refund from the Stripe dashboard.
    if (order.status === "CANCELLED") {
      console.error("[stripe] payment received for a cancelled order; refund it in Stripe", { orderId, sessionId: session.id });
    }
    return "ignored";
  }

  await deps.markPaid(truckId, orderId, paymentIntentId(session));
  return "paid";
}
