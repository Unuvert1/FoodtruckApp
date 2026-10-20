"use server";

// Every schedule mutation. Same shape as dashboard/actions.ts: requireTruckAccess()
// for the truck (never an ID from the browser) → Zod-validate → a lib/tenant.ts
// function (or saveService) that scopes the write to that truck.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/app/(dashboard)/dashboard/actions";
import { MAX_CLOSES_MINUTES_BEFORE, MAX_OPENS_HOURS_BEFORE, closesMinutesBeforeOf, opensHoursBeforeOf } from "@/lib/schedule/ordering-window";
import { saveService } from "@/lib/schedule/saveService";
import {
  createLocation,
  findLocationByPlaceId,
  getServiceForEdit,
  requireTruckAccess,
  serviceHasOrders,
  setLocationArchived,
  setServiceStatus,
  updateLocation,
} from "@/lib/tenant";
import { addDaysToDateKey, toZonedDateInput, toZonedTimeInput, zonedTimeFromParts } from "@/lib/time";
import type { StopDraft } from "@/lib/types";

const id = z.string().min(1).max(50);
const fail = (error: string): ActionResult => ({ ok: false, error });

// Where and when the truck trades is an owner decision: a stop commits the
// business to being somewhere, and cancelling one cancels customers' orders.
// Spots are the same rows Settings → Locations protects, so the bar matches.
const OWNER_ONLY = "Only owners can change the schedule.";

function refresh(truckSlug: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${truckSlug}`, "layout");
}

// ─── Spots ─────────────────────────────────────────────────────────────────

/** A place either chosen from a suggestion or typed by hand. */
const placeSchema = z.object({
  provider: z.enum(["geoapify", "photon", "manual"]),
  providerPlaceId: z.string().max(200).nullable(),
  name: z.string().trim().min(1, "Give this spot a name.").max(80, "Keep the name under 80 characters."),
  addressLine: z.string().trim().min(1, "Enter the street address.").max(160, "Keep the address under 160 characters."),
  city: z.string().trim().max(80),
  region: z.string().trim().max(80),
  postcode: z.string().trim().max(20),
  // Range-checked, not recomputed. Null means no coordinates (geocoder unavailable).
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  notes: z.string().trim().max(200, "Keep the parking note under 200 characters."),
});

const spotSchema = placeSchema.extend({ locationId: id.optional() });

export async function saveSpot(input: z.input<typeof spotSchema>): Promise<ActionResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
  const parsed = spotSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { locationId, ...place } = parsed.data;
  if (locationId) {
    const updated = await updateLocation(truck.id, locationId, place);
    refresh(truck.slug);
    return updated ? { ok: true } : fail("That spot no longer exists.");
  }
  await createLocation(truck.id, place);
  refresh(truck.slug);
  return { ok: true };
}

export async function archiveSpot(input: { locationId: string; archived: boolean }): Promise<ActionResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
  const parsed = z.object({ locationId: id, archived: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail("That spot can't be updated.");

  const updated = await setLocationArchived(truck.id, parsed.data.locationId, parsed.data.archived);
  refresh(truck.slug);
  return updated ? { ok: true } : fail("That spot no longer exists.");
}

// ─── Stops ─────────────────────────────────────────────────────────────────

const timeOfDay = (message: string) => z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, message);

const stopSchema = z
  .object({
    serviceId: id.optional(), // present = editing
    locationId: id.optional(), // an existing saved spot …
    place: placeSchema.optional(), // … or a new one. Exactly one is required.
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
    startTime: timeOfDay("Pick a start time."),
    endTime: timeOfDay("Pick an end time."),
    opensHoursBefore: z.number().int().min(0).max(MAX_OPENS_HOURS_BEFORE),
    closesMinutesBefore: z.number().int().min(0).max(MAX_CLOSES_MINUTES_BEFORE),
    slotMinutes: z.number().int().min(5, "Pickup times need to be at least 5 minutes apart.").max(60, "Pickup times can be at most 60 minutes apart."),
    ordersPerSlot: z.number().int().min(1, "Allow at least 1 order per pickup time.").max(60, "Keep it to 60 orders or fewer per pickup time."),
    publicNote: z.string().trim().max(200, "Keep the note under 200 characters."),
    publish: z.boolean(),
  })
  .refine((v) => v.endTime > v.startTime, { message: "The end time has to be after the start time.", path: ["endTime"] })
  .refine((v) => Boolean(v.locationId) !== Boolean(v.place), { message: "Choose where this stop is.", path: ["place"] });

export type SaveStopResult =
  | { ok: true; serviceId: string }
  | { ok: false; error: string; field?: "place" | "date" | "endTime" | "slots" };

export async function saveStop(input: z.input<typeof stopSchema>): Promise<SaveStopResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return { ok: false, error: OWNER_ONLY };
  const parsed = stopSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path[0];
    return field === "place" || field === "date" || field === "endTime"
      ? { ok: false, error: issue.message, field }
      : { ok: false, error: field === "startTime" ? issue.message : "Check the stop's details and try again." };
  }
  const v = parsed.data;

  let locationId = v.locationId;
  if (v.place) {
    const { provider, providerPlaceId } = v.place;
    const known = provider !== "manual" && providerPlaceId ? await findLocationByPlaceId(truck.id, provider, providerPlaceId) : null;
    locationId = known?.id ?? (await createLocation(truck.id, v.place));
  }
  if (!locationId) return { ok: false, error: "Choose where this stop is.", field: "place" };

  const result = await saveService({
    truckId: truck.id,
    timeZone: truck.timezone,
    serviceId: v.serviceId,
    locationId,
    startsAt: zonedTimeFromParts(truck.timezone, v.date, v.startTime),
    endsAt: zonedTimeFromParts(truck.timezone, v.date, v.endTime),
    opensHoursBefore: v.opensHoursBefore,
    closesMinutesBefore: v.closesMinutesBefore,
    slotMinutes: v.slotMinutes,
    ordersPerSlot: v.ordersPerSlot,
    publicNote: v.publicNote,
    publish: v.publish,
    now: new Date(),
  });
  refresh(truck.slug);
  return result;
}

export async function setStopStatus(input: { serviceId: string; status: "DRAFT" | "PUBLISHED" | "CANCELLED" }): Promise<ActionResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
  const parsed = z.object({ serviceId: id, status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]) }).safeParse(input);
  if (!parsed.success) return fail("That stop can't be updated.");
  const { serviceId, status } = parsed.data;

  // A stop with orders must stay visible to the kitchen: cancel it instead.
  if (status === "DRAFT" && (await serviceHasOrders(truck.id, serviceId))) {
    return fail("This stop already has orders, so it can't go back to a draft. Cancel it instead.");
  }
  const updated = await setServiceStatus(truck.id, serviceId, status);
  refresh(truck.slug);
  return updated ? { ok: true } : fail("That stop no longer exists, or was already cancelled.");
}

/** A pre-filled draft for the sheet, a number of weeks later. Writes nothing: saving it makes a new stop. */
export async function repeatStop(input: { serviceId: string; weeks: number }): Promise<{ ok: true; draft: StopDraft } | { ok: false; error: string }> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return { ok: false, error: OWNER_ONLY };
  const parsed = z.object({ serviceId: id, weeks: z.number().int().min(1).max(52) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That stop can't be repeated." };

  const row = await getServiceForEdit(truck.id, parsed.data.serviceId);
  if (!row) return { ok: false, error: "That stop no longer exists." };

  const { service } = row;
  const startsAt = new Date(service.startsAt);
  const endsAt = new Date(service.endsAt);
  return {
    ok: true,
    draft: {
      locationId: service.locationId,
      date: addDaysToDateKey(toZonedDateInput(startsAt, truck.timezone), parsed.data.weeks * 7),
      startTime: toZonedTimeInput(startsAt, truck.timezone),
      endTime: toZonedTimeInput(endsAt, truck.timezone),
      opensHoursBefore: opensHoursBeforeOf(startsAt, new Date(service.orderingOpensAt)),
      closesMinutesBefore: closesMinutesBeforeOf(endsAt, new Date(service.orderingClosesAt)),
      slotMinutes: service.slotMinutes,
      ordersPerSlot: service.ordersPerSlot,
      publicNote: service.publicNote,
    },
  };
}
