"use client";

import { useState, useSyncExternalStore } from "react";
import type { ManagedSection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StockBoard } from "@/components/dashboard/stock-board";

const WIDE = "(min-width: 1024px)";

function useIsWide() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(WIDE);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE).matches,
    () => false
  );
}

/** The "Stock · 2" button and the sheet it opens: bottom on a phone, right on a laptop. */
export function StockSheet({ sections, soldOutCount }: { sections: ManagedSection[]; soldOutCount: number }) {
  const [open, setOpen] = useState(false);
  const wide = useIsWide();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={soldOutCount > 0 ? `Stock, ${soldOutCount} sold out` : "Stock"}
        className="flex h-11 shrink-0 items-center rounded-xl border border-border px-3 text-[0.9375rem] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
      >
        {soldOutCount > 0 ? `Stock · ${soldOutCount}` : "Stock"}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={wide ? "right" : "bottom"}
          className={cn(
            "gap-0 overflow-y-auto bg-surface p-0 shadow-none",
            wide ? "w-full sm:max-w-sm" : "max-h-[85dvh] rounded-t-3xl"
          )}
        >
          <SheetHeader className="pr-14">
            <SheetTitle className="text-base font-semibold">Stock</SheetTitle>
            <SheetDescription className="text-[0.8125rem]">
              Tap an item to mark it sold out. Customers see it right away.
            </SheetDescription>
          </SheetHeader>
          <StockBoard sections={sections} />
        </SheetContent>
      </Sheet>
    </>
  );
}
