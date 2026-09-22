"use client";

import { useState, useTransition } from "react";
import type { ManagedItem, ManagedSection } from "@/lib/types";
import { centsToInput } from "@/lib/money";
import { saveMenuItem, type SaveItemResult } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

type Props = {
  editing: { item: ManagedItem | null; sectionId: string } | null;
  sections: ManagedSection[];
  onClose: () => void;
};

export function ItemFormSheet({ editing, sections, onClose }: Props) {
  return (
    <Sheet open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-surface p-0 sm:max-w-md">
        {editing && (
          <ItemForm
            key={editing.item?.id ?? `new-${editing.sectionId}`}
            item={editing.item}
            defaultSectionId={editing.sectionId}
            sections={sections}
            onSaved={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ItemForm({
  item,
  defaultSectionId,
  sections,
  onSaved,
}: {
  item: ManagedItem | null;
  defaultSectionId: string;
  sections: ManagedSection[];
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? centsToInput(item.priceCents) : "");
  const [sectionId, setSectionId] = useState(defaultSectionId);
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [result, setResult] = useState<SaveItemResult | null>(null);
  const [pending, startTransition] = useTransition();

  const fieldError = (field: "name" | "description" | "price") =>
    result && !result.ok && "field" in result && result.field === field ? result.error : null;
  const generalError = result && !result.ok && !("field" in result) ? result.error : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const saved = await saveMenuItem({ itemId: item?.id, sectionId, name, description, price, isAvailable });
      setResult(saved);
      if (saved.ok) onSaved();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-full flex-col">
      <div className="px-5 pt-6">
        <SheetTitle className="font-display text-[1.875rem] leading-none font-bold">
          {item ? "Edit item" : "Add item"}
        </SheetTitle>
        <SheetDescription className="mt-2">
          {item ? "Changes show on your ordering page right away." : "It appears on your ordering page as soon as you add it."}
        </SheetDescription>
      </div>

      <div className="flex-1 space-y-5 px-5 py-6">
        <Field label="Name" htmlFor="item-name" error={fieldError("name")}>
          <Input
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fieldError("name"))}
            className="h-12 rounded-xl px-3.5 text-base"
          />
        </Field>

        <Field label="Description" htmlFor="item-description" error={fieldError("description")} hint="Optional. What's in it, in a sentence.">
          <textarea
            id="item-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            aria-invalid={Boolean(fieldError("description"))}
            className="w-full rounded-xl border border-input px-3.5 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </Field>

        <Field label="Price" htmlFor="item-price" error={fieldError("price")}>
          <div className="flex h-12 items-center rounded-xl border border-input px-3.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="text-muted-foreground">$</span>
            <input
              id="item-price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="12.50"
              aria-invalid={Boolean(fieldError("price"))}
              className="h-full min-w-0 flex-1 bg-transparent pl-1 text-base tabular-nums outline-none"
            />
          </div>
        </Field>

        <Field label="Section" htmlFor="item-section">
          <select
            id="item-section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-surface px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex min-h-12 cursor-pointer items-center gap-3">
          <Checkbox checked={isAvailable} onCheckedChange={(checked) => setIsAvailable(checked)} />
          <span className="font-medium">In stock</span>
        </label>

        {item && item.modifierGroups.length > 0 && (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Options: {item.modifierGroups.map((g) => g.name).join(", ")}. Editing options from the dashboard is coming later.
          </p>
        )}

        {generalError && <p className="text-sm font-medium text-destructive">{generalError}</p>}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-surface px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl text-base font-semibold">
          {pending ? "Saving…" : item ? "Save changes" : "Add item"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-2 font-semibold">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
