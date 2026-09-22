"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { MenuItem, ModifierGroup } from "@/lib/types";
import { formatCents, unitPriceCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/components/storefront/cart-provider";

type Props = {
  item: MenuItem | null;
  canOrder: boolean;
  closedReason: string | null;
  onClose: () => void;
};

export function ItemSheet({ item, canOrder, closedReason, onClose }: Props) {
  // Keep showing the last item while the sheet animates closed.
  const [shown, setShown] = useState<MenuItem | null>(item);
  if (item && item !== shown) setShown(item);

  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92dvh] w-full max-w-2xl gap-0 rounded-t-3xl border-0 bg-surface p-0"
      >
        {shown && (
          <ItemSheetBody key={shown.id} item={shown} canOrder={canOrder} closedReason={closedReason} onAdded={onClose} />
        )}
      </SheetContent>
    </Sheet>
  );
}

type Selections = Record<string, string[]>; // groupId → chosen option ids

function defaultSelections(item: MenuItem): Selections {
  // Pre-pick the first available option for required single-choice groups.
  // One less tap for the common case, still easy to change.
  const picks: Selections = {};
  for (const group of item.modifierGroups) {
    const first = group.options.find((o) => o.isAvailable);
    picks[group.id] = group.required && group.maxSelect === 1 && first ? [first.id] : [];
  }
  return picks;
}

function ItemSheetBody({
  item,
  canOrder,
  closedReason,
  onAdded,
}: {
  item: MenuItem;
  canOrder: boolean;
  closedReason: string | null;
  onAdded: () => void;
}) {
  const { add } = useCart();
  const [selections, setSelections] = useState<Selections>(() => defaultSelections(item));
  const [quantity, setQuantity] = useState(1);

  const optionIds = Object.values(selections).flat();
  const unmet = item.modifierGroups.find((g) => (selections[g.id]?.length ?? 0) < g.minSelect);
  const totalCents = unitPriceCents(item, optionIds) * quantity;

  function handleAdd() {
    if (unmet || !canOrder) return;
    add(item.id, optionIds, quantity);
    onAdded();
  }

  return (
    <>
      <div className="overflow-y-auto px-5 pt-6 pb-4">
        <div aria-hidden className="mx-auto -mt-3 mb-4 h-1 w-10 rounded-full bg-border" />
        <SheetTitle className="pr-8 font-display text-[1.875rem] leading-[1.05] font-bold">{item.name}</SheetTitle>
        {item.description && (
          <SheetDescription className="mt-2 text-[0.9375rem] leading-relaxed">{item.description}</SheetDescription>
        )}
        <p className="mt-2 font-medium tabular-nums">{formatCents(item.priceCents)}</p>

        {item.modifierGroups.map((group) => (
          <ModifierGroupField
            key={group.id}
            group={group}
            value={selections[group.id] ?? []}
            onChange={(ids) => setSelections((s) => ({ ...s, [group.id]: ids }))}
          />
        ))}
      </div>

      <div className="border-t border-border bg-surface px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!canOrder && closedReason && <p className="mb-3 text-sm text-muted-foreground">{closedReason}</p>}
        {canOrder && unmet && (
          <p className="mb-3 text-sm text-muted-foreground">Choose a {unmet.name.toLowerCase()} to continue.</p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-12 items-center rounded-xl ring-1 ring-border">
            <button
              type="button"
              aria-label="Remove one"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex size-12 items-center justify-center rounded-l-xl outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span aria-live="polite" className="w-6 text-center font-semibold tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Add one"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="flex size-12 items-center justify-center rounded-r-xl outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!canOrder || Boolean(unmet)}
            className="h-12 flex-1 justify-between rounded-xl px-5 text-base font-semibold"
          >
            <span>Add to order</span>
            <span className="tabular-nums">{formatCents(totalCents)}</span>
          </Button>
        </div>
      </div>
    </>
  );
}

function requirementText(group: ModifierGroup): string {
  if (group.required && group.maxSelect === 1) return "Required";
  if (group.required) return `Required, pick ${group.minSelect}–${group.maxSelect}`;
  return group.maxSelect === 1 ? "Optional" : `Optional, up to ${group.maxSelect}`;
}

function ModifierGroupField({
  group,
  value,
  onChange,
}: {
  group: ModifierGroup;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const single = group.maxSelect === 1;
  const atMax = value.length >= group.maxSelect;

  return (
    <fieldset className="mt-7">
      <legend className="flex w-full items-baseline justify-between gap-4">
        <span className="font-display text-xl font-semibold">{group.name}</span>
        <span className="text-sm text-muted-foreground">{requirementText(group)}</span>
      </legend>

      <div className="mt-2 divide-y divide-border">
        {single ? (
          <RadioGroup value={value[0] ?? null} onValueChange={(v) => onChange(v ? [v as string] : [])} className="gap-0">
            {group.options.map((option) => (
              <OptionRow key={option.id} name={option.name} priceDeltaCents={option.priceDeltaCents} soldOut={!option.isAvailable}>
                <RadioGroupItem value={option.id} disabled={!option.isAvailable} />
              </OptionRow>
            ))}
          </RadioGroup>
        ) : (
          group.options.map((option) => {
            const checked = value.includes(option.id);
            return (
              <OptionRow key={option.id} name={option.name} priceDeltaCents={option.priceDeltaCents} soldOut={!option.isAvailable}>
                <Checkbox
                  checked={checked}
                  disabled={!option.isAvailable || (!checked && atMax)}
                  onCheckedChange={(next) =>
                    onChange(next ? [...value, option.id] : value.filter((id) => id !== option.id))
                  }
                />
              </OptionRow>
            );
          })
        )}
      </div>
    </fieldset>
  );
}

function OptionRow({
  name,
  priceDeltaCents,
  soldOut,
  children,
}: {
  name: string;
  priceDeltaCents: number;
  soldOut: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex min-h-12 cursor-pointer items-center gap-3 py-2", soldOut && "cursor-not-allowed text-muted-foreground")}>
      {children}
      <span className="flex-1">{name}</span>
      <span className="text-sm tabular-nums text-muted-foreground">
        {soldOut ? "Sold out" : priceDeltaCents > 0 ? `+${formatCents(priceDeltaCents)}` : null}
      </span>
    </label>
  );
}
