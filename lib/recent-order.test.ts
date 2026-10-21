import { describe, expect, it } from "vitest";
import {
  RECENT_ORDER_MAX_AGE_MS,
  clearRecentOrder,
  isFinishedStatus,
  readRecentOrder,
  recentOrderKey,
  writeRecentOrder,
} from "@/lib/recent-order";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

const blocked = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

const now = new Date("2026-10-21T18:00:00.000Z");
const order = { orderId: "o1", orderNumber: "A07", placedAt: "2026-10-21T17:30:00.000Z" };

describe("recent order", () => {
  it("remembers an order and reads it back", () => {
    const storage = fakeStorage();
    expect(writeRecentOrder(storage, "demo", order)).toBe(true);
    expect(readRecentOrder(storage, "demo", now)).toEqual(order);
  });

  it("keeps a separate order for each truck", () => {
    const storage = fakeStorage();
    writeRecentOrder(storage, "demo", order);
    expect(readRecentOrder(storage, "other-truck", now)).toBeNull();
  });

  it("forgets an order that is too old", () => {
    const storage = fakeStorage();
    writeRecentOrder(storage, "demo", { ...order, placedAt: new Date(now.getTime() - RECENT_ORDER_MAX_AGE_MS - 1000).toISOString() });
    expect(readRecentOrder(storage, "demo", now)).toBeNull();
  });

  it("returns null for damaged or incomplete data", () => {
    expect(readRecentOrder(fakeStorage({ [recentOrderKey("demo")]: "{nope" }), "demo", now)).toBeNull();
    expect(readRecentOrder(fakeStorage({ [recentOrderKey("demo")]: '{"orderId":"o1"}' }), "demo", now)).toBeNull();
    expect(
      readRecentOrder(fakeStorage({ [recentOrderKey("demo")]: JSON.stringify({ ...order, placedAt: "not a date" }) }), "demo", now)
    ).toBeNull();
  });

  it("clears the remembered order", () => {
    const storage = fakeStorage();
    writeRecentOrder(storage, "demo", order);
    clearRecentOrder(storage, "demo");
    expect(readRecentOrder(storage, "demo", now)).toBeNull();
  });

  it("clears only the order it is told about", () => {
    const storage = fakeStorage();
    writeRecentOrder(storage, "demo", order);
    clearRecentOrder(storage, "demo", "an-older-order");
    expect(readRecentOrder(storage, "demo", now)).toEqual(order);
    clearRecentOrder(storage, "demo", "o1");
    expect(readRecentOrder(storage, "demo", now)).toBeNull();
  });

  it("does not throw when storage is blocked or missing", () => {
    expect(writeRecentOrder(blocked, "demo", order)).toBe(false);
    expect(readRecentOrder(blocked, "demo", now)).toBeNull();
    expect(() => clearRecentOrder(blocked, "demo")).not.toThrow();
    expect(writeRecentOrder(null, "demo", order)).toBe(false);
    expect(readRecentOrder(null, "demo", now)).toBeNull();
    expect(() => clearRecentOrder(undefined, "demo", "o1")).not.toThrow();
  });
});

describe("isFinishedStatus", () => {
  it("is true once there is nothing left to wait for", () => {
    for (const s of ["PICKED_UP", "CANCELLED", "REFUNDED"]) expect(isFinishedStatus(s)).toBe(true);
  });
  it("is false while the order is active", () => {
    for (const s of ["PENDING_PAYMENT", "PAID", "PREPARING", "READY", "ACCEPTED"]) expect(isFinishedStatus(s)).toBe(false);
  });
});
