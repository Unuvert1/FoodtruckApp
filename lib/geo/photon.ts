// Photon by Komoot (photon.komoot.io): keyless, built for search-as-you-type,
// OpenStreetMap data. Fine for development and a class demo; komoot throttle
// heavy use and promise no uptime. Set GEOAPIFY_API_KEY for anything real.

import { num, parseBias, str, toSuggestion } from "@/lib/geo/shape";
import type { GeoProvider, Suggestion } from "@/lib/geo/types";

type Feature = { properties?: Record<string, unknown>; geometry?: { coordinates?: unknown } };

/** Pure: Photon's GeoJSON to our Suggestion[]. `countryCodes` filters results (Photon has no such request parameter). */
export function mapPhoton(body: unknown, countryCodes: string[] = []): Suggestion[] {
  const features = (body as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];
  return (features as Feature[]).flatMap((feature) => {
    const p = feature?.properties ?? {};
    if (countryCodes.length && !countryCodes.includes(str(p.countrycode).toLowerCase())) return [];
    const coords = Array.isArray(feature?.geometry?.coordinates) ? feature.geometry.coordinates : [];
    const osmId = num(p.osm_id);
    const osmType = str(p.osm_type);
    const suggestion = toSuggestion({
      id: osmId !== null && osmType ? `${osmType}${osmId}` : null,
      name: str(p.name) && str(p.name) !== str(p.street) ? str(p.name) : "",
      housenumber: str(p.housenumber),
      street: str(p.street),
      city: str(p.city) || str(p.locality) || str(p.district) || str(p.county),
      region: str(p.state),
      postcode: str(p.postcode),
      fallbackLine: str(p.name),
      lat: num(coords[1]),
      lng: num(coords[0]),
    });
    return suggestion ? [suggestion] : [];
  });
}

export function photon(): GeoProvider {
  return {
    id: "photon",
    attribution: [{ lead: "Address data ©", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright" }],
    async suggest(query, { signal, bias, limit = 5 }) {
      const { countryCodes, proximity } = parseBias(bias);
      const url = new URL("https://photon.komoot.io/api/");
      url.searchParams.set("q", query);
      // Photon can't filter by country, so ask for extra results and filter afterwards.
      url.searchParams.set("limit", String(countryCodes.length ? limit * 3 : limit));
      url.searchParams.set("lang", "en");
      if (proximity) {
        url.searchParams.set("lon", String(proximity.lng));
        url.searchParams.set("lat", String(proximity.lat));
      }

      const response = await fetch(url, { signal, cache: "no-store", headers: { "User-Agent": "FoodtruckApp/0.1 (address autocomplete)" } });
      if (!response.ok) throw new Error(`Photon responded ${response.status}`);
      return mapPhoton(await response.json(), countryCodes).slice(0, limit);
    },
  };
}
