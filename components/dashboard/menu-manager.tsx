"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import type { ManagedItem, ManagedSection } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { addSection, setArchived } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ItemFormSheet } from "@/components/dashboard/item-form-sheet";
import { ErrorBanner } from "@/components/dashboard/error-banner";

type Editing = { item: ManagedItem | null; sectionId: string } | null;

export function MenuManager({ sections }: { sections: ManagedSection[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const archived = sections.flatMap((s) => s.items.filter((i) => i.archived).map((i) => ({ ...i, sectionName: s.name })));

  function archive(item: ManagedItem, value: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setArchived({ itemId: item.id, archived: value });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className={cn(pending && "opacity-80 transition-opacity")}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[2.25rem] leading-none font-extrabold">Menu</h1>
        {sections.length > 0 && (
          <Button onClick={() => setEditing({ item: null, sectionId: sections[0].id })} className="h-11 gap-1.5 rounded-xl px-4 text-base font-semibold">
            <Plus className="size-4" strokeWidth={2.5} />
            Add item
          </Button>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Changes show on your ordering page right away. Removed items can be restored from the bottom of this page.
      </p>

      <ErrorBanner message={error} className="mt-4" />

      {sections.map((section) => {
        const items = section.items.filter((i) => !i.archived);
        return (
          <section key={section.id} className="mt-8">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-bold">{section.name}</h2>
              <button
                type="button"
                onClick={() => setEditing({ item: null, sectionId: section.id })}
                className="text-sm font-semibold underline-offset-4 hover:underline"
              >
                Add to {section.name}
              </button>
            </div>
            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                No items in this section yet.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-2xl bg-surface">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onEdit={() => setEditing({ item, sectionId: item.sectionId })}
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
        <details className="mt-10 rounded-2xl bg-surface">
          <summary className="cursor-pointer px-4 py-3 font-semibold">Removed items ({archived.length})</summary>
          <ul className="divide-y divide-border border-t border-border">
            {archived.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-muted-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.sectionName}</p>
                </div>
                <Button variant="outline" onClick={() => archive(item, false)} className="h-10 rounded-lg px-3">
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

function ItemRow({ item, onEdit, onArchive }: { item: ManagedItem; onEdit: () => void; onArchive: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="flex items-start gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{item.name}</p>
        {item.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{item.description}</p>}
        <p className="mt-1 text-sm tabular-nums">
          {formatCents(item.priceCents)}
          {!item.isAvailable && <span className="ml-2 font-semibold text-muted-foreground">Sold out</span>}
          {item.modifierGroups.length > 0 && (
            <span className="ml-2 text-muted-foreground">
              {item.modifierGroups.length} {item.modifierGroups.length === 1 ? "option group" : "option groups"}
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Button variant="outline" onClick={onEdit} className="h-10 rounded-lg px-3">
          Edit
        </Button>
        <Button
          variant={confirming ? "destructive" : "ghost"}
          onClick={() => (confirming ? onArchive() : setConfirming(true))}
          onBlur={() => setConfirming(false)}
          className="h-10 rounded-lg px-3"
        >
          {confirming ? "Remove?" : "Remove"}
        </Button>
      </div>
    </li>
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
    <form onSubmit={submit} className="mt-8 flex gap-2">
      <label htmlFor="new-section" className="sr-only">
        New section name
      </label>
      <Input
        id="new-section"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New section, e.g. Desserts"
        className="h-11 flex-1 rounded-xl bg-surface px-3.5 text-base"
      />
      <Button type="submit" variant="outline" disabled={pending || !name.trim()} className="h-11 rounded-xl px-4 text-base">
        Add section
      </Button>
    </form>
  );
}
