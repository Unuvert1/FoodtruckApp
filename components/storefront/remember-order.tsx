"use client";

import { useEffect } from "react";
import { browserStorage } from "@/lib/saved-customer";
import { clearRecentOrder, isFinishedStatus, writeRecentOrder } from "@/lib/recent-order";

/**
 * Renders nothing. While a customer is looking at an active order, remember it in this
 * browser so the storefront can offer a way back. Once it's picked up or cancelled,
 * forget it.
 */
export function RememberOrder({
  truckSlug,
  orderId,
  orderNumber,
  status,
  placedAt,
}: {
  truckSlug: string;
  orderId: string;
  orderNumber: string;
  status: string;
  placedAt: string;
}) {
  useEffect(() => {
    const storage = browserStorage();
    if (isFinishedStatus(status)) clearRecentOrder(storage, truckSlug, orderId);
    else writeRecentOrder(storage, truckSlug, { orderId, orderNumber, placedAt });
  }, [truckSlug, orderId, orderNumber, status, placedAt]);

  return null;
}
