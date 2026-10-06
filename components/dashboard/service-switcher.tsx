"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Location, Service, Truck } from "@/lib/types";
import { formatDayLabel, formatTimeRange } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Props = {
  truck: Truck;
  services: Service[];
  locations: Record<string, Location>;
  selectedId: string;
};

/** Which stop the screen is showing. Rarely changed, so it's a label that opens a list. */
export function ServiceSwitcher({ truck, services, locations, selectedId }: Props) {
  const [open, setOpen] = useState(false);
  const tz = truck.timezone;
  const selected = services.find((s) => s.id === selectedId);
  const label = (s: Service) =>
    `${formatDayLabel(s.startsAt, tz)} · ${locations[s.locationId]?.name ?? "Stop"} · ${formatTimeRange(s.startsAt, s.endsAt, tz)}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change stop"
        className="flex h-11 min-w-0 flex-1 items-center gap-1 rounded-xl text-left text-[0.9375rem] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
      >
        <span className="truncate">{selected ? label(selected) : "Choose a stop"}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-3xl bg-surface p-0 shadow-none">
          <SheetHeader className="pr-14">
            <SheetTitle className="text-base font-semibold">Stops</SheetTitle>
            <SheetDescription className="text-[0.8125rem]">Pick which stop&apos;s orders to show.</SheetDescription>
          </SheetHeader>
          <ul className="divide-y divide-border border-t border-border">
            {services.map((s) => {
              const current = s.id === selectedId;
              return (
                <li key={s.id}>
                  <Link
                    href={`/dashboard?service=${s.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "flex min-h-14 items-center px-4 py-2 text-[0.9375rem] outline-none focus-visible:bg-muted",
                      current ? "font-bold" : "font-medium"
                    )}
                  >
                    {label(s)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
