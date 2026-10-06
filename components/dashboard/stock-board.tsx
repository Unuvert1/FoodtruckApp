"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { ManagedSection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { setStock } from "@/app/(dashboard)/dashboard/actions";
import { ErrorBanner } from "@/components/dashboard/error-banner";

/**
 * One big tap target per item: in stock ↔ sold out. Flips instantly and saves
 * in the background, because this gets used mid-rush with one greasy thumb.
 */
export function StockBoard({ sections }: { sections: ManagedSection[] }) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [overrides, applyOverride] = useOptimistic(
    {} as Record<string, boolean>,
    (state, change: { id: string; isAvailable: boolean }) => ({ ...state, [change.id]: change.isAvailable })
  );

  function toggle(itemId: string, isAvailable: boolean) {
    setError(null);
    startTransition(async () => {
      applyOverride({ id: itemId, isAvailable });
      const result = await setStock({ itemId, isAvailable });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="pb-6">
      <ErrorBanner message={error} className="mx-4 mb-3" />

      {sections.map((section) => (
        <div key={section.id} className="mt-6 first:mt-0">
          <h2 className="px-4 pb-2 text-[0.8125rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{section.name}</h2>
          <ul className="divide-y divide-border border-y border-border">
            {section.items.map((item) => {
              const available = overrides[item.id] ?? item.isAvailable;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={available}
                    aria-label={`${item.name}: ${available ? "in stock" : "sold out"}`}
                    onClick={() => toggle(item.id, !available)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 px-4 text-left outline-none focus-visible:bg-muted",
                      !available && "bg-muted"
                    )}
                  >
                    <span className={cn("flex-1 font-semibold", !available && "text-muted-foreground line-through")}>
                      {item.name}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex h-8 min-w-[5.5rem] items-center justify-center rounded-full px-3 text-sm font-bold",
                        available ? "bg-ready/10 text-ready" : "bg-foreground text-background"
                      )}
                    >
                      {available ? "In stock" : "Sold out"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
