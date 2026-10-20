// Checkout starts with the earliest pickup time already chosen, because most
// people want their food as soon as it's ready. They can still pick any other
// time. This keeps the choice valid when slots fill up while they're checking out.

import type { PickupSlot } from "@/lib/types";

export type SlotChoice = {
  /** The slot to show as selected, or null when no slots are left. */
  slot: PickupSlot | null;
  /** Set when the slot the customer had chosen is gone and we moved them to `slot`. */
  replaced: PickupSlot | null;
};

/**
 * `slots` are the bookable slots, soonest first (that's how the server returns
 * them). `chosen` is what the customer last had selected, if anything.
 *
 * - Nothing chosen yet: the earliest slot.
 * - Chosen slot still bookable: that slot.
 * - Chosen slot just filled up: the earliest slot, and `replaced` says which one was lost.
 */
export function resolveSlotChoice(slots: PickupSlot[], chosen: PickupSlot | null): SlotChoice {
  const earliest = slots[0] ?? null;
  if (!chosen) return { slot: earliest, replaced: null };

  const stillThere = slots.find((s) => s.id === chosen.id);
  if (stillThere) return { slot: stillThere, replaced: null };

  return { slot: earliest, replaced: chosen };
}
