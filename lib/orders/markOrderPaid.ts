// What happens once an order is paid: mark it PAID and tell the vendor.
//
// TODO(Stream C): the Stripe webhook (checkout.session.completed) calls this.
// Until then, the checkout Server Action calls it right after createOrder,
// so orders are "paid" without a real payment.

import "server-only";
import { sendNewOrderEmail } from "@/lib/email";
import { getOrderNotification, setOrderPaid } from "@/lib/tenant";

export async function markOrderPaid(truckId: string, orderId: string): Promise<void> {
  const changed = await setOrderPaid(truckId, orderId);
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
