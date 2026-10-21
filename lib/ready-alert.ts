// Pure helpers for the "your order is ready" alert, kept out of the component so they can be tested.

import { isFinishedStatus } from "@/lib/recent-order";

/** True only when the status moves to READY while the page is open, not when it loads already READY. */
export function becameReady(previous: string | null, next: string): boolean {
  return previous !== null && previous !== "READY" && next === "READY";
}

/** The text for the browser tab, so a customer in another tab can see their order is ready. */
export function readyTitle(orderNumber: string, truckName: string): string {
  return `Order ${orderNumber} is ready · ${truckName}`;
}

/** Statuses where an alert is still useful: the order is placed, and it isn't ready or finished yet. */
export function awaitingReady(status: string): boolean {
  return status !== "READY" && !isFinishedStatus(status);
}

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

/** The browser's notification permission, or "unsupported" where notifications don't exist (some phones). */
export function notificationPermission(
  source: { Notification?: { permission: string } } = globalThis as { Notification?: { permission: string } }
): NotificationPermissionState {
  try {
    const permission = source.Notification?.permission;
    return permission === "granted" || permission === "denied" || permission === "default" ? permission : "unsupported";
  } catch {
    return "unsupported";
  }
}
