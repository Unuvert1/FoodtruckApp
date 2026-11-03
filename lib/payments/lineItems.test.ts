import { describe, expect, it } from "vitest";
import { buildStripeLineItems } from "@/lib/payments/lineItems";

const line = (over: Partial<Parameters<typeof buildStripeLineItems>[0]["lines"][number]> = {}) => ({
  id: "l1",
  name: "Birria tacos",
  quantity: 1,
  modifiers: [] as string[],
  unitPriceCents: 1350,
  lineTotalCents: 1350,
  voidedAt: null,
  voidedReason: null,
  voidedCents: 0,
  ...over,
});

describe("buildStripeLineItems", () => {
  it("sends each line, then tax and tip, adding up to the total", () => {
    const items = buildStripeLineItems({
      orderNumber: "A07",
      lines: [line({ quantity: 2, lineTotalCents: 2700, modifiers: ["Corn", "Salsa verde"] }), line({ id: "l2", name: "Horchata", lineTotalCents: 400 })],
      taxCents: 155,
      tipCents: 310,
      totalCents: 3565,
    });
    expect(items.map((i) => i.price_data.unit_amount)).toEqual([2700, 400, 155, 310]);
    expect(items[0].price_data.product_data.name).toBe("2 × Birria tacos");
    expect(items[0].price_data.product_data.description).toBe("Corn, Salsa verde");
    expect(items.every((i) => i.quantity === 1 && i.price_data.currency === "usd")).toBe(true);
  });

  it("leaves out zero tax and zero tip", () => {
    const items = buildStripeLineItems({ orderNumber: "A01", lines: [line()], taxCents: 0, tipCents: 0, totalCents: 1350 });
    expect(items).toHaveLength(1);
    expect(items[0].price_data.product_data.description).toBeUndefined();
  });

  it("skips voided lines", () => {
    const items = buildStripeLineItems({
      orderNumber: "A02",
      lines: [line(), line({ id: "l2", voidedAt: "2026-11-02T00:00:00Z", lineTotalCents: 500 })],
      taxCents: 0,
      tipCents: 0,
      totalCents: 1350,
    });
    expect(items).toHaveLength(1);
  });

  it("charges exactly the order total in one line if the pieces don't add up", () => {
    const items = buildStripeLineItems({ orderNumber: "A03", lines: [line()], taxCents: 0, tipCents: 0, totalCents: 1400 });
    expect(items).toHaveLength(1);
    expect(items[0].price_data.unit_amount).toBe(1400);
    expect(items[0].price_data.product_data.name).toBe("Order A03");
  });
});
