// What happens once an order is paid: mark it PAID and tell the vendor.
//
// The Stripe webhook (checkout.session.completed) calls this once the payment
// has really gone through. When Stripe isn't configured (local development),
// the checkout Server Action calls it right after createOrder instead.

import "server-only";
import { sendNewOrderEmail } from "@/lib/email";
import { getOrderNotification, setOrderPaid } from "@/lib/tenant";

export async function markOrderPaid(truckId: string, orderId: string, paymentIntentId?: string | null): Promise<void> {
  const changed = await setOrderPaid(truckId, orderId, paymentIntentId);
  if (!changed) return; // already paid: Stripe retries webhooks, so this must be safe to repeat

  const notification = await getOrderNotification(truckId, orderId);
  if (!notification) return;

  // A failed email must never fail the order.
  try {
    await sendNewOrderEmail(notification);
  } catch (error) {
    console.error("[email] new-order email failed", error);
  }
}
