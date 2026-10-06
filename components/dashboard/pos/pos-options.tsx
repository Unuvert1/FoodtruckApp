"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { MenuItem, ModifierGroup } from "@/lib/types";
import { formatCents, unitPriceCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { chosenOptionIds, unmetGroup, type Selections } from "@/lib/menu/selections";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

type Props = {
  item: MenuItem;
  initial: Selections;
  mode: "add" | "edit";
  asSheet: boolean; // phone: bottom sheet. Otherwise an inline panel that replaces the tile field.
  onSubmit: (optionIds: string[]) => void;
  onCancel: () => void;
};

export function PosOptions({ item, initial, mode, asSheet, onSubmit, onCancel }: Props) {
  const body = <OptionsBody key={item.id} item={item} initial={initial} mode={mode} asSheet={asSheet} onSubmit={onSubmit} onCancel={onCancel} />;

  if (!asSheet) return body;
  return (
    <Sheet open onOpenChange={(open) => !open && onCancel()}>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[92dvh] gap-0 rounded-t-3xl border-0 bg-surface p-0 shadow-none">
        <SheetTitle className="sr-only">{item.name} options</SheetTitle>
        <SheetDescription className="sr-only">Choose options for {item.name}.</SheetDescription>
        {body}
      </SheetContent>
    </Sheet>
  );
}

function OptionsBody({ item, initial, mode, asSheet, onSubmit, onCancel }: Props) {
  const [selections, setSelections] = useState<Selections>(initial);
  const unmet = unmetGroup(item, selections);
  const optionIds = chosenOptionIds(selections);
  const priceCents = unitPriceCents(item, optionIds);

  return (
    <div className={cn("flex flex-col bg-surface", asSheet ? "max-h-[92dvh]" : "h-full min-h-0")}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <button
          type="button"
          onClick={onCancel}
          className="-ml-2 inline-flex h-11 items-center gap-1 rounded-xl px-2 text-[0.9375rem] font-semibold text-muted-foreground outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
        >
          <ChevronLeft className="size-4" /> {mode === "add" ? "Back to dishes" : "Cancel"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <h2 className="pt-4 text-[1.5rem] leading-tight font-semibold tracking-[-0.02em]">{item.name}</h2>
        {item.modifierGroups.map((group) => (
          <GroupField
            key={group.id}
            group={group}
            value={selections[group.id] ?? []}
            onChange={(ids) => setSelections((s) => ({ ...s, [group.id]: ids }))}
          />
        ))}
      </div>

      <div className="border-t border-border bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {unmet && <p className="mb-2 text-[0.8125rem] text-muted-foreground">Choose a {unmet.name.toLowerCase()} to continue.</p>}
        <button
          type="button"
          disabled={Boolean(unmet)}
          onClick={() => onSubmit(optionIds)}
          className="flex h-16 w-full items-center justify-between rounded-xl bg-foreground px-5 text-[1.0625rem] font-bold text-background outline-none focus-visible:ring-4 focus-visible:ring-foreground/30 disabled:opacity-40"
        >
          <span>{mode === "add" ? "Add" : "Update"}</span>
          <span className="tabular-nums">{formatCents(priceCents)}</span>
        </button>
      </div>
    </div>
  );
}

function requirementText(group: ModifierGroup): string {
  if (group.required && group.maxSelect === 1) return "Required";
  if (group.required) return `Required, pick ${group.minSelect}–${group.maxSelect}`;
  return group.maxSelect === 1 ? "Optional" : `Optional, up to ${group.maxSelect}`;
}

// Ink instead of the default --primary (brand) so no truck colour reaches this screen.
const inkControl =
  "size-6 data-checked:border-foreground data-checked:bg-foreground data-checked:text-background focus-visible:border-foreground focus-visible:ring-4 focus-visible:ring-foreground/30";

function GroupField({ group, value, onChange }: { group: ModifierGroup; value: string[]; onChange: (ids: string[]) => void }) {
  const single = group.maxSelect === 1;
  const atMax = value.length >= group.maxSelect;

  return (
    <fieldset className="mt-6">
      <legend className="flex w-full items-baseline justify-between gap-4">
        <span className="text-[1.0625rem] font-semibold">{group.name}</span>
        <span className="text-[0.8125rem] text-muted-foreground">{requirementText(group)}</span>
      </legend>
      <div className="mt-1 divide-y divide-border border-y border-border">
        {single ? (
          <RadioGroup value={value[0] ?? null} onValueChange={(v) => onChange(v ? [v as string] : [])} className="gap-0 divide-y divide-border">
            {group.options.map((option) => (
              <OptionRow key={option.id} name={option.name} deltaCents={option.priceDeltaCents} soldOut={!option.isAvailable}>
                <RadioGroupItem value={option.id} disabled={!option.isAvailable} className={inkControl} />
              </OptionRow>
            ))}
          </RadioGroup>
        ) : (
          group.options.map((option) => {
            const checked = value.includes(option.id);
            return (
              <OptionRow key={option.id} name={option.name} deltaCents={option.priceDeltaCents} soldOut={!option.isAvailable}>
                <Checkbox
                  checked={checked}
                  disabled={!option.isAvailable || (!checked && atMax)}
                  onCheckedChange={(next) => onChange(next ? [...value, option.id] : value.filter((id) => id !== option.id))}
                  className={inkControl}
                />
              </OptionRow>
            );
          })
        )}
      </div>
    </fieldset>
  );
}

function OptionRow({ name, deltaCents, soldOut, children }: { name: string; deltaCents: number; soldOut: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("flex min-h-14 cursor-pointer items-center gap-3 py-2", soldOut && "cursor-not-allowed text-muted-foreground")}>
      {children}
      <span className="flex-1 text-[0.9375rem]">{name}</span>
      <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
        {soldOut ? "Sold out" : deltaCents > 0 ? `+${formatCents(deltaCents)}` : null}
      </span>
    </label>
  );
}
