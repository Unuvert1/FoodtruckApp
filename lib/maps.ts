// Pulls a coordinate pair out of what a vendor pastes from Google Maps. No API
// key and no network call: if the text has no pair we can read, the caller
// simply saves the location without coordinates.

type Coordinates = { lat: number; lng: number };

// Most specific first. "!3d…!4d…" is the pin itself; "@…" is only the map centre.
const PATTERNS = [
  /!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
  /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
  /[?&](?:q|query|ll|center)=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)\s*(-?\d{1,3}(?:\.\d+)?)/i,
  /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/, // "41.8781, -87.6298", as copied from the app
];

export function parseMapsLink(input: string): Coordinates | null {
  const text = input.trim();
  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }
  return null;
}
