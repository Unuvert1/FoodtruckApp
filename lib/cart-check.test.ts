import { describe, expect, it } from "vitest";
import type { ResolvedLine } from "@/lib/cart";
import { joinNames, removedMessage, soldOutReason } from "@/lib/cart-check";

const line = (itemAvailable: boolean, optionAvailable = true): ResolvedLine =>
  ({
    key: "k",
    menuItemId: "i",
    optionIds: ["o"],
    quantity: 1,
    item: { id: "i", name: "Birria tacos", isAvailable: itemAvailable },
    options: [{ id: "o", name: "Flour tortilla", isAvailable: optionAvailable }],
    unitCents: 100,
    lineTotalCents: 100,
  }) as unknown as ResolvedLine;

describe("soldOutReason", () => {
  it("is null when the item and its options are available", () => {
    expect(soldOutReason(line(true))).toBeNull();
  });
  it("flags a sold-out item", () => {
    expect(soldOutReason(line(false))).toBe("Sold out");
  });
  it("names a sold-out option", () => {
    expect(soldOutReason(line(true, false))).toBe("Flour tortilla is sold out");
  });
});

describe("joinNames", () => {
  it("handles none, one, two and three names", () => {
    expect(joinNames([])).toBe("");
    expect(joinNames(["Al pastor"])).toBe("Al pastor");
    expect(joinNames(["Al pastor", "Chips"])).toBe("Al pastor and Chips");
    expect(joinNames(["Al pastor", "Chips", "Rice"])).toBe("Al pastor, Chips and Rice");
  });
  it("lists a repeated name once", () => {
    expect(joinNames(["Chips", "Chips"])).toBe("Chips");
  });
});

describe("removedMessage", () => {
  it("is empty when nothing was removed", () => {
    expect(removedMessage([])).toBe("");
  });
  it("uses the singular for one item", () => {
    expect(removedMessage(["Chips"])).toBe("Chips is no longer on the menu, so we took it out of your order.");
  });
  it("uses the plural for several items", () => {
    expect(removedMessage(["Chips", "Rice"])).toBe("Chips and Rice are no longer on the menu, so we took them out of your order.");
  });
});
