// Geoapify Address Autocomplete (geoapify.com). Needs a free key, no credit card.
// Results may be stored permanently; the footer must credit Geoapify and OpenStreetMap.

import { num, parseBias, str, toSuggestion } from "@/lib/geo/shape";
import type { GeoProvider, Suggestion } from "@/lib/geo/types";

type Feature = { properties?: Record<string, unknown>; geometry?: { coordinates?: unknown } };

/** Pure: Geoapify's GeoJSON to our Suggestion[]. */
export function mapGeoapify(body: unknown): Suggestion[] {
  const features = (body as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];
  return (features as Feature[]).flatMap((feature) => {
    const p = feature?.properties ?? {};
    const coords = Array.isArray(feature?.geometry?.coordinates) ? feature.geometry.coordinates : [];
    const suggestion = toSuggestion({
      id: str(p.place_id) || null,
      // Geoapify repeats the street in `name` for plain addresses; only keep a name that is a real place.
      name: str(p.name) && str(p.name) !== str(p.street) ? str(p.name) : "",
      housenumber: str(p.housenumber),
      street: str(p.street),
      city: str(p.city) || str(p.town) || str(p.village) || str(p.suburb) || str(p.county),
      region: str(p.state_code) || str(p.state),
      postcode: str(p.postcode),
      fallbackLine: str(p.address_line1),
      lat: num(p.lat) ?? num(coords[1]),
      lng: num(p.lon) ?? num(coords[0]),
    });
    return suggestion ? [suggestion] : [];
  });
}

export function geoapify(apiKey: string): GeoProvider {
  return {
    id: "geoapify",
    attribution: [
      { lead: "Addresses from", label: "Geoapify", href: "https://www.geoapify.com/" },
      { lead: "map data ©", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright" },
    ],
    async suggest(query, { signal, bias, limit = 5 }) {
      const { countryCodes, proximity } = parseBias(bias);
      const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
      url.searchParams.set("text", query);
      url.searchParams.set("format", "geojson");
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("lang", "en");
      if (countryCodes.length) url.searchParams.set("filter", `countrycode:${countryCodes.join(",")}`);
      if (proximity) url.searchParams.set("bias", `proximity:${proximity.lng},${proximity.lat}`);
      url.searchParams.set("apiKey", apiKey);

      const response = await fetch(url, { signal, cache: "no-store" });
      if (!response.ok) throw new Error(`Geoapify responded ${response.status}`);
      return mapGeoapify(await response.json());
    },
  };
}
