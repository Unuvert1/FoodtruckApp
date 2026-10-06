"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Menu, MenuItem } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ItemPhoto } from "@/components/storefront/item-photo";
import { ItemSheet } from "@/components/storefront/item-sheet";

type Props = {
  menu: Menu;
  canOrder: boolean;
  closedReason: string | null; // shown in the item sheet when ordering isn't open
};

export function MenuList({ menu, canOrder, closedReason }: Props) {
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const [query, setQuery] = useState("");
  const [hideSoldOut, setHideSoldOut] = useState(false);

  // Filter what's already on the page. Sold-out items show by default (hiding
  // them makes customers think the menu changed), so hiding is opt-in.
  const needle = query.trim().toLowerCase();
  const sections = menu.sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          (!hideSoldOut || item.isAvailable) &&
          (!needle || `${item.name} ${item.description}`.toLowerCase().includes(needle))
      ),
    }))
    .filter((section) => section.items.length > 0);
  const filtering = needle !== "" || hideSoldOut;
  const matchCount = sections.reduce((sum, section) => sum + section.items.length, 0);

  // A stop can be published before the vendor has added anything to its menu.
  if (menu.sections.length === 0) {
    return (
      <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-4 pt-10">
        <div className="mx-auto max-w-2xl md:max-w-3xl lg:max-w-4xl px-4">
          <h2 id="menu-heading" className="font-display text-[1.75rem] leading-tight font-bold">
            Menu
          </h2>
          <div className="mt-3 rounded-2xl bg-surface px-5 py-8">
            <p className="font-semibold">The menu isn&apos;t up yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The truck hasn&apos;t added items for this stop. Check back soon, or come see what&apos;s on at the window.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-4 pt-10">
      <div className="mx-auto max-w-2xl md:max-w-3xl lg:max-w-4xl px-4">
        <h2 id="menu-heading" className="font-display text-[1.75rem] leading-tight font-bold">
          Menu
        </h2>

        <div role="search" className="mt-3 space-y-3">
          <div className="relative">
            <label htmlFor="menu-search" className="sr-only">
              Search the menu
            </label>
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="menu-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              autoComplete="off"
              className="h-12 rounded-xl bg-surface pr-3.5 pl-10 text-base"
            />
          </div>
          <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
            <Checkbox checked={hideSoldOut} onCheckedChange={(next) => setHideSoldOut(next === true)} />
            Hide sold out items
          </label>
          <p role="status" className="sr-only">
            {filtering ? `${matchCount} ${matchCount === 1 ? "item" : "items"} shown.` : ""}
          </p>
        </div>
      </div>

      {sections.length > 0 && (
        <nav
          aria-label="Menu sections"
          className="sticky top-0 z-20 mt-2 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
        >
          <ul className="no-scrollbar mx-auto flex max-w-2xl md:max-w-3xl lg:max-w-4xl gap-2 overflow-x-auto px-4 py-2.5">
            {sections.map((section) => (
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
      )}

      <div className="mx-auto max-w-2xl md:max-w-3xl lg:max-w-4xl px-4">
        {sections.length === 0 && (
          <div className="mt-7 rounded-2xl bg-surface px-5 py-8">
            <p className="font-semibold">Nothing matches.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different word, or show sold out items again.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setHideSoldOut(false);
              }}
              className="mt-4 font-semibold text-brand underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Clear search
            </button>
          </div>
        )}
        {sections.map((section) => (
          <div key={section.id} id={section.id} className="scroll-mt-16 pt-7">
            <h3 className="font-display text-[1.375rem] leading-tight font-semibold">{section.name}</h3>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl bg-surface md:grid md:grid-cols-2 md:gap-3 md:divide-y-0 md:overflow-visible md:rounded-none md:bg-transparent">
              {section.items.map((item) => (
                <li key={item.id} className="md:overflow-hidden md:rounded-2xl md:bg-surface">
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
      <ItemPhoto
        src={item.imageUrl}
        alt=""
        className={cn("size-16 shrink-0 rounded-xl", soldOut && "opacity-50 grayscale")}
      />
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
