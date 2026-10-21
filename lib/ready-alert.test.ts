import { describe, expect, it } from "vitest";
import { awaitingReady, becameReady, notificationPermission, readyTitle } from "@/lib/ready-alert";

describe("becameReady", () => {
  it("is true when the status moves to READY while the page is open", () => {
    expect(becameReady("PREPARING", "READY")).toBe(true);
    expect(becameReady("PAID", "READY")).toBe(true);
  });
  it("is false when the page loads already READY, or stays READY", () => {
    expect(becameReady(null, "READY")).toBe(false);
    expect(becameReady("READY", "READY")).toBe(false);
  });
  it("is false for any other change", () => {
    expect(becameReady("PAID", "PREPARING")).toBe(false);
    expect(becameReady("READY", "PICKED_UP")).toBe(false);
  });
});

describe("readyTitle", () => {
  it("puts the order number first so it survives a narrow tab", () => {
    expect(readyTitle("A07", "Ranger Truck")).toBe("Order A07 is ready · Ranger Truck");
  });
});

describe("awaitingReady", () => {
  it("is true while the order is still being made", () => {
    for (const s of ["PENDING_PAYMENT", "PAID", "ACCEPTED", "PREPARING"]) expect(awaitingReady(s)).toBe(true);
  });
  it("is false once it is ready or finished", () => {
    for (const s of ["READY", "PICKED_UP", "CANCELLED", "REFUNDED"]) expect(awaitingReady(s)).toBe(false);
  });
});

describe("notificationPermission", () => {
  it("passes through the browser's answer", () => {
    expect(notificationPermission({ Notification: { permission: "granted" } })).toBe("granted");
    expect(notificationPermission({ Notification: { permission: "denied" } })).toBe("denied");
    expect(notificationPermission({ Notification: { permission: "default" } })).toBe("default");
  });
  it("is unsupported where there is no Notification API", () => {
    expect(notificationPermission({})).toBe("unsupported");
  });
  it("is unsupported when reading it throws", () => {
    const hostile = {
      get Notification(): { permission: string } {
        throw new Error("blocked");
      },
    };
    expect(notificationPermission(hostile)).toBe("unsupported");
  });
});
