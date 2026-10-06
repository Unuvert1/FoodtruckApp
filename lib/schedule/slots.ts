// Pickup-slot arithmetic for a stop. Pure (no database), so the rule that
// matters most is easy to test: a slot someone has booked is never deleted.

import { formatTime } from "@/lib/time";

export type SlotSpec = { startsAt: Date; capacity: number };
export type ExistingSlot = { id: string; startsAt: Date; capacity: number; bookedCount: number };

/** A stop never needs more pickup times than this; it also caps what one save can write. */
export const MAX_SLOTS = 300;

const MINUTE = 60_000;

/** One slot every `slotMinutes` from the start, up to (not including) the end. */
export function generateSlots(startsAt: Date, endsAt: Date, slotMinutes: number, ordersPerSlot: number): SlotSpec[] {
  const slots: SlotSpec[] = [];
  for (let t = startsAt.getTime(); t < endsAt.getTime() && slots.length <= MAX_SLOTS; t += slotMinutes * MINUTE) {
    slots.push({ startsAt: new Date(t), capacity: ordersPerSlot });
  }
  return slots;
}

export type SlotPlan = {
  create: SlotSpec[];
  /** Slots that stay but get a new capacity. Never lower than what is already booked. */
  update: { id: string; capacity: number }[];
  /** Only ever empty slots. */
  deleteIds: string[];
  /** The earliest booked slot the new schedule would drop; the save must be refused. */
  conflict: { startsAt: Date; bookedCount: number } | null;
};

/** Diffs a stop's current slots against the slots its new times call for. */
export function planSlots(existing: ExistingSlot[], desired: SlotSpec[]): SlotPlan {
  const wanted = new Map(desired.map((s) => [s.startsAt.getTime(), s]));
  const have = new Set(existing.map((s) => s.startsAt.getTime()));

  const plan: SlotPlan = { create: [], update: [], deleteIds: [], conflict: null };

  for (const slot of [...existing].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())) {
    const target = wanted.get(slot.startsAt.getTime());
    if (target) {
      const capacity = Math.max(target.capacity, slot.bookedCount);
      if (capacity !== slot.capacity) plan.update.push({ id: slot.id, capacity });
    } else if (slot.bookedCount > 0) {
      plan.conflict ??= { startsAt: slot.startsAt, bookedCount: slot.bookedCount };
    } else {
      plan.deleteIds.push(slot.id);
    }
  }

  plan.create = desired.filter((s) => !have.has(s.startsAt.getTime()));
  return plan;
}

/** The refusal shown to the vendor. Names the time, in the truck's timezone. */
export function bookedSlotMessage(conflict: { startsAt: Date; bookedCount: number }, timeZone: string): string {
  const time = formatTime(conflict.startsAt, timeZone);
  const who = conflict.bookedCount === 1 ? "One order is" : `${conflict.bookedCount} orders are`;
  return `${who} already booked for ${time}. Keep a pickup time at ${time} in this stop (same slot length, and an end time after it), or cancel those orders first.`;
}

/** "About 6 orders every 15 minutes: 56 pickup times between 8:00 am and 10:00 pm." */
export function slotSummary(startsAt: Date, endsAt: Date, slotMinutes: number, ordersPerSlot: number, timeZone: string): string {
  const count = generateSlots(startsAt, endsAt, slotMinutes, ordersPerSlot).length;
  return `Up to ${ordersPerSlot} ${ordersPerSlot === 1 ? "order" : "orders"} every ${slotMinutes} minutes: ${count} pickup ${count === 1 ? "time" : "times"} between ${formatTime(startsAt, timeZone)} and ${formatTime(endsAt, timeZone)}.`;
}
