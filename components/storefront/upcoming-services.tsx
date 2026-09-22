import Link from "next/link";
import type { Location, Service, Truck } from "@/lib/types";
import { formatDayParts, formatTimeRange, formatWhen } from "@/lib/time";
import { isHappeningNow, orderingWindow } from "@/lib/service";
import { cn } from "@/lib/utils";

type Props = {
  truck: Truck;
  services: Service[];
  locations: Record<string, Location>;
  selectedId: string;
  now: Date;
};

export function UpcomingServices({ truck, services, locations, selectedId, now }: Props) {
  const tz = truck.timezone;

  return (
    <section aria-labelledby="stops-heading" className="mx-auto max-w-2xl px-4 pt-6">
      <h2 id="stops-heading" className="font-display text-[1.75rem] leading-tight font-bold">
        Upcoming stops
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Pick a stop to order for it.</p>

      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl bg-surface">
        {services.map((service) => {
          const location = locations[service.locationId];
          const { weekday, day } = formatDayParts(service.startsAt, tz);
          const selected = service.id === selectedId;
          const window = orderingWindow(service, now);

          let availability: string;
          if (isHappeningNow(service, now)) availability = "Open now";
          else if (window === "open") availability = "Preorder";
          else if (window === "not-yet") availability = `Orders open ${formatWhen(service.orderingOpensAt, tz, now)}`;
          else availability = "Ordering closed";

          return (
            <li key={service.id}>
              <Link
                href={`/${truck.slug}?service=${service.id}`}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "relative flex items-center gap-4 px-4 py-3.5 outline-none focus-visible:bg-muted",
                  selected && "bg-brand/[0.06]"
                )}
              >
                {selected && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-brand" />}
                <div className="w-10 shrink-0 text-center">
                  <p className="text-xs font-medium text-muted-foreground">{weekday}</p>
                  <p className="font-display text-[1.75rem] leading-none font-bold tabular-nums">{day}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{location.name}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatTimeRange(service.startsAt, service.endsAt, tz)}
                  </p>
                  <p className={cn("mt-0.5 text-sm", window === "open" ? "font-medium text-brand" : "text-muted-foreground")}>
                    {availability}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
