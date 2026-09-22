import { describe, expect, it } from "vitest";
import { applyBps, centsToInput, parseDollarsToCents } from "@/lib/money";

describe("parseDollarsToCents", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12.50", 1250],
    ["$12.50", 1250],
    ["  4.05 ", 405],
    ["0.10", 10],
    ["1,250.00", 125000],
    ["12.", 1200],
  ])("parses %j as %i cents", (input, cents) => {
    expect(parseDollarsToCents(input)).toBe(cents);
  });

  it("avoids the float trap: 0.29 is 29 cents, not 28.999…", () => {
    expect(parseDollarsToCents("0.29")).toBe(29);
    expect(parseDollarsToCents("19.99")).toBe(1999);
  });

  it.each(["", "abc", "-5", "12.555", "1e3", ".50", "12.5.0"])("rejects %j", (input) => {
    expect(parseDollarsToCents(input)).toBeNull();
  });
});

describe("centsToInput", () => {
  it("round-trips with parseDollarsToCents", () => {
    for (const cents of [0, 5, 99, 100, 1250, 1999]) {
      expect(parseDollarsToCents(centsToInput(cents))).toBe(cents);
    }
  });
});

describe("applyBps", () => {
  it("applies basis points in integer cents", () => {
    expect(applyBps(10000, 250)).toBe(250);
    expect(applyBps(4050, 1025)).toBe(415);
  });
});
