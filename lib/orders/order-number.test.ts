import { describe, expect, it } from "vitest";
import { formatOrderNumber } from "@/lib/orders/order-number";

describe("formatOrderNumber", () => {
  it("counts A01…A99, then moves to the next letter", () => {
    expect(formatOrderNumber(1)).toBe("A01");
    expect(formatOrderNumber(47)).toBe("A47");
    expect(formatOrderNumber(99)).toBe("A99");
    expect(formatOrderNumber(100)).toBe("B01");
  });

  it("skips I and O", () => {
    expect(formatOrderNumber(8 * 99 + 1)).toBe("J01"); // H → J
  });
});
