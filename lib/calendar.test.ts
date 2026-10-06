import { describe, expect, it } from "vitest";
import { buildPickupIcs } from "@/lib/calendar";

const base = {
  uid: "order-123@foodtruckapp",
  title: "Pickup from Taco Truck",
  location: "Riverside Brewing Co., 12 Main St, Kenosha",
  description: "Order A07. Show this number at the window.",
  startsAt: "2026-10-08T18:00:00.000Z",
  now: new Date("2026-10-05T12:30:15.000Z"),
};

describe("buildPickupIcs", () => {
  it("writes a single event with UTC start, a 15 minute default end, and CRLF line endings", () => {
    const ics = buildPickupIcs(base);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261008T180000Z\r\n");
    expect(ics).toContain("DTEND:20261008T181500Z\r\n");
    expect(ics).toContain("DTSTAMP:20261005T123015Z\r\n");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("honors a custom length", () => {
    expect(buildPickupIcs({ ...base, minutes: 30 })).toContain("DTEND:20261008T183000Z");
  });

  it("escapes commas, semicolons, backslashes, and newlines in text", () => {
    const ics = buildPickupIcs({ ...base, title: "Tacos; salsa, lime", description: "Line one\nLine two \\ done" });
    expect(ics).toContain("SUMMARY:Tacos\\; salsa\\, lime");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two \\\\ done");
  });

  it("folds lines longer than 75 characters", () => {
    const ics = buildPickupIcs({ ...base, description: "x".repeat(200) });
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
    // Unfolding (removing CRLF + space) gives the original text back.
    expect(ics.replace(/\r\n /g, "")).toContain(`DESCRIPTION:${"x".repeat(200)}`);
  });
});
