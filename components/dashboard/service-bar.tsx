"use client";

import { cn } from "@/lib/utils";

type Props = {
  newCount: number;
  arrivalKey: number;
  /** The controls: stop switcher, chime toggle, stock button. */
  children: React.ReactNode;
};

/**
 * Sticky bar with the --new strip under it. The strip is a steady line while
 * orders are waiting (that is also the reduced-motion path); a new arrival adds
 * a one-off sweep on top, keyed so a second arrival restarts it.
 */
export function ServiceBar({ newCount, arrivalKey, children }: Props) {
  return (
    <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur lg:static">
      <div className="mx-auto flex h-14 max-w-[44rem] items-center gap-1 border-b border-border px-4">{children}</div>
      <div aria-hidden className="pointer-events-none relative h-[3px]">
        <div className={cn("h-full bg-new", newCount === 0 && "opacity-0")} />
        {arrivalKey > 0 && (
          <div key={arrivalKey} className="absolute inset-x-0 top-0 h-2 bg-new opacity-0 motion-safe:animate-signal-sweep" />
        )}
      </div>
    </div>
  );
}
