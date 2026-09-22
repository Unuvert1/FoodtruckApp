"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { ManagedSection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { setStock } from "@/app/(dashboard)/dashboard/actions";

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
    <div className="md:sticky md:top-4">
      <h1 className="font-display text-[2rem] leading-none font-extrabold md:text-[1.75rem]">Stock</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tap an item to mark it sold out. Customers see it right away.</p>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {sections.map((section) => (
        <div key={section.id} className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{section.name}</h2>
          <ul className="space-y-1.5">
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
                      "flex min-h-14 w-full items-center gap-3 rounded-xl px-4 text-left outline-none transition-colors focus-visible:ring-4 focus-visible:ring-foreground/25",
                      available ? "bg-surface ring-1 ring-border hover:ring-foreground/30" : "bg-foreground/[0.07] ring-1 ring-foreground/15"
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
