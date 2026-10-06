import type { Location, Service } from "@/lib/types";

export type OrderingWindow = "open" | "not-yet" | "closed";

export function orderingWindow(service: Service, now: Date = new Date()): OrderingWindow {
  if (service.status === "CANCELLED" || service.status === "ENDED") return "closed";
  if (now < new Date(service.orderingOpensAt)) return "not-yet";
  if (now > new Date(service.orderingClosesAt)) return "closed";
  return "open";
}

export function isHappeningNow(service: Service, now: Date = new Date()): boolean {
  return now >= new Date(service.startsAt) && now < new Date(service.endsAt);
}

/** The service a customer most likely wants: the first one they can order from. */
export function pickDefaultService(services: Service[], now: Date = new Date()): Service | undefined {
  return services.find((s) => orderingWindow(s, now) === "open") ?? services[0];
}

type Place = Pick<Location, "addressLine" | "city" | "region" | "postcode" | "lat" | "lng">;

/** Two printable lines of postal address: "412 Mill St" / "Northfield, IL 60093". */
export function addressLines(place: Pick<Place, "addressLine" | "city" | "region" | "postcode">): [string, string] {
  const regionAndPostcode = [place.region, place.postcode].filter(Boolean).join(" ");
  return [place.addressLine, [place.city, regionAndPostcode].filter(Boolean).join(", ")];
}

/** The whole address on one line, for text search and for sentences. */
export function singleLineAddress(place: Pick<Place, "addressLine" | "city" | "region" | "postcode">): string {
  return addressLines(place).filter(Boolean).join(", ");
}

/**
 * Keyless Google Maps directions link (no API key, no quota). Uses coordinates
 * when the spot has them, and the street address when it does not.
 */
export function directionsUrl(place: Place): string {
  const destination = place.lat !== null && place.lng !== null ? `${place.lat},${place.lng}` : singleLineAddress(place);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

/** Same destination, opened in Apple Maps (iPhones and Macs). */
export function appleDirectionsUrl(place: Place): string {
  const destination = place.lat !== null && place.lng !== null ? `${place.lat},${place.lng}` : singleLineAddress(place);
  return `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d`;
}
