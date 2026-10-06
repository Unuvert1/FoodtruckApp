import type { Suggestion } from "@/lib/geo/types";

/** Reads a provider field defensively: only a non-empty string counts. */
export const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
export const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

type Parts = {
  id: string | null;
  name: string;
  housenumber: string;
  street: string;
  city: string;
  region: string;
  postcode: string;
  /** Used only when the provider gave no street to build an address line from. */
  fallbackLine: string;
  lat: number | null;
  lng: number | null;
};

/** Both adapters funnel through here so a suggestion looks the same whichever provider made it. */
export function toSuggestion(p: Parts): Suggestion | null {
  const addressLine = (p.street ? [p.housenumber, p.street].filter(Boolean).join(" ") : "") || p.name || p.fallbackLine;
  if (!addressLine) return null;
  const lat = p.lat !== null && p.lat >= -90 && p.lat <= 90 ? p.lat : null;
  const lng = p.lng !== null && p.lng >= -180 && p.lng <= 180 ? p.lng : null;
  const hasCoords = lat !== null && lng !== null;
  return {
    providerPlaceId: p.id,
    primary: p.name && p.name !== addressLine ? p.name : addressLine,
    secondary: [p.city, [p.region, p.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    suggestedName: p.name || addressLine,
    addressLine,
    city: p.city,
    region: p.region,
    postcode: p.postcode,
    lat: hasCoords ? lat : null,
    lng: hasCoords ? lng : null,
  };
}

/** GEO_BIAS: "countrycode:us" (restrict) or "proximity:-87.65,41.91" (lng,lat; prefer nearby). */
export function parseBias(bias: string | undefined): { countryCodes: string[]; proximity: { lng: number; lat: number } | null } {
  const result = { countryCodes: [] as string[], proximity: null as { lng: number; lat: number } | null };
  const text = (bias ?? "").trim();
  if (text.startsWith("countrycode:")) {
    result.countryCodes = text
      .slice("countrycode:".length)
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter((c) => /^[a-z]{2}$/.test(c));
  } else if (text.startsWith("proximity:")) {
    const [lng, lat] = text.slice("proximity:".length).split(",").map(Number);
    if (Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) result.proximity = { lng, lat };
  }
  return result;
}
