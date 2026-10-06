import { describe, expect, it } from "vitest";
import { applyBps, bpsToPercentInput, centsToInput, parseDollarsToCents, parsePercentToBps } from "@/lib/money";

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

describe("parsePercentToBps", () => {
  it.each([
    ["8.25", 825],
    ["8.25%", 825],
    ["7", 700],
    ["0", 0],
    ["8.5", 850],
    ["0.07", 7],
    [" 10. ", 1000],
    ["20", 2000],
  ])("parses %j as %i bps", (input, bps) => {
    expect(parsePercentToBps(input)).toBe(bps);
  });

  it("avoids the float trap: 8.35 is 835 bps", () => {
    expect(parsePercentToBps("8.35")).toBe(835);
    expect(parsePercentToBps("1.15")).toBe(115);
  });

  it.each(["", "abc", "-1", "8.255", "1e2", ".5", "8.2.5", "1000"])("rejects %j", (input) => {
    expect(parsePercentToBps(input)).toBeNull();
  });
});

describe("bpsToPercentInput", () => {
  it("formats basis points as a percent string", () => {
    expect(bpsToPercentInput(825)).toBe("8.25");
    expect(bpsToPercentInput(850)).toBe("8.5");
    expect(bpsToPercentInput(700)).toBe("7");
    expect(bpsToPercentInput(0)).toBe("0");
    expect(bpsToPercentInput(7)).toBe("0.07");
  });

  it("round-trips with parsePercentToBps", () => {
    for (const bps of [0, 7, 100, 825, 850, 2000]) {
      expect(parsePercentToBps(bpsToPercentInput(bps))).toBe(bps);
    }
  });
});
