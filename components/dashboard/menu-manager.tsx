"use client";

import Image from "next/image";
import { useOptimistic, useState, useTransition } from "react";
import { Camera, Plus, Trash2 } from "lucide-react";
import type { ManagedItem, ManagedSection } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { addSection, setArchived, setStock } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ItemFormSheet } from "@/components/dashboard/item-form-sheet";
import { ErrorBanner } from "@/components/dashboard/error-banner";

type Editing = { item: ManagedItem | null; sectionId: string } | null;

export function MenuManager({ sections }: { sections: ManagedSection[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Stock flips instantly and saves in the background: this gets used mid-rush.
  const [stockOverrides, applyStock] = useOptimistic(
    {} as Record<string, boolean>,
    (state, change: { id: string; isAvailable: boolean }) => ({ ...state, [change.id]: change.isAvailable })
  );

  const archived = sections.flatMap((s) =>
    s.items.filter((i) => i.archived).map((i) => ({ ...i, sectionName: s.name }))
  );

  function archive(item: ManagedItem, value: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setArchived({ itemId: item.id, archived: value });
      if (!result.ok) setError(result.error);
    });
  }

  function toggleStock(item: ManagedItem, isAvailable: boolean) {
    setError(null);
    startTransition(async () => {
      applyStock({ id: item.id, isAvailable });
      const result = await setStock({ itemId: item.id, isAvailable });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className={cn(pending && "opacity-80 transition-opacity")}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[2rem] leading-none font-semibold tracking-[-0.03em]">Menu</h1>
        {sections.length > 0 && (
          <Button
            onClick={() => setEditing({ item: null, sectionId: sections[0].id })}
            className="h-11 gap-1.5 rounded-full px-4.5 text-[0.9375rem] font-semibold"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Add item
          </Button>
        )}
      </div>
      <p className="mt-2 text-[0.9375rem] text-muted-foreground">
        Changes show on your ordering page right away. Tap an item to edit it.
      </p>

      <ErrorBanner message={error} className="mt-4" />

      {sections.map((section) => {
        const items = section.items.filter((i) => !i.archived);
        return (
          <section key={section.id} className="mt-9">
            <div className="mb-2.5 flex items-baseline justify-between gap-4 px-1">
              <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">{section.name}</h2>
              <button
                type="button"
                onClick={() => setEditing({ item: null, sectionId: section.id })}
                className="rounded-sm text-[0.9375rem] font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:underline"
              >
                Add
              </button>
            </div>
            {items.length === 0 ? (
              <p className="rounded-2xl bg-surface/60 px-4 py-5 text-center text-sm text-muted-foreground">
                Nothing in {section.name} yet.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-2xl bg-surface">
                {items.map((item, index) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isAvailable={stockOverrides[item.id] ?? item.isAvailable}
                    showDivider={index > 0}
                    onEdit={() => setEditing({ item, sectionId: item.sectionId })}
                    onStockChange={(next) => toggleStock(item, next)}
                    onArchive={() => archive(item, true)}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <AddSectionForm onError={setError} />

      {archived.length > 0 && (
        <details className="mt-10 overflow-hidden rounded-2xl bg-surface">
          <summary className="cursor-pointer list-none px-4 py-3.5 font-medium outline-none select-none focus-visible:bg-muted">
            Removed items
            <span className="ml-2 text-muted-foreground tabular-nums">{archived.length}</span>
          </summary>
          <ul className="border-t border-border">
            {archived.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-muted-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.sectionName}</p>
                </div>
                <Button variant="outline" onClick={() => archive(item, false)} className="h-10 rounded-full px-4">
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <ItemFormSheet editing={editing} sections={sections} onClose={() => setEditing(null)} />
    </div>
  );
}

function ItemRow({
  item,
  isAvailable,
  showDivider,
  onEdit,
  onStockChange,
  onArchive,
}: {
  item: ManagedItem;
  isAvailable: boolean;
  showDivider: boolean;
  onEdit: () => void;
  onStockChange: (next: boolean) => void;
  onArchive: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="relative flex items-center gap-2 pr-2.5 pl-3">
      {/* Hairline starts at the text, not the card edge. */}
      {showDivider && <span aria-hidden className="absolute top-0 right-0 left-[4.875rem] h-px bg-border" />}

      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl py-3 text-left outline-none focus-visible:bg-muted/70"
      >
        <Thumbnail imageUrl={item.imageUrl} dimmed={!isAvailable} />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate font-medium", !isAvailable && "text-muted-foreground")}>
            {item.name}
          </span>
          {item.description && (
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">{item.description}</span>
          )}
          <span className="mt-1 block text-sm tabular-nums">
            {formatCents(item.priceCents)}
            {item.modifierGroups.length > 0 && (
              <span className="ml-2.5 text-muted-foreground">
                {item.modifierGroups.length} {item.modifierGroups.length === 1 ? "option" : "options"}
              </span>
            )}
          </span>
        </span>
      </button>

      <StockSwitch checked={isAvailable} itemName={item.name} onChange={onStockChange} />

      <button
        type="button"
        aria-label={confirming ? `Confirm removing ${item.name}` : `Remove ${item.name}`}
        onClick={() => (confirming ? onArchive() : setConfirming(true))}
        onBlur={() => setConfirming(false)}
        className={cn(
          "flex h-9 shrink-0 items-center justify-center rounded-full text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
          confirming
            ? "bg-destructive/10 px-3 text-destructive"
            : "w-9 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        {confirming ? "Remove?" : <Trash2 className="size-4.5" strokeWidth={1.75} />}
      </button>
    </li>
  );
}

function Thumbnail({ imageUrl, dimmed }: { imageUrl: string | null; dimmed: boolean }) {
  return (
    <span
      className={cn(
        "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted",
        dimmed && "opacity-55 saturate-0"
      )}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt="" width={56} height={56} className="size-full object-cover" />
      ) : (
        <Camera className="size-5 text-muted-foreground" strokeWidth={1.5} />
      )}
    </span>
  );
}

/** In stock to sold out and back, without opening the editor. */
function StockSwitch({
  checked,
  itemName,
  onChange,
}: {
  checked: boolean;
  itemName: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${itemName}: ${checked ? "in stock" : "sold out"}`}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        checked ? "bg-ok" : "bg-foreground/20"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 left-0.5 size-6 rounded-full bg-white transition-transform duration-200 ease-out motion-reduce:transition-none",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

function AddSectionForm({ onError }: { onError: (error: string | null) => void }) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    startTransition(async () => {
      const result = await addSection(name);
      if (result.ok) setName("");
      else onError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="mt-9 flex gap-2">
      <label htmlFor="new-section" className="sr-only">
        New section name
      </label>
      <Input
        id="new-section"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New section, e.g. Desserts"
        className="h-11 flex-1 rounded-full bg-surface px-4 text-base"
      />
      <Button
        type="submit"
        variant="outline"
        disabled={pending || !name.trim()}
        className="h-11 rounded-full px-4.5 text-base"
      >
        Add section
      </Button>
    </form>
  );
}
