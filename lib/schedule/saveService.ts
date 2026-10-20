// Saves a stop and its pickup slots in one transaction. Pure orchestration over
// lib/tenant.ts. The rule that matters: a slot with orders is never deleted, so
// a save that would drop one is refused whole, before anything is written.

import { resolveOrderingWindow } from "@/lib/schedule/ordering-window";
import { MAX_SLOTS, bookedSlotMessage, generateSlots, planSlots } from "@/lib/schedule/slots";
import {
  createServiceWithSlots,
  getDefaultMenuIdForTruck,
  getServiceForEdit,
  getServiceSlots,
  replaceServiceSlots,
  serviceHasOrders,
  touchLocationUsed,
  updateServiceTimes,
  withTransaction,
} from "@/lib/tenant";

export type SaveServiceInput = {
  truckId: string;
  timeZone: string;
  serviceId?: string; // present = editing that stop
  locationId: string;
  startsAt: Date;
  endsAt: Date;
  opensHoursBefore: number;
  closesMinutesBefore: number;
  slotMinutes: number;
  ordersPerSlot: number;
  publicNote: string;
  publish: boolean;
  now: Date;
};

export type SaveServiceResult =
  | { ok: true; serviceId: string }
  | { ok: false; error: string; field?: "place" | "date" | "endTime" | "slots" };

const fail = (error: string, field?: "place" | "date" | "endTime" | "slots"): SaveServiceResult => ({ ok: false, error, field });

export function saveService(input: SaveServiceInput): Promise<SaveServiceResult> {
  const { truckId, timeZone, serviceId, locationId, startsAt, endsAt, slotMinutes, ordersPerSlot, now } = input;

  // Checked up front so a runaway range never builds a huge slot list.
  if (Math.ceil((endsAt.getTime() - startsAt.getTime()) / (slotMinutes * 60_000)) > MAX_SLOTS) {
    return Promise.resolve(fail("That is too many pickup times for one stop. Use longer slots or a shorter stop.", "slots"));
  }
  if (!serviceId && endsAt <= now) return Promise.resolve(fail("That stop is already over. Pick a later date.", "date"));

  return withTransaction(async (tx): Promise<SaveServiceResult> => {
    const existing = serviceId ? await getServiceForEdit(truckId, serviceId, tx) : null;
    if (serviceId) {
      if (!existing) return fail("That stop no longer exists.");
      if (existing.service.status === "CANCELLED") return fail("A cancelled stop can't be edited. Add a new stop instead.");
    }

    const window = resolveOrderingWindow({
      startsAt,
      endsAt,
      opensHoursBefore: input.opensHoursBefore,
      closesMinutesBefore: input.closesMinutesBefore,
      now,
      existingOpensAt: existing ? new Date(existing.service.orderingOpensAt) : undefined,
    });
    if ("error" in window) return fail(window.error);

    const locationChanged = !existing || existing.service.locationId !== locationId;
    // Orders read their pickup address from the stop's location and snapshot nothing.
    if (serviceId && locationChanged && (await serviceHasOrders(truckId, serviceId, tx))) {
      return fail("This stop already has orders, so its location can't change. Cancel it and add a new stop.", "place");
    }
    if (locationChanged && !(await touchLocationUsed(tx, truckId, locationId))) {
      return fail("That spot isn't available. Pick another.", "place");
    }

    const slots = generateSlots(startsAt, endsAt, slotMinutes, ordersPerSlot);
    const data = {
      locationId,
      startsAt,
      endsAt,
      orderingOpensAt: window.opensAt,
      orderingClosesAt: window.closesAt,
      slotMinutes,
      ordersPerSlot,
      publicNote: input.publicNote,
      status: existing && existing.service.status !== "DRAFT" ? existing.service.status : input.publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
    };

    if (!existing) {
      const menuId = await getDefaultMenuIdForTruck(truckId);
      if (!menuId) return fail("Add a menu before scheduling a stop.");
      return { ok: true, serviceId: await createServiceWithSlots(tx, truckId, { ...data, menuId }, slots) };
    }

    // planSlots fills create/update/deleteIds even when it reports a conflict, so
    // the conflict is checked before any of the plan is used.
    const plan = planSlots(await getServiceSlots(tx, truckId, existing.service.id), slots);
    if (plan.conflict) return fail(bookedSlotMessage(plan.conflict, timeZone), "slots");

    if (!(await updateServiceTimes(tx, truckId, existing.service.id, data))) return fail("That stop can't be edited anymore.");
    if (!(await replaceServiceSlots(tx, truckId, existing.service.id, plan)).ok) {
      // An order landed on a slot being removed. Throwing rolls the transaction back.
      throw new SlotBookedError();
    }
    return { ok: true, serviceId: existing.service.id };
  }).catch((error) => {
    if (error instanceof SlotBookedError) return fail("An order just came in for one of the pickup times being removed. Try again.", "slots");
    throw error;
  });
}

class SlotBookedError extends Error {}
