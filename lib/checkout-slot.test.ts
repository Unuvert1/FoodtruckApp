import { describe, expect, it } from "vitest";
import { resolveSlotChoice } from "@/lib/checkout-slot";
import type { PickupSlot } from "@/lib/types";

const slot = (id: string, startsAt: string): PickupSlot => ({
  id,
  serviceId: "svc",
  startsAt,
  capacity: 4,
  bookedCount: 0,
});

const noon = slot("a", "2026-10-21T17:00:00.000Z");
const quarterPast = slot("b", "2026-10-21T17:15:00.000Z");
const halfPast = slot("c", "2026-10-21T17:30:00.000Z");

describe("resolveSlotChoice", () => {
  it("picks the earliest slot when nothing is chosen yet", () => {
    expect(resolveSlotChoice([noon, quarterPast, halfPast], null)).toEqual({ slot: noon, replaced: null });
  });

  it("keeps the customer's own choice while it is still bookable", () => {
    expect(resolveSlotChoice([noon, quarterPast, halfPast], halfPast)).toEqual({ slot: halfPast, replaced: null });
  });

  it("uses the fresh copy of the chosen slot, so counts stay current", () => {
    const fresh = { ...quarterPast, bookedCount: 3 };
    expect(resolveSlotChoice([noon, fresh], quarterPast).slot).toBe(fresh);
  });

  it("moves to the earliest slot and says which one was lost when the choice fills up", () => {
    expect(resolveSlotChoice([noon, halfPast], quarterPast)).toEqual({ slot: noon, replaced: quarterPast });
  });

  it("returns no slot when none are left, and still reports the lost choice", () => {
    expect(resolveSlotChoice([], null)).toEqual({ slot: null, replaced: null });
    expect(resolveSlotChoice([], noon)).toEqual({ slot: null, replaced: noon });
  });
});
