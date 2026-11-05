// The one Stripe client. Created on first use, not at import time, so a build
// without the key (or a page that never takes payment) doesn't fail.

import "server-only";
import Stripe from "stripe";
import type { PaymentsMode } from "@/lib/types";

let client: Stripe | null = null;

/**
 * True when STRIPE_SECRET_KEY is set. Without it (local development, a first
 * deploy before the keys are added), orders are marked paid straight away and
 * nobody is charged, as before.
 */
export function paymentsEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/**
 * Which Stripe keys this server is running on. Read from the key prefix, so a
 * test key can never be reported as live. Never returns the key itself.
 */
export function paymentsMode(): PaymentsMode {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return "off";
  return key.startsWith("sk_live_") ? "live" : "test";
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}
