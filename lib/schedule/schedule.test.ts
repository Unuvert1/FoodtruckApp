import { describe, expect, it } from "vitest";
import { resolveOrderingWindow } from "@/lib/schedule/ordering-window";
import { bookedSlotMessage, generateSlots, planSlots, slotSummary, type ExistingSlot } from "@/lib/schedule/slots";

const at = (iso: string) => new Date(iso);
const CHICAGO = "America/Chicago";

describe("generateSlots", () => {
  it("makes one slot per interval and stops before the end", () => {
    const slots = generateSlots(at("2026-10-09T16:00:00Z"), at("2026-10-09T17:00:00Z"), 15, 6);
    expect(slots.map((s) => s.startsAt.toISOString())).toEqual([
      "2026-10-09T16:00:00.000Z",
      "2026-10-09T16:15:00.000Z",
      "2026-10-09T16:30:00.000Z",
      "2026-10-09T16:45:00.000Z",
    ]);
    expect(slots.every((s) => s.capacity === 6)).toBe(true);
  });
});

describe("planSlots", () => {
  const existing: ExistingSlot[] = [
    { id: "a", startsAt: at("2026-10-09T16:00:00Z"), capacity: 6, bookedCount: 0 },
    { id: "b", startsAt: at("2026-10-09T16:15:00Z"), capacity: 6, bookedCount: 2 },
    { id: "c", startsAt: at("2026-10-09T16:30:00Z"), capacity: 6, bookedCount: 0 },
  ];

  it("extending the stop only adds slots", () => {
    const plan = planSlots(existing, generateSlots(at("2026-10-09T16:00:00Z"), at("2026-10-09T17:00:00Z"), 15, 6));
    expect(plan.conflict).toBeNull();
    expect(plan.deleteIds).toEqual([]);
    expect(plan.create.map((s) => s.startsAt.toISOString())).toEqual(["2026-10-09T16:45:00.000Z"]);
  });

  it("deletes empty slots that fall outside the new times", () => {
    const plan = planSlots(existing, generateSlots(at("2026-10-09T16:15:00Z"), at("2026-10-09T16:30:00Z"), 15, 6));
    expect(plan.conflict).toBeNull();
    expect(plan.deleteIds.sort()).toEqual(["a", "c"]);
  });

  it("never deletes a booked slot: it reports a conflict instead", () => {
    // Starting at 16:30 would drop slot b, which has two orders.
    const plan = planSlots(existing, generateSlots(at("2026-10-09T16:30:00Z"), at("2026-10-09T17:00:00Z"), 15, 6));
    expect(plan.conflict).toEqual({ startsAt: at("2026-10-09T16:15:00Z"), bookedCount: 2 });
    expect(plan.deleteIds).not.toContain("b");
  });

  it("a different slot length that orphans a booked slot is also refused", () => {
    const plan = planSlots(existing, generateSlots(at("2026-10-09T16:00:00Z"), at("2026-10-09T17:00:00Z"), 20, 6));
    expect(plan.conflict?.startsAt).toEqual(at("2026-10-09T16:15:00Z"));
  });

  it("lowering capacity never goes below what is booked", () => {
    const plan = planSlots(existing, generateSlots(at("2026-10-09T16:00:00Z"), at("2026-10-09T16:45:00Z"), 15, 1));
    expect(plan.update).toContainEqual({ id: "b", capacity: 2 });
    expect(plan.update).toContainEqual({ id: "a", capacity: 1 });
  });
});

describe("bookedSlotMessage", () => {
  it("names the time in the truck's zone", () => {
    expect(bookedSlotMessage({ startsAt: at("2026-10-09T23:15:00Z"), bookedCount: 2 }, CHICAGO)).toMatch(/^2 orders are already booked for 6:15 pm\./);
    expect(bookedSlotMessage({ startsAt: at("2026-10-09T23:15:00Z"), bookedCount: 1 }, CHICAGO)).toMatch(/^One order is already booked/);
  });
});

describe("slotSummary", () => {
  it("shows the arithmetic", () => {
    expect(slotSummary(at("2026-10-09T13:00:00Z"), at("2026-10-09T15:00:00Z"), 15, 6, CHICAGO)).toBe(
      "Up to 6 orders every 15 minutes: 8 pickup times between 8:00 am and 10:00 am."
    );
  });
});

describe("resolveOrderingWindow", () => {
  const startsAt = at("2026-10-09T16:00:00Z");
  const endsAt = at("2026-10-09T19:00:00Z");
  const now = at("2026-10-08T00:00:00Z");

  it("opens N hours before the start and closes N minutes before the end", () => {
    const result = resolveOrderingWindow({ startsAt, endsAt, opensHoursBefore: 24, closesMinutesBefore: 15, now });
    expect(result).toEqual({ opensAt: at("2026-10-08T16:00:00Z"), closesAt: at("2026-10-09T18:45:00Z") });
  });

  it("0 hours means right away, and an already-open stop keeps its opening time", () => {
    const fresh = resolveOrderingWindow({ startsAt, endsAt, opensHoursBefore: 0, closesMinutesBefore: 15, now });
    expect(fresh).toMatchObject({ opensAt: now });
    const earlier = at("2026-10-07T00:00:00Z");
    const edited = resolveOrderingWindow({ startsAt, endsAt, opensHoursBefore: 0, closesMinutesBefore: 15, now, existingOpensAt: earlier });
    expect(edited).toMatchObject({ opensAt: earlier });
  });

  it("refuses a window that closes before the stop starts", () => {
    expect(resolveOrderingWindow({ startsAt, endsAt, opensHoursBefore: 24, closesMinutesBefore: 240, now })).toHaveProperty("error");
  });
});
