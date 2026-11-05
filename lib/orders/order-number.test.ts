import { describe, expect, it } from "vitest";
import { formatCounterNumber, formatOrderNumber } from "@/lib/orders/order-number";

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

describe("formatCounterNumber", () => {
  it("counts from one", () => {
    expect(formatCounterNumber(1)).toBe("C-1");
    expect(formatCounterNumber(2)).toBe("C-2");
    expect(formatCounterNumber(140)).toBe("C-140");
  });

  it("never collides with a service order number", () => {
    // formatOrderNumber reaches the C block at the 199th order of a stop.
    const service = Array.from({ length: 400 }, (_, i) => formatOrderNumber(i + 1));
    const counter = Array.from({ length: 400 }, (_, i) => formatCounterNumber(i + 1));
    expect(service.some((s) => counter.includes(s))).toBe(false);
  });
});
