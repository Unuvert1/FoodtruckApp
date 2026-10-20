import { describe, expect, it } from "vitest";
import { addressLines, appleDirectionsUrl, directionsUrl, isHappeningNow, orderingWindow, pickDefaultService } from "@/lib/service";
import type { Service } from "@/lib/types";

const withCoords = { addressLine: "412 Mill St", city: "Northfield", region: "IL", postcode: "60093", lat: 41.9101, lng: -87.6553 };
const manual = { ...withCoords, lat: null, lng: null };

describe("directions links", () => {
  it("prefers coordinates", () => {
    expect(directionsUrl(withCoords)).toBe("https://www.google.com/maps/dir/?api=1&destination=41.9101%2C-87.6553");
    expect(appleDirectionsUrl(withCoords)).toBe("https://maps.apple.com/?daddr=41.9101%2C-87.6553&dirflg=d");
  });

  it("falls back to the street address when there are no coordinates", () => {
    expect(directionsUrl(manual)).toContain("destination=412%20Mill%20St%2C%20Northfield%2C%20IL%2060093");
    expect(appleDirectionsUrl(manual)).toContain("daddr=412%20Mill%20St%2C%20Northfield%2C%20IL%2060093");
  });
});

describe("addressLines", () => {
  it("builds a postal block and tolerates missing parts", () => {
    expect(addressLines(withCoords)).toEqual(["412 Mill St", "Northfield, IL 60093"]);
    expect(addressLines({ ...withCoords, region: "", postcode: "" })).toEqual(["412 Mill St", "Northfield"]);
  });
});

const at = (iso: string) => new Date(iso);

const service = (overrides: Partial<Service> = {}): Service => ({
  id: "s1",
  locationId: "l1",
  menuId: "m1",
  startsAt: "2026-10-09T16:00:00.000Z",
  endsAt: "2026-10-09T19:00:00.000Z",
  orderingOpensAt: "2026-10-08T16:00:00.000Z",
  orderingClosesAt: "2026-10-09T18:45:00.000Z",
  slotMinutes: 15,
  ordersPerSlot: 6,
  status: "PUBLISHED",
  publicNote: "",
  ...overrides,
});

describe("orderingWindow", () => {
  it("is not-yet before ordering opens, open inside, closed after", () => {
    expect(orderingWindow(service(), at("2026-10-08T15:59:59Z"))).toBe("not-yet");
    expect(orderingWindow(service(), at("2026-10-09T12:00:00Z"))).toBe("open");
    expect(orderingWindow(service(), at("2026-10-09T18:45:01Z"))).toBe("closed");
  });

  it("is open at the exact opening and closing instants", () => {
    expect(orderingWindow(service(), at("2026-10-08T16:00:00Z"))).toBe("open");
    expect(orderingWindow(service(), at("2026-10-09T18:45:00Z"))).toBe("open");
  });

  it("is closed for a cancelled or ended stop, even inside the window", () => {
    expect(orderingWindow(service({ status: "CANCELLED" }), at("2026-10-09T12:00:00Z"))).toBe("closed");
    expect(orderingWindow(service({ status: "ENDED" }), at("2026-10-09T12:00:00Z"))).toBe("closed");
  });
});

describe("isHappeningNow", () => {
  it("includes the start and excludes the end", () => {
    expect(isHappeningNow(service(), at("2026-10-09T15:59:59Z"))).toBe(false);
    expect(isHappeningNow(service(), at("2026-10-09T16:00:00Z"))).toBe(true);
    expect(isHappeningNow(service(), at("2026-10-09T18:59:59Z"))).toBe(true);
    expect(isHappeningNow(service(), at("2026-10-09T19:00:00Z"))).toBe(false);
  });
});

describe("pickDefaultService", () => {
  const now = at("2026-10-09T12:00:00Z");
  const closed = service({ id: "closed", orderingClosesAt: "2026-10-09T10:00:00.000Z" });
  const open = service({ id: "open" });
  const later = service({ id: "later", orderingOpensAt: "2026-10-12T00:00:00.000Z" });

  it("picks the first stop a customer can order from", () => {
    expect(pickDefaultService([closed, open, later], now)?.id).toBe("open");
  });

  it("falls back to the first stop when none is open", () => {
    expect(pickDefaultService([closed, later], now)?.id).toBe("closed");
  });

  it("is undefined when there are no stops", () => {
    expect(pickDefaultService([], now)).toBeUndefined();
  });
});
