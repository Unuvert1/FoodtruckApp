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

export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
