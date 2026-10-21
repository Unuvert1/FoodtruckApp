// If a customer loses the order link, there should still be a way back to it.
// The order they most recently placed is remembered in this browser only, per
// truck, and the storefront shows a "Your order" link until it's finished or old.
//
// The functions take the storage object as an argument so they can be tested
// without a browser, and every call is safe when storage is blocked or full.

export type RecentOrder = { orderId: string; orderNumber: string; placedAt: string };

/** A truck stop lasts hours, not days. After this, the shortcut is just clutter. */
export const RECENT_ORDER_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const FINISHED = new Set(["PICKED_UP", "CANCELLED", "REFUNDED"]);

/** True once there's nothing left to wait for, so the shortcut should go away. */
export function isFinishedStatus(status: string): boolean {
  return FINISHED.has(status);
}

export const recentOrderKey = (truckSlug: string) => `order:v1:${truckSlug}`;

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;
type RemovableStorage = Pick<Storage, "removeItem">;

/** The remembered order, or null when there is none, it can't be trusted, or it is too old. */
export function readRecentOrder(
  storage: ReadableStorage | null | undefined,
  truckSlug: string,
  now: Date = new Date()
): RecentOrder | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(recentOrderKey(truckSlug));
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { orderId, orderNumber, placedAt } = data as Record<string, unknown>;
    if (typeof orderId !== "string" || typeof orderNumber !== "string" || typeof placedAt !== "string") return null;
    if (!orderId || !orderNumber) return null;
    const age = now.getTime() - new Date(placedAt).getTime();
    if (!Number.isFinite(age) || age > RECENT_ORDER_MAX_AGE_MS) return null;
    return { orderId, orderNumber, placedAt };
  } catch {
    return null;
  }
}

/** Returns false when it couldn't be saved (private mode, storage full). */
export function writeRecentOrder(
  storage: WritableStorage | null | undefined,
  truckSlug: string,
  order: RecentOrder
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(recentOrderKey(truckSlug), JSON.stringify(order));
    return true;
  } catch {
    return false;
  }
}

/**
 * Forget the remembered order. With an orderId, only if that is the order
 * remembered, so finishing an old order never wipes a newer one.
 */
export function clearRecentOrder(
  storage: (ReadableStorage & RemovableStorage) | null | undefined,
  truckSlug: string,
  orderId?: string
): void {
  if (!storage) return;
  try {
    if (orderId !== undefined) {
      const raw = storage.getItem(recentOrderKey(truckSlug));
      if (!raw) return;
      const data: unknown = JSON.parse(raw);
      const remembered = typeof data === "object" && data !== null ? (data as Record<string, unknown>).orderId : null;
      if (remembered !== orderId) return;
    }
    storage.removeItem(recentOrderKey(truckSlug));
  } catch {
    // Nothing to do: if storage is blocked there was nothing remembered.
  }
}
