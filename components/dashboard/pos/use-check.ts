"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { applyBps, orderTotals, unitPriceCents } from "@/lib/money";
import { MAX_QUANTITY_PER_LINE } from "@/lib/pricing";

// Stored in the shape lib/pricing.ts wants (RequestedLine) plus a merge key.
export type CheckLine = {
  key: string; // menuItemId + sorted optionIds: the merge key, display only
  menuItemId: string;
  optionIds: string[];
  quantity: number;
};

export type DisplayLine = CheckLine & {
  name: string;
  modifiers: string[];
  hasOptions: boolean;
  unitPriceCents: number;
  lineTotalCents: number;
};

// The hand-off to the real pipeline later is a field drop, not a transform.
export const toRequestedLines = (lines: CheckLine[]) =>
  lines.map(({ menuItemId, optionIds, quantity }) => ({ menuItemId, optionIds, quantity }));

export function lineKey(menuItemId: string, optionIds: string[]): string {
  return `${menuItemId}:${[...optionIds].sort().join(",")}`;
}

const clamp = (q: number) => Math.max(1, Math.min(MAX_QUANTITY_PER_LINE, q));

export function useCheck(items: MenuItem[], taxRateBps: number) {
  const [lines, setLines] = useState<CheckLine[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ key: string; n: number } | null>(null);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [flash]);

  const add = useCallback((menuItemId: string, optionIds: string[]) => {
    const key = lineKey(menuItemId, optionIds);
    setLines((prev) =>
      prev.some((l) => l.key === key)
        ? prev.map((l) => (l.key === key ? { ...l, quantity: clamp(l.quantity + 1) } : l))
        : [...prev, { key, menuItemId, optionIds: [...optionIds], quantity: 1 }]
    );
    setFlash((f) => ({ key, n: (f?.n ?? 0) + 1 }));
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: clamp(quantity) } : l)));
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
    setSelectedKey((k) => (k === key ? null : k));
  }, []);

  /** Change the options on an existing line, keeping its quantity (and merging if it now matches another line). */
  const replaceLine = useCallback((oldKey: string, menuItemId: string, optionIds: string[]) => {
    const newKey = lineKey(menuItemId, optionIds);
    setLines((prev) => {
      const old = prev.find((l) => l.key === oldKey);
      if (!old) return prev;
      if (newKey === oldKey) return prev;
      const target = prev.find((l) => l.key === newKey);
      if (target) {
        return prev
          .filter((l) => l.key !== oldKey)
          .map((l) => (l.key === newKey ? { ...l, quantity: clamp(l.quantity + old.quantity) } : l));
      }
      return prev.map((l) => (l.key === oldKey ? { ...l, key: newKey, optionIds: [...optionIds] } : l));
    });
    setSelectedKey(newKey);
    setFlash((f) => ({ key: newKey, n: (f?.n ?? 0) + 1 }));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setSelectedKey(null);
  }, []);

  const display = useMemo(() => {
    const out: DisplayLine[] = [];
    for (const line of lines) {
      const item = itemsById.get(line.menuItemId);
      if (!item) continue;
      const modifiers = item.modifierGroups.flatMap((g) =>
        g.options.filter((o) => line.optionIds.includes(o.id)).map((o) => o.name)
      );
      const unit = unitPriceCents(item, line.optionIds);
      out.push({
        ...line,
        name: item.name,
        modifiers,
        hasOptions: item.modifierGroups.length > 0,
        unitPriceCents: unit,
        lineTotalCents: unit * line.quantity,
      });
    }
    return out;
  }, [lines, itemsById]);

  const count = display.reduce((sum, l) => sum + l.quantity, 0);
  const subtotalCents = display.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const totals = orderTotals(subtotalCents, taxRateBps, 0);

  return {
    lines: display,
    count,
    totals: { ...totals, taxCents: applyBps(subtotalCents, taxRateBps) },
    selectedKey,
    setSelectedKey,
    flash,
    add,
    setQuantity,
    remove,
    replaceLine,
    clear,
  };
}
