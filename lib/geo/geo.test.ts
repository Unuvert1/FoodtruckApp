import { describe, expect, it } from "vitest";
import { mapGeoapify } from "@/lib/geo/geoapify";
import { mapPhoton } from "@/lib/geo/photon";
import { createRateLimiter } from "@/lib/geo/rate-limit";
import { parseBias } from "@/lib/geo/shape";

describe("mapGeoapify", () => {
  const body = {
    features: [
      {
        properties: { place_id: "abc", name: "Riverside Brewing", housenumber: "412", street: "Mill Street", city: "Northfield", state_code: "IL", postcode: "60093", lat: 41.91, lon: -87.65 },
        geometry: { coordinates: [-87.65, 41.91] },
      },
      // A plain address: Geoapify repeats the street in `name`.
      { properties: { place_id: "def", name: "Clark Street", street: "Clark Street", housenumber: "3300", city: "Chicago", state: "Illinois", lat: 41.94, lon: -87.65 } },
      { properties: { place_id: "nothing-usable" } },
    ],
  };

  it("maps a place with a name", () => {
    const [first] = mapGeoapify(body);
    expect(first).toMatchObject({
      providerPlaceId: "abc",
      primary: "Riverside Brewing",
      secondary: "Northfield, IL 60093",
      suggestedName: "Riverside Brewing",
      addressLine: "412 Mill Street",
      lat: 41.91,
      lng: -87.65,
    });
  });

  it("treats a repeated street name as a plain address and drops unusable features", () => {
    const results = mapGeoapify(body);
    expect(results).toHaveLength(2);
    expect(results[1]).toMatchObject({ primary: "3300 Clark Street", suggestedName: "3300 Clark Street", region: "Illinois" });
  });

  it("survives garbage", () => {
    expect(mapGeoapify(null)).toEqual([]);
    expect(mapGeoapify({ features: "no" })).toEqual([]);
  });
});

describe("mapPhoton", () => {
  const body = {
    features: [
      { properties: { osm_id: 77, osm_type: "N", name: "Halsted Cafe", housenumber: "2200", street: "N Halsted Ave", city: "Chicago", state: "Illinois", postcode: "60614", countrycode: "US" }, geometry: { coordinates: [-87.648, 41.922] } },
      { properties: { osm_id: 5, osm_type: "W", name: "Rue Cler", city: "Paris", countrycode: "FR" }, geometry: { coordinates: [2.3, 48.85] } },
    ],
  };

  it("maps [lng, lat] coordinates and builds an id from the OSM type and id", () => {
    const [first] = mapPhoton(body);
    expect(first).toMatchObject({ providerPlaceId: "N77", addressLine: "2200 N Halsted Ave", city: "Chicago", lat: 41.922, lng: -87.648 });
  });

  it("filters by country when asked", () => {
    expect(mapPhoton(body, ["us"])).toHaveLength(1);
    expect(mapPhoton(body)).toHaveLength(2);
  });
});

describe("parseBias", () => {
  it("reads a country list or a proximity point", () => {
    expect(parseBias("countrycode:us,CA").countryCodes).toEqual(["us", "ca"]);
    expect(parseBias("proximity:-87.65,41.91").proximity).toEqual({ lng: -87.65, lat: 41.91 });
    expect(parseBias("proximity:nonsense").proximity).toBeNull();
    expect(parseBias(undefined)).toEqual({ countryCodes: [], proximity: null });
  });
});

describe("rate limiter", () => {
  it("allows 30 a minute per key, then recovers", () => {
    let t = 0;
    const limiter = createRateLimiter({ perMinute: 30, perDay: 400 }, () => t);
    for (let i = 0; i < 30; i++) expect(limiter.take("truck-a").ok).toBe(true);
    expect(limiter.take("truck-a").ok).toBe(false);
    expect(limiter.take("truck-b").ok).toBe(true);
    t += 61_000;
    expect(limiter.take("truck-a").ok).toBe(true);
  });

  it("caps a day", () => {
    let t = 0;
    const limiter = createRateLimiter({ perMinute: 30, perDay: 400 }, () => t);
    let allowed = 0;
    for (let i = 0; i < 500; i++) {
      t += 5_000; // slow enough to never trip the per-minute cap
      if (limiter.take("truck-a").ok) allowed++;
    }
    expect(allowed).toBe(400);
  });
});
