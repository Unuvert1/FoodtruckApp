"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Minus, Plus, Search, Trash2 } from "lucide-react";
import type { Menu, MenuItem } from "@/lib/types";
import { lineKey } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/storefront/cart-provider";
import { ItemPhoto } from "@/components/storefront/item-photo";
import { ItemSheet } from "@/components/storefront/item-sheet";

// Where a section counts as "the one you're in": just under the sticky chip bar,
// in the top third of the screen.
const SPY_ROOT_MARGIN = "-72px 0px -65% 0px";

type Props = {
  menu: Menu;
  canOrder: boolean;
  closedReason: string | null; // the full sentence, shown once above the menu when ordering isn't open
  closedLabel: string | null; // the short form, shown where the Add button would be in an item sheet
};

export function MenuList({ menu, canOrder, closedReason, closedLabel }: Props) {
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

  // Highlight the chip for the section on screen, and keep it in view in the chip row.
  const [activeId, setActiveId] = useState<string | null>(null);
  const chipListRef = useRef<HTMLUListElement>(null);
  const sectionKey = sections.map((s) => s.id).join(",");
  const currentId = sections.some((s) => s.id === activeId) ? activeId : (sections[0]?.id ?? null);

  // A tapped chip stays highlighted until the customer scrolls on their own. Without this, the last
  // sections (which can't scroll up to the top of the screen) would hand the highlight to the section above.
  const pinnedRef = useRef<string | null>(null);
  const userScrolledRef = useRef(false);

  useEffect(() => {
    if (!sectionKey || typeof IntersectionObserver === "undefined") return;
    const ids = sectionKey.split(",");
    const inBand = new Set<string>();
    pinnedRef.current = null; // the list changed (search/filter), so start following the scroll again
    // The topmost section in the band wins, so the chip changes as a heading reaches the bar.
    const follow = () => {
      const first = ids.find((id) => inBand.has(id));
      if (first) setActiveId(first);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        }
        if (!pinnedRef.current) follow();
      },
      { rootMargin: SPY_ROOT_MARGIN }
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    // The customer's own wheel, touch, key or scrollbar drag ends the pin; the next scroll hands control back.
    const noteUserInput = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-chip]")) return;
      userScrolledRef.current = true;
    };
    const onScroll = () => {
      if (pinnedRef.current && userScrolledRef.current) {
        pinnedRef.current = null;
        follow();
      }
    };
    const inputEvents = ["wheel", "touchmove", "keydown", "pointerdown"] as const;
    for (const name of inputEvents) window.addEventListener(name, noteUserInput, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      for (const name of inputEvents) window.removeEventListener(name, noteUserInput);
      window.removeEventListener("scroll", onScroll);
    };
  }, [sectionKey]);

  useEffect(() => {
    const list = chipListRef.current;
    if (!list || !currentId) return;
    const chip = list.querySelector<HTMLElement>(`[data-chip="${CSS.escape(currentId)}"]`);
    if (!chip) return;
    const offset =
      chip.getBoundingClientRect().left - list.getBoundingClientRect().left - (list.clientWidth - chip.offsetWidth) / 2;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: offset, behavior: reduceMotion ? "auto" : "smooth" });
  }, [currentId]);

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

        {!canOrder && closedReason && (
          <div className="mt-3 flex items-start gap-3 rounded-2xl bg-surface px-4 py-3.5">
            <Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-semibold">{closedReason}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">You can look around now. Adding to your order isn&apos;t available yet.</p>
            </div>
          </div>
        )}

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
          <ul
            ref={chipListRef}
            className="no-scrollbar mx-auto flex max-w-2xl md:max-w-3xl lg:max-w-4xl gap-2 overflow-x-auto px-4 py-2.5"
          >
            {sections.map((section) => {
              const current = section.id === currentId;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    data-chip={section.id}
                    aria-current={current ? "location" : undefined}
                    onClick={() => {
                      pinnedRef.current = section.id;
                      userScrolledRef.current = false;
                      setActiveId(section.id);
                    }}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap ring-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand",
                      current
                        ? "bg-brand text-brand-foreground ring-brand"
                        : "bg-surface ring-border hover:ring-foreground/30"
                    )}
                  >
                    {section.name}
                  </a>
                </li>
              );
            })}
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
                  <MenuRow item={item} canOrder={canOrder} onSelect={() => setOpenItem(item)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ItemSheet
        item={openItem}
        canOrder={canOrder}
        closedLabel={closedLabel}
        onClose={() => setOpenItem(null)}
      />
    </section>
  );
}

// Sold-out items stay in place, visibly disabled. Hiding them makes customers
// think the menu changed.
function MenuRow({ item, canOrder, onSelect }: { item: MenuItem; canOrder: boolean; onSelect: () => void }) {
  const soldOut = !item.isAvailable;
  const { lines, add, setQuantity } = useCart();

  // An item with nothing to choose can be added with one tap, right from the menu.
  // Items with options still open the sheet, because there is something to decide.
  const hasOptions = item.modifierGroups.length > 0;
  const showControl = !soldOut && canOrder;
  const key = lineKey(item.id, []);
  const quantity = !hasOptions ? (lines.find((l) => l.key === key)?.quantity ?? 0) : 0;

  return (
    <div className={cn("flex items-start", !soldOut && "hover:bg-muted/60 active:bg-muted")}>
      <button
        type="button"
        onClick={onSelect}
        disabled={soldOut}
        className={cn(
          "flex min-w-0 flex-1 items-start gap-4 py-4 pl-4 text-left outline-none focus-visible:bg-muted",
          showControl ? "pr-3" : "pr-4"
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
      </button>

      {showControl && (
        <div className="shrink-0 py-4 pr-4">
          {hasOptions ? (
            <RoundButton label={`Choose options for ${item.name}`} onClick={onSelect}>
              <Plus className="size-4.5" strokeWidth={2.5} />
            </RoundButton>
          ) : quantity === 0 ? (
            <RoundButton label={`Add ${item.name} to order`} onClick={() => add(item.id, [], 1, item.name)}>
              <Plus className="size-4.5" strokeWidth={2.5} />
            </RoundButton>
          ) : (
            <div className="flex h-9 items-center rounded-full text-brand ring-1 ring-brand/40">
              <StepperButton
                label={quantity === 1 ? `Remove ${item.name}` : `One less ${item.name}`}
                onClick={() => setQuantity(key, quantity - 1)}
              >
                {quantity === 1 ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
              </StepperButton>
              <span aria-live="polite" className="w-5 text-center text-sm font-semibold text-foreground tabular-nums">
                {quantity}
              </span>
              <StepperButton
                label={`One more ${item.name}`}
                onClick={() => setQuantity(key, Math.min(20, quantity + 1))}
                disabled={quantity >= 20}
              >
                <Plus className="size-4" />
              </StepperButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// The "+" on a menu row. The visible circle is 36px; the invisible ring around it
// makes the tap target 48px, the size thumbs need.
function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex size-9 items-center justify-center rounded-full text-brand ring-1 ring-brand/40 outline-none after:absolute after:-inset-1.5 after:content-[''] hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand active:bg-brand/20"
    >
      {children}
    </button>
  );
}

function StepperButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="relative flex size-9 items-center justify-center rounded-full outline-none after:absolute after:-inset-0.5 after:content-[''] hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40"
    >
      {children}
    </button>
  );
}
