import { beforeEach, describe, expect, it, vi } from "vitest";

const tenant = vi.hoisted(() => ({
  withTransaction: vi.fn(),
  getServiceForEdit: vi.fn(),
  serviceHasOrders: vi.fn(),
  getServiceSlots: vi.fn(),
  getDefaultMenuIdForTruck: vi.fn(),
  createServiceWithSlots: vi.fn(),
  updateServiceTimes: vi.fn(),
  replaceServiceSlots: vi.fn(),
  touchLocationUsed: vi.fn(),
}));
vi.mock("@/lib/tenant", () => tenant);

import { saveService, type SaveServiceInput } from "@/lib/schedule/saveService";

const at = (iso: string) => new Date(iso);
const CHICAGO = "America/Chicago";
const tx = {};

const base: SaveServiceInput = {
  truckId: "truck1",
  timeZone: CHICAGO,
  locationId: "loc1",
  startsAt: at("2026-10-09T16:00:00Z"),
  endsAt: at("2026-10-09T17:00:00Z"),
  opensHoursBefore: 24,
  closesMinutesBefore: 15,
  slotMinutes: 15,
  ordersPerSlot: 6,
  publicNote: "",
  publish: true,
  now: at("2026-10-08T00:00:00Z"),
};

/** A saved stop with 16:00 to 17:00 slots; the 16:15 one (b) has two orders. */
function existingStop(overrides: { status?: string; locationId?: string } = {}) {
  tenant.getServiceForEdit.mockResolvedValue({
    service: {
      id: "svc1",
      locationId: overrides.locationId ?? "loc1",
      status: overrides.status ?? "PUBLISHED",
      orderingOpensAt: "2026-10-08T16:00:00.000Z",
    },
    orderCount: 0,
  });
  tenant.getServiceSlots.mockResolvedValue([
    { id: "a", startsAt: at("2026-10-09T16:00:00Z"), capacity: 6, bookedCount: 0 },
    { id: "b", startsAt: at("2026-10-09T16:15:00Z"), capacity: 6, bookedCount: 2 },
    { id: "c", startsAt: at("2026-10-09T16:30:00Z"), capacity: 6, bookedCount: 0 },
    { id: "d", startsAt: at("2026-10-09T16:45:00Z"), capacity: 6, bookedCount: 0 },
  ]);
}

const edit: SaveServiceInput = { ...base, serviceId: "svc1" };

beforeEach(() => {
  vi.resetAllMocks();
  tenant.withTransaction.mockImplementation((fn: (t: unknown) => unknown) => fn(tx));
  tenant.touchLocationUsed.mockResolvedValue(true);
  tenant.getDefaultMenuIdForTruck.mockResolvedValue("menu1");
  tenant.createServiceWithSlots.mockResolvedValue("new1");
  tenant.updateServiceTimes.mockResolvedValue(true);
  tenant.replaceServiceSlots.mockResolvedValue({ ok: true });
  tenant.serviceHasOrders.mockResolvedValue(false);
});

describe("saveService: booked slots", () => {
  it("refuses the whole save when the new times would drop a booked slot", async () => {
    existingStop();
    // Starting at 16:30 drops slot b (two orders). Slot a is empty and would be deleted by a partial plan.
    const result = await saveService({ ...edit, startsAt: at("2026-10-09T16:30:00Z") });

    expect(result).toEqual({
      ok: false,
      field: "slots",
      error: expect.stringMatching(/^2 orders are already booked for 11:15 am\./),
    });
    expect(tenant.replaceServiceSlots).not.toHaveBeenCalled();
    expect(tenant.updateServiceTimes).not.toHaveBeenCalled();
    expect(tenant.createServiceWithSlots).not.toHaveBeenCalled();
  });

  it("refuses a slot length that orphans a booked slot", async () => {
    existingStop();
    const result = await saveService({ ...edit, slotMinutes: 20 });
    expect(result).toMatchObject({ ok: false, field: "slots" });
    expect(tenant.replaceServiceSlots).not.toHaveBeenCalled();
  });

  it("deletes empty slots outside the new times and keeps the booked ones", async () => {
    existingStop();
    // 16:15 to 16:45 keeps b (booked) and c, drops a and d (empty).
    const result = await saveService({ ...edit, startsAt: at("2026-10-09T16:15:00Z"), endsAt: at("2026-10-09T16:45:00Z") });

    expect(result).toEqual({ ok: true, serviceId: "svc1" });
    const plan = tenant.replaceServiceSlots.mock.calls[0][3];
    expect(plan.conflict).toBeNull();
    expect(plan.deleteIds.sort()).toEqual(["a", "d"]);
  });

  it("extending the end time only adds slots", async () => {
    existingStop();
    const result = await saveService({ ...edit, endsAt: at("2026-10-09T17:30:00Z") });

    expect(result).toEqual({ ok: true, serviceId: "svc1" });
    const plan = tenant.replaceServiceSlots.mock.calls[0][3];
    expect(plan.deleteIds).toEqual([]);
    expect(plan.create.map((s: { startsAt: Date }) => s.startsAt.toISOString())).toEqual([
      "2026-10-09T17:00:00.000Z",
      "2026-10-09T17:15:00.000Z",
    ]);
  });

  it("fails the save when a slot was booked between the plan and the delete", async () => {
    existingStop();
    tenant.replaceServiceSlots.mockResolvedValue({ ok: false });
    const result = await saveService({ ...edit, startsAt: at("2026-10-09T16:15:00Z") });
    expect(result).toMatchObject({ ok: false, field: "slots" });
  });
});

describe("saveService: editing", () => {
  it("never changes the location of a stop that has orders", async () => {
    existingStop();
    tenant.serviceHasOrders.mockResolvedValue(true);
    const result = await saveService({ ...edit, locationId: "loc2" });

    expect(result).toMatchObject({ ok: false, field: "place" });
    expect(tenant.updateServiceTimes).not.toHaveBeenCalled();
    expect(tenant.replaceServiceSlots).not.toHaveBeenCalled();
  });

  it("lets an order-free stop move to another spot", async () => {
    existingStop();
    const result = await saveService({ ...edit, locationId: "loc2" });
    expect(result).toEqual({ ok: true, serviceId: "svc1" });
    expect(tenant.touchLocationUsed).toHaveBeenCalledWith(tx, "truck1", "loc2");
  });

  it("does not look for orders when the location is unchanged", async () => {
    existingStop();
    await saveService(edit);
    expect(tenant.serviceHasOrders).not.toHaveBeenCalled();
    expect(tenant.touchLocationUsed).not.toHaveBeenCalled();
  });

  it("refuses to edit a cancelled stop", async () => {
    existingStop({ status: "CANCELLED" });
    expect(await saveService(edit)).toMatchObject({ ok: false });
    expect(tenant.updateServiceTimes).not.toHaveBeenCalled();
  });

  it("refuses a stop that is not this truck's", async () => {
    tenant.getServiceForEdit.mockResolvedValue(null);
    expect(await saveService(edit)).toMatchObject({ ok: false });
    expect(tenant.getServiceForEdit).toHaveBeenCalledWith("truck1", "svc1", tx);
  });

  it("keeps a published stop published, and keeps when ordering opened", async () => {
    existingStop();
    await saveService({ ...edit, opensHoursBefore: 0, now: at("2026-10-08T20:00:00Z") });
    const data = tenant.updateServiceTimes.mock.calls[0][3];
    expect(data.status).toBe("PUBLISHED");
    expect(data.orderingOpensAt).toEqual(at("2026-10-08T16:00:00.000Z"));
  });
});

describe("saveService: creating", () => {
  it("creates a draft or a published stop with generated slots", async () => {
    await saveService({ ...base, publish: false });
    const [, truckId, data, slots] = tenant.createServiceWithSlots.mock.calls[0];
    expect(truckId).toBe("truck1");
    expect(data).toMatchObject({ locationId: "loc1", menuId: "menu1", status: "DRAFT", slotMinutes: 15 });
    expect(slots).toHaveLength(4);

    await saveService(base);
    expect(tenant.createServiceWithSlots.mock.calls[1][2].status).toBe("PUBLISHED");
  });

  it("never passes an order count: a new stop starts its own order numbers", async () => {
    await saveService(base);
    expect(tenant.createServiceWithSlots.mock.calls[0][2]).not.toHaveProperty("orderCount");
  });

  it("refuses a spot that is not this truck's", async () => {
    tenant.touchLocationUsed.mockResolvedValue(false);
    expect(await saveService(base)).toMatchObject({ ok: false, field: "place" });
    expect(tenant.createServiceWithSlots).not.toHaveBeenCalled();
  });

  it("needs a menu", async () => {
    tenant.getDefaultMenuIdForTruck.mockResolvedValue(null);
    expect(await saveService(base)).toMatchObject({ ok: false });
    expect(tenant.createServiceWithSlots).not.toHaveBeenCalled();
  });

  it("refuses a stop that has already ended", async () => {
    const result = await saveService({ ...base, now: at("2026-10-09T18:00:00Z") });
    expect(result).toMatchObject({ ok: false, field: "date" });
  });

  it("refuses more pickup times than a stop can hold", async () => {
    // 5-minute slots over 26 hours = 312.
    const result = await saveService({ ...base, slotMinutes: 5, endsAt: at("2026-10-10T18:00:00Z") });
    expect(result).toMatchObject({ ok: false, field: "slots" });
    expect(tenant.createServiceWithSlots).not.toHaveBeenCalled();
  });

  it("allows exactly the maximum", async () => {
    // 5-minute slots over 25 hours = 300.
    const result = await saveService({ ...base, slotMinutes: 5, endsAt: at("2026-10-10T17:00:00Z") });
    expect(result).toMatchObject({ ok: true });
    expect(tenant.createServiceWithSlots.mock.calls[0][3]).toHaveLength(300);
  });

  it("surfaces an ordering window that closes before it opens", async () => {
    const result = await saveService({ ...base, closesMinutesBefore: 240 });
    expect(result).toMatchObject({ ok: false });
    expect(tenant.createServiceWithSlots).not.toHaveBeenCalled();
  });
});
