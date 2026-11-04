import { describe, expect, it } from "vitest";
import { addDaysToDateKey, toZonedDateInput, toZonedTimeInput, zonedDayRange, zonedTimeFromParts } from "@/lib/time";

const CHICAGO = "America/Chicago";

describe("zonedTimeFromParts", () => {
  it("converts Chicago wall-clock time in daylight time (UTC-5)", () => {
    expect(zonedTimeFromParts(CHICAGO, "2026-07-10", "11:00").toISOString()).toBe("2026-07-10T16:00:00.000Z");
  });

  it("converts Chicago wall-clock time in standard time (UTC-6)", () => {
    expect(zonedTimeFromParts(CHICAGO, "2026-12-10", "11:00").toISOString()).toBe("2026-12-10T17:00:00.000Z");
  });

  it("is right on the day the clocks change", () => {
    // US spring forward 2026-03-08: 11:00 is already daylight time.
    expect(zonedTimeFromParts(CHICAGO, "2026-03-08", "11:00").toISOString()).toBe("2026-03-08T16:00:00.000Z");
    // US fall back 2026-11-01: 11:00 is standard time.
    expect(zonedTimeFromParts(CHICAGO, "2026-11-01", "11:00").toISOString()).toBe("2026-11-01T17:00:00.000Z");
  });

  it("round-trips through the form-value helpers", () => {
    for (const [date, time] of [["2026-10-09", "07:45"], ["2027-01-02", "22:15"], ["2026-03-08", "13:00"]]) {
      const at = zonedTimeFromParts("America/Los_Angeles", date, time);
      expect(toZonedDateInput(at, "America/Los_Angeles")).toBe(date);
      expect(toZonedTimeInput(at, "America/Los_Angeles")).toBe(time);
    }
  });

  it("notices a date that does not exist", () => {
    const at = zonedTimeFromParts(CHICAGO, "2026-02-30", "11:00");
    expect(toZonedDateInput(at, CHICAGO)).not.toBe("2026-02-30");
  });
});

describe("addDaysToDateKey", () => {
  it("adds across month and year ends", () => {
    expect(addDaysToDateKey("2026-10-30", 7)).toBe("2026-11-06");
    expect(addDaysToDateKey("2026-12-28", 7)).toBe("2027-01-04");
  });
});

describe("zonedDayRange", () => {
  it("brackets the truck's own day, not UTC's", () => {
    // 01:30 UTC on the 5th is still the evening of the 4th in Chicago.
    const { startsAt, endsAt } = zonedDayRange(CHICAGO, new Date("2026-11-05T01:30:00Z"));
    expect(startsAt.toISOString()).toBe("2026-11-04T06:00:00.000Z");
    expect(endsAt.toISOString()).toBe("2026-11-05T06:00:00.000Z");
  });

  it("is half-open, so an order at midnight lands in exactly one day", () => {
    const midnight = zonedTimeFromParts(CHICAGO, "2026-11-04", "00:00");
    const before = zonedDayRange(CHICAGO, new Date(midnight.getTime() - 1));
    const after = zonedDayRange(CHICAGO, midnight);
    expect(before.endsAt.getTime()).toBe(after.startsAt.getTime());
    expect(midnight.getTime()).toBeGreaterThanOrEqual(after.startsAt.getTime());
    expect(midnight.getTime()).toBeLessThan(after.endsAt.getTime());
  });

  it("stretches to 25 hours on the day the clocks go back", () => {
    const { startsAt, endsAt } = zonedDayRange(CHICAGO, new Date("2026-11-01T12:00:00Z"));
    expect((endsAt.getTime() - startsAt.getTime()) / 3_600_000).toBe(25);
  });
});
