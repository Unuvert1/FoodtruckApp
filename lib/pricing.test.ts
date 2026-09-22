import { describe, expect, it } from "vitest";
import { PricingError, priceOrder, type PricingItem } from "@/lib/pricing";

const birria: PricingItem = {
  id: "birria",
  name: "Birria tacos",
  priceCents: 1350,
  isAvailable: true,
  archivedAt: null,
  modifierGroups: [
    {
      id: "tortilla",
      name: "Tortilla",
      minSelect: 1,
      maxSelect: 1,
      required: true,
      options: [
        { id: "corn", name: "Corn", priceDeltaCents: 0, isAvailable: true },
        { id: "flour", name: "Flour", priceDeltaCents: 0, isAvailable: false },
      ],
    },
    {
      id: "extras",
      name: "Extras",
      minSelect: 0,
      maxSelect: 2,
      required: false,
      options: [
        { id: "consome", name: "Cup of consommé", priceDeltaCents: 200, isAvailable: true },
        { id: "queso", name: "Melted queso", priceDeltaCents: 150, isAvailable: true },
        { id: "onion", name: "Extra onion", priceDeltaCents: 0, isAvailable: true },
      ],
    },
  ],
};

const elote: PricingItem = {
  id: "elote",
  name: "Elote",
  priceCents: 500,
  isAvailable: true,
  archivedAt: null,
  modifierGroups: [],
};

const base = { items: [birria, elote], taxRateBps: 1025, tipBps: 1500, platformFeeBps: 250 };

describe("priceOrder", () => {
  it("prices lines from the menu, with modifiers, tax, tip, and platform fee", () => {
    const result = priceOrder({
      ...base,
      lines: [
        { menuItemId: "birria", optionIds: ["corn", "consome"], quantity: 2 },
        { menuItemId: "elote", optionIds: [], quantity: 1 },
      ],
    });

    expect(result.lines[0]).toMatchObject({ unitPriceCents: 1550, lineTotalCents: 3100, nameSnapshot: "Birria tacos" });
    expect(result.lines[0].modifiersSnapshot).toEqual([
      { group: "Tortilla", name: "Corn", priceDeltaCents: 0 },
      { group: "Extras", name: "Cup of consommé", priceDeltaCents: 200 },
    ]);
    expect(result.subtotalCents).toBe(3600);
    expect(result.taxCents).toBe(369); // 10.25% of 3600 = 369
    expect(result.tipCents).toBe(540);
    expect(result.platformFeeCents).toBe(90);
    expect(result.totalCents).toBe(3600 + 369 + 540);
  });

  it("rounds tax and tip to whole cents", () => {
    // 10.25% of $40.50 = 415.125¢ → 415¢; 15% of $40.50 = 607.5¢ → 608¢
    const result = priceOrder({
      ...base,
      items: [{ ...elote, priceCents: 4050 }],
      lines: [{ menuItemId: "elote", optionIds: [], quantity: 1 }],
    });
    expect(result.taxCents).toBe(415);
    expect(result.tipCents).toBe(608);
    expect(result.totalCents).toBe(4050 + 415 + 608);
  });

  it("ignores any price the client might have sent: only IDs and quantities matter", () => {
    const line = { menuItemId: "elote", optionIds: [], quantity: 3, priceCents: 1 } as never;
    expect(priceOrder({ ...base, lines: [line] }).subtotalCents).toBe(1500);
  });

  it("rejects an option ID that belongs to a different item (forged)", () => {
    expect(() =>
      priceOrder({ ...base, lines: [{ menuItemId: "elote", optionIds: ["consome"], quantity: 1 }] })
    ).toThrow(PricingError);
  });

  it("rejects a missing required choice", () => {
    expect(() => priceOrder({ ...base, lines: [{ menuItemId: "birria", optionIds: [], quantity: 1 }] })).toThrow(
      /Choose a tortilla/
    );
  });

  it("rejects too many choices in a group", () => {
    expect(() =>
      priceOrder({
        ...base,
        lines: [{ menuItemId: "birria", optionIds: ["corn", "consome", "queso", "onion"], quantity: 1 }],
      })
    ).toThrow(/at most 2/);
  });

  it("rejects sold-out items, sold-out options, and archived items", () => {
    expect(() =>
      priceOrder({ ...base, items: [{ ...elote, isAvailable: false }], lines: [{ menuItemId: "elote", optionIds: [], quantity: 1 }] })
    ).toThrow(/sold out/);
    expect(() => priceOrder({ ...base, lines: [{ menuItemId: "birria", optionIds: ["flour"], quantity: 1 }] })).toThrow(
      /sold out/
    );
    expect(() =>
      priceOrder({
        ...base,
        items: [{ ...elote, archivedAt: new Date() }],
        lines: [{ menuItemId: "elote", optionIds: [], quantity: 1 }],
      })
    ).toThrow(/no longer on the menu/);
  });

  it("rejects bad quantities, duplicate options, empty orders, and silly tips", () => {
    for (const quantity of [0, -1, 1.5, 21]) {
      expect(() => priceOrder({ ...base, lines: [{ menuItemId: "elote", optionIds: [], quantity }] })).toThrow(PricingError);
    }
    expect(() =>
      priceOrder({ ...base, lines: [{ menuItemId: "birria", optionIds: ["corn", "corn"], quantity: 1 }] })
    ).toThrow(PricingError);
    expect(() => priceOrder({ ...base, lines: [] })).toThrow(/empty/);
    expect(() =>
      priceOrder({ ...base, tipBps: 9000, lines: [{ menuItemId: "elote", optionIds: [], quantity: 1 }] })
    ).toThrow(/tip/);
  });
});
