import { describe, expect, it } from "vitest";
import { addressLines, appleDirectionsUrl, directionsUrl } from "@/lib/service";

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
