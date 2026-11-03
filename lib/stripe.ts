// The one Stripe client. Created on first use, not at import time, so a build
// without the key (or a page that never takes payment) doesn't fail.

import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * True when STRIPE_SECRET_KEY is set. Without it (local development, a first
 * deploy before the keys are added), orders are marked paid straight away and
 * nobody is charged, as before.
 */
export function paymentsEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}
