"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Menu, MenuItem } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ItemSheet } from "@/components/storefront/item-sheet";

type Props = {
  menu: Menu;
  canOrder: boolean;
  closedReason: string | null; // shown in the item sheet when ordering isn't open
};

export function MenuList({ menu, canOrder, closedReason }: Props) {
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);

  return (
    <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-4 pt-10">
      <div className="mx-auto max-w-2xl px-4">
        <h2 id="menu-heading" className="font-display text-[1.75rem] leading-tight font-bold">
          Menu
        </h2>
      </div>

      <nav
        aria-label="Menu sections"
        className="sticky top-0 z-20 mt-2 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
      >
        <ul className="no-scrollbar mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-2.5">
          {menu.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex h-9 items-center rounded-full bg-surface px-4 text-sm font-medium whitespace-nowrap ring-1 ring-border outline-none hover:ring-foreground/30 focus-visible:ring-2 focus-visible:ring-brand"
              >
                {section.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto max-w-2xl px-4">
        {menu.sections.map((section) => (
          <div key={section.id} id={section.id} className="scroll-mt-16 pt-7">
            <h3 className="font-display text-[1.375rem] leading-tight font-semibold">{section.name}</h3>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl bg-surface">
              {section.items.map((item) => (
                <li key={item.id}>
                  <MenuRow item={item} onSelect={() => setOpenItem(item)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ItemSheet
        item={openItem}
        canOrder={canOrder}
        closedReason={closedReason}
        onClose={() => setOpenItem(null)}
      />
    </section>
  );
}

// Sold-out items stay in place, visibly disabled. Hiding them makes customers
// think the menu changed.
function MenuRow({ item, onSelect }: { item: MenuItem; onSelect: () => void }) {
  const soldOut = !item.isAvailable;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={soldOut}
      className={cn(
        "flex w-full items-start gap-4 px-4 py-4 text-left outline-none focus-visible:bg-muted",
        !soldOut && "hover:bg-muted/60 active:bg-muted"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold", soldOut && "text-muted-foreground")}>{item.name}</p>
        {item.description && (
          <p className={cn("mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground", soldOut && "opacity-70")}>
            {item.description}
          </p>
        )}
        <p className="mt-2 text-sm font-medium tabular-nums">
          {soldOut ? (
            <span className="text-muted-foreground">
              <span className="line-through">{formatCents(item.priceCents)}</span>
              <span className="ml-2 no-underline">Sold out today</span>
            </span>
          ) : (
            formatCents(item.priceCents)
          )}
        </p>
      </div>
      {!soldOut && (
        <span
          aria-hidden
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-brand ring-1 ring-brand/40"
        >
          <Plus className="size-4.5" strokeWidth={2.5} />
        </span>
      )}
    </button>
  );
}
