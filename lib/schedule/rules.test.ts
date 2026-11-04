import { describe, expect, it } from "vitest";
import { ruleDates, ruleProblem, ruleTimes, weekdayOf, weekdaysLabel } from "@/lib/schedule/rules";

const CHICAGO = "America/Chicago";
const TUE_THU = { weekdays: [2, 4], startTime: "11:00", endTime: "14:00" };

describe("weekdayOf", () => {
  it("reads the weekday of a date key", () => {
    expect(weekdayOf("2026-11-04")).toBe(3); // a Wednesday
    expect(weekdayOf("2026-11-08")).toBe(0); // the Sunday after
  });
});

describe("ruleDates", () => {
  it("lists only the rule's weekdays, inside the horizon", () => {
    // From Wednesday the 4th, the horizon reaches the 18th: the 19th is day 15.
    const dates = ruleDates(TUE_THU, CHICAGO, new Date("2026-11-04T15:00:00Z"), 14);
    expect(dates).toEqual(["2026-11-05", "2026-11-10", "2026-11-12", "2026-11-17"]);
    expect(dates.every((d) => [2, 4].includes(weekdayOf(d)))).toBe(true);
  });

  it("includes today, so switching a rule on puts today's stop up", () => {
    // 2026-11-05 is a Thursday, and the rule covers Thursdays.
    const dates = ruleDates(TUE_THU, CHICAGO, new Date("2026-11-05T15:00:00Z"), 14);
    expect(dates[0]).toBe("2026-11-05");
  });

  it("uses the truck's day, not UTC's", () => {
    // 02:00 UTC on Thursday is still Wednesday evening in Chicago, so a
    // Wednesday rule is due today and a Thursday rule is not yet.
    const lateWednesday = new Date("2026-11-05T02:00:00Z");
    expect(ruleDates({ ...TUE_THU, weekdays: [3] }, CHICAGO, lateWednesday, 0)).toEqual(["2026-11-04"]);
    expect(ruleDates({ ...TUE_THU, weekdays: [4] }, CHICAGO, lateWednesday, 0)).toEqual([]);
  });

  it("covers every day when every weekday is picked", () => {
    const every = { ...TUE_THU, weekdays: [0, 1, 2, 3, 4, 5, 6] };
    expect(ruleDates(every, CHICAGO, new Date("2026-11-04T15:00:00Z"), 6)).toHaveLength(7);
  });
});

describe("ruleTimes", () => {
  it("holds the wall-clock hour across a daylight-saving change", () => {
    // Chicago leaves daylight time on 2026-11-01: UTC-5 before, UTC-6 after.
    const before = ruleTimes(TUE_THU, CHICAGO, "2026-10-29");
    const after = ruleTimes(TUE_THU, CHICAGO, "2026-11-05");
    expect(before.startsAt.toISOString()).toBe("2026-10-29T16:00:00.000Z");
    expect(after.startsAt.toISOString()).toBe("2026-11-05T17:00:00.000Z");
    // Different instants, same 11am to the vendor and the customer.
    expect(after.endsAt.getTime() - after.startsAt.getTime()).toBe(3 * 3_600_000);
  });
});

describe("weekdaysLabel", () => {
  it("names the common patterns rather than listing days", () => {
    expect(weekdaysLabel([1, 2, 3, 4, 5])).toBe("Weekdays");
    expect(weekdaysLabel([0, 1, 2, 3, 4, 5, 6])).toBe("Every day");
    expect(weekdaysLabel([0, 6])).toBe("Weekends");
    expect(weekdaysLabel([4, 2])).toBe("Tue, Thu");
    expect(weekdaysLabel([])).toBe("No days");
  });
});

describe("ruleProblem", () => {
  it("accepts a sound rule", () => {
    expect(ruleProblem(TUE_THU)).toBeNull();
  });

  it("refuses no days, and an end before the start", () => {
    expect(ruleProblem({ ...TUE_THU, weekdays: [] })).toMatch(/at least one day/);
    expect(ruleProblem({ ...TUE_THU, endTime: "10:00" })).toMatch(/after the start/);
    expect(ruleProblem({ ...TUE_THU, endTime: "11:00" })).toMatch(/after the start/);
  });
});
