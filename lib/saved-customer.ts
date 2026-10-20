// A returning customer shouldn't retype their name and phone for every order.
// Both are kept in this browser only (never sent anywhere until an order is
// placed) and the customer can clear them from checkout.
//
// The functions take the storage object as an argument so they can be tested
// without a browser, and every call is safe when storage is blocked or full.

export type SavedCustomer = { name: string; phone: string };

export const SAVED_CUSTOMER_KEY = "customer:v1";

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;
type RemovableStorage = Pick<Storage, "removeItem">;

const MAX_LENGTH = 100;

/** The saved details, or null when there are none or they can't be trusted. */
export function readSavedCustomer(storage: ReadableStorage | null | undefined): SavedCustomer | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SAVED_CUSTOMER_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { name, phone } = data as Record<string, unknown>;
    if (typeof name !== "string" || typeof phone !== "string") return null;
    const clean = { name: name.trim().slice(0, MAX_LENGTH), phone: phone.trim().slice(0, MAX_LENGTH) };
    return clean.name || clean.phone ? clean : null;
  } catch {
    return null;
  }
}

/** Returns false when the details couldn't be saved (private mode, storage full). */
export function writeSavedCustomer(storage: WritableStorage | null | undefined, customer: SavedCustomer): boolean {
  if (!storage) return false;
  try {
    const value: SavedCustomer = {
      name: customer.name.trim().slice(0, MAX_LENGTH),
      phone: customer.phone.trim().slice(0, MAX_LENGTH),
    };
    storage.setItem(SAVED_CUSTOMER_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearSavedCustomer(storage: RemovableStorage | null | undefined): void {
  try {
    storage?.removeItem(SAVED_CUSTOMER_KEY);
  } catch {
    // Nothing to do: if storage is blocked there was nothing saved.
  }
}

/** The browser's storage, or null where it is blocked (some private modes throw on access). */
export function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
