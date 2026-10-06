// Pure modifier-selection model: which options are picked in each group of a
// menu item, and whether the picks satisfy the item's rules. No UI, no DB.

import type { MenuItem, ModifierGroup } from "@/lib/types";

export type Selections = Record<string, string[]>; // groupId → chosen option ids

/**
 * Pre-pick the first available option for required single-choice groups.
 * One less tap for the common case, still easy to change.
 */
export function defaultSelections(item: MenuItem): Selections {
  const picks: Selections = {};
  for (const group of item.modifierGroups) {
    const first = group.options.find((o) => o.isAvailable);
    picks[group.id] = group.required && group.maxSelect === 1 && first ? [first.id] : [];
  }
  return picks;
}

/** The first group that still needs more picks, or undefined when the item can be added. */
export function unmetGroup(item: MenuItem, selections: Selections): ModifierGroup | undefined {
  return item.modifierGroups.find((g) => (selections[g.id]?.length ?? 0) < g.minSelect);
}

export function chosenOptionIds(selections: Selections): string[] {
  return Object.values(selections).flat();
}

/** Rebuild selections from a flat list of option ids (e.g. an existing check line). */
export function selectionsFromIds(item: MenuItem, optionIds: string[]): Selections {
  const picks: Selections = {};
  for (const group of item.modifierGroups) {
    picks[group.id] = group.options.filter((o) => optionIds.includes(o.id)).map((o) => o.id);
  }
  return picks;
}
