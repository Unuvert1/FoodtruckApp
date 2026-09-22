import { MapPin } from "lucide-react";
import type { Location, PickupSlot, Service, Truck } from "@/lib/types";
import { formatDayLabel, formatTime, formatTimeRange, formatWhen } from "@/lib/time";
import { isHappeningNow, mapsUrl, orderingWindow } from "@/lib/service";

type Props = {
  truck: Truck;
  service: Service;
  location: Location;
  firstSlot: PickupSlot | undefined;
  now: Date;
};

/**
 * "Where we are next": the one loud element on the storefront. Set like the
 * vinyl lettering on the side of a truck, on the truck's own brand color.
 */
export function ServiceHero({ truck, service, location, firstSlot, now }: Props) {
  const tz = truck.timezone;
  const live = isHappeningNow(service, now);
  const ordering = orderingWindow(service, now);

  return (
    <section
      aria-labelledby="hero-location"
      className="awning-edge bg-brand pb-12 text-brand-foreground"
    >
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 pt-4">
        <p className="font-display text-xl font-bold tracking-wide">{truck.name}</p>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-10">
        <p className="flex items-center gap-2.5 text-base font-medium">
          <span>{formatDayLabel(service.startsAt, tz, now)}</span>
          {live && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-foreground/15 px-2.5 py-0.5 text-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-brand-foreground opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-foreground" />
              </span>
              Open now
            </span>
          )}
        </p>

        <h1
          id="hero-location"
          className="mt-3 font-display text-[clamp(3.25rem,15vw,6.5rem)] leading-[0.86] font-extrabold tracking-[-0.01em] text-balance uppercase"
        >
          {location.name}
        </h1>

        <p className="mt-4 font-display text-[1.875rem] leading-none font-semibold tabular-nums">
          {formatTimeRange(service.startsAt, service.endsAt, tz)}
        </p>

        <div className="mt-5 flex items-start gap-2 text-[0.9375rem] leading-snug">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 opacity-80" />
          <div>
            <p>
              {location.addressLine}, {location.city}{" "}
              <a
                href={mapsUrl(location.lat, location.lng)}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-foreground"
              >
                Directions
              </a>
            </p>
            {location.notes && <p className="mt-1 opacity-80">{location.notes}</p>}
          </div>
        </div>

        <div className="mt-8">
          {ordering === "open" && (
            <>
              <p className="text-[0.9375rem] leading-snug opacity-90">
                Taking orders until {formatTime(service.orderingClosesAt, tz)}.
                {firstSlot && <> Earliest pickup {formatTime(firstSlot.startsAt, tz)}.</>}
              </p>
              <a
                href="#menu"
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-foreground px-6 text-base font-semibold text-brand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-foreground sm:w-auto"
              >
                Start your order
              </a>
            </>
          )}
          {ordering === "not-yet" && (
            <p className="text-[0.9375rem] leading-snug opacity-90">
              Preorders open {formatWhen(service.orderingOpensAt, tz, now)}. Have a look at the menu until then.
            </p>
          )}
          {ordering === "closed" && (
            <p className="text-[0.9375rem] leading-snug opacity-90">
              Online ordering has closed for this stop. Come say hi at the window.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
