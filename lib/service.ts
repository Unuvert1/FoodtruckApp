import type { Service } from "@/lib/types";

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

/** Directions link. Falls back to the street address when a spot has no coordinates. */
export function mapsUrl(lat: number | null, lng: number | null, address?: string): string {
  const query = lat !== null && lng !== null ? `${lat},${lng}` : (address ?? "");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
