import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const tenant = vi.hoisted(() => ({
  withTransaction: vi.fn(),
  getOrderingContext: vi.fn(),
  getCounterPricingContext: vi.fn(),
  getPricingItems: vi.fn(),
  reserveSlot: vi.fn(),
  nextOrderNumber: vi.fn(),
  nextCounterOrderNumber: vi.fn(),
  insertOrder: vi.fn(),
}));
vi.mock("@/lib/tenant", () => tenant);

import { createOrder } from "@/lib/orders/createOrder";

const at = (iso: string) => new Date(iso);
const NOW = at("2026-11-04T18:00:00Z");
const tx = {};

/** One $6.00 taco, no modifiers. */
const TACO = {
  id: "item1",
  name: "Taco",
  priceCents: 600,
  isAvailable: true,
  archivedAt: null,
  modifierGroups: [],
};

const lines = [{ menuItemId: "item1", optionIds: [], quantity: 2 }];

/** The arguments insertOrder was called with, which is what actually hits the database. */
const written = () => tenant.insertOrder.mock.calls[0][2];

beforeEach(() => {
  vi.resetAllMocks();
  tenant.withTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx));
  tenant.getPricingItems.mockResolvedValue([TACO]);
  tenant.insertOrder.mockResolvedValue("order1");
  tenant.nextOrderNumber.mockResolvedValue("A01");
  tenant.nextCounterOrderNumber.mockResolvedValue("C-1");
  tenant.reserveSlot.mockResolvedValue(true);
  tenant.getCounterPricingContext.mockResolvedValue({ taxRateBps: 800, platformFeeBps: 250 });
  tenant.getOrderingContext.mockResolvedValue({
    orderingOpensAt: at("2026-11-04T00:00:00Z"),
    orderingClosesAt: at("2026-11-04T23:00:00Z"),
    taxRateBps: 800,
    platformFeeBps: 250,
  });
});

const counterSale = {
  truckId: "truck1",
  source: "COUNTER",
  lines,
  tender: "CASH",
  customerName: "Counter sale",
} as const;

const webOrder = {
  truckId: "truck1",
  source: "WEB",
  serviceId: "svc1",
  pickupSlotId: "slot1",
  lines,
  tipBps: 0,
  customerName: "Sam",
  customerPhone: "+15551234567",
} as const;

describe("createOrder, counter sale", () => {
  it("writes it already picked up, with no stop, slot or phone", async () => {
    const result = await createOrder(counterSale, NOW);

    expect(result).toEqual({ ok: true, orderId: "order1", orderNumber: "C-1" });
    expect(written()).toMatchObject({
      serviceId: null,
      pickupSlotId: null,
      customerPhone: null,
      status: "PICKED_UP",
      source: "COUNTER",
      tender: "CASH",
      pickedUpAt: NOW,
      orderNumber: "C-1",
    });
  });

  it("never reserves a pickup slot", async () => {
    await createOrder(counterSale, NOW);
    expect(tenant.reserveSlot).not.toHaveBeenCalled();
    expect(tenant.getOrderingContext).not.toHaveBeenCalled();
  });

  it("prices through the same path as a web order, with no tip", async () => {
    await createOrder(counterSale, NOW);
    // 2 x $6.00 = $12.00, 8% tax = $0.96.
    expect(written()).toMatchObject({ subtotalCents: 1200, taxCents: 96, tipCents: 0, totalCents: 1296 });
  });

  it("refuses when the truck is gone or archived", async () => {
    tenant.getCounterPricingContext.mockResolvedValue(null);
    const result = await createOrder(counterSale, NOW);
    expect(result).toEqual({ ok: false, error: "This truck isn't taking sales right now." });
    expect(tenant.insertOrder).not.toHaveBeenCalled();
  });

  it("surfaces a pricing problem rather than throwing", async () => {
    tenant.getPricingItems.mockResolvedValue([{ ...TACO, isAvailable: false }]);
    const result = await createOrder(counterSale, NOW);
    expect(result.ok).toBe(false);
    expect(tenant.insertOrder).not.toHaveBeenCalled();
  });
});

describe("createOrder, web order", () => {
  it("still reserves a slot and starts unpaid", async () => {
    const result = await createOrder(webOrder, NOW);

    expect(result).toEqual({ ok: true, orderId: "order1", orderNumber: "A01" });
    expect(tenant.reserveSlot).toHaveBeenCalledWith(tx, "truck1", "svc1", "slot1", NOW);
    expect(written()).toMatchObject({
      serviceId: "svc1",
      pickupSlotId: "slot1",
      status: "PENDING_PAYMENT",
      source: "WEB",
      orderNumber: "A01",
    });
  });

  it("carries no tender: Stripe handled the payment", async () => {
    await createOrder(webOrder, NOW);
    expect(written().tender).toBeUndefined();
  });

  it("is refused outside the ordering window", async () => {
    tenant.getOrderingContext.mockResolvedValue({
      orderingOpensAt: at("2026-11-05T00:00:00Z"),
      orderingClosesAt: at("2026-11-05T23:00:00Z"),
      taxRateBps: 800,
      platformFeeBps: 250,
    });
    const result = await createOrder(webOrder, NOW);
    expect(result).toEqual({ ok: false, error: "This stop isn't taking online orders right now." });
    expect(tenant.insertOrder).not.toHaveBeenCalled();
  });

  it("is refused when the slot filled up first", async () => {
    tenant.reserveSlot.mockResolvedValue(false);
    const result = await createOrder(webOrder, NOW);
    expect(result).toEqual({ ok: false, error: "That pickup time just filled up. Pick another time." });
    expect(tenant.insertOrder).not.toHaveBeenCalled();
  });
});
