// The kitchen's side of Order.status: PAID → ACCEPTED → PREPARING → READY → PICKED_UP.
// Shared by the dashboard UI (button labels) and the Server Action (which enforces it).

import type { OrderStatus } from "@/lib/types";

export type AdvanceableStatus = "PAID" | "ACCEPTED" | "PREPARING" | "READY";

export const NEXT_STATUS: Record<AdvanceableStatus, OrderStatus> = {
  PAID: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "PICKED_UP",
};

export function isAdvanceable(status: OrderStatus): status is AdvanceableStatus {
  return status in NEXT_STATUS;
}

/** The button that moves an order out of this status. */
export const ADVANCE_LABEL: Record<AdvanceableStatus, string> = {
  PAID: "Accept",
  ACCEPTED: "Start preparing",
  PREPARING: "Mark ready",
  READY: "Picked up",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "New",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  PICKED_UP: "Picked up",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

/** Orders still on the kitchen's plate. */
export const ACTIVE_STATUSES: OrderStatus[] = ["PAID", "ACCEPTED", "PREPARING", "READY"];
