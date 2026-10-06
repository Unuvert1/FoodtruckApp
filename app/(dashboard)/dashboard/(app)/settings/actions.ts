"use server";

// Every Settings mutation. Same discipline as the dashboard's actions.ts:
// requireTruckAccess() for the truck (never an ID from the browser) →
// Zod-validate the input → a lib/tenant.ts function scoped to that truck →
// revalidate.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/app/(dashboard)/dashboard/actions";
import { parseMapsLink } from "@/lib/maps";
import { parsePercentToBps } from "@/lib/money";
import { slugSchema } from "@/lib/slug";
import {
  deleteMember,
  getTeam,
  isSlugTaken,
  requireTruckAccess,
  setLocationArchived as archiveLocation,
  setMemberRole,
  updateNotificationEmail,
  updateOrderingDefaults,
  updateStorefront,
  updateTaxRateBps,
  updateTruckProfile,
  updateTruckSlug,
  upsertLocation,
} from "@/lib/tenant";

const id = z.string().min(1).max(50);
const fail = (error: string): ActionResult => ({ ok: false, error });

/** Only a photo URL this app issued (see /api/uploads), same rule as menu item images. */
const photoUrl = z
  .string()
  .regex(/^\/api\/photos\/[a-z0-9]{1,40}$/, "That photo isn't valid. Upload it again.")
  .nullable();

function refresh() {
  revalidatePath("/dashboard", "layout");
}

// ─── Truck profile ─────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your truck's name.").max(60, "Keep the name under 60 characters."),
  tagline: z.string().trim().max(80, "Keep the tagline under 80 characters."),
  logoUrl: photoUrl,
});

export async function saveProfile(input: z.input<typeof profileSchema>): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await updateTruckProfile(truck.id, parsed.data);
  refresh();
  revalidatePath(`/${truck.slug}`, "layout");
  return { ok: true };
}

// The slug is its own action: it is the only setting that breaks live links.
export async function saveSlug(slug: string): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  if (parsed.data === truck.slug) return { ok: true };
  if (await isSlugTaken(parsed.data)) return fail("That address is already taken. Try another.");

  const { ok, oldSlug } = await updateTruckSlug(truck.id, parsed.data);
  if (!ok) return fail("That address is already taken. Try another.");
  refresh();
  // The old address must stop resolving from cache, and the new one must start.
  revalidatePath(`/${oldSlug}`, "layout");
  revalidatePath(`/${parsed.data}`, "layout");
  return { ok: true };
}

// ─── Storefront ────────────────────────────────────────────────────────────

const storefrontSchema = z.object({
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #22603F."),
  // Two allowed values only: an arbitrary foreground makes storefronts unreadable.
  brandColorForeground: z.enum(["#FFFFFF", "#1D2733"]),
  heroImageUrl: photoUrl,
});

export async function saveStorefront(input: z.input<typeof storefrontSchema>): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = storefrontSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await updateStorefront(truck.id, { ...parsed.data, brandColor: parsed.data.brandColor.toUpperCase() });
  refresh();
  revalidatePath(`/${truck.slug}`, "layout");
  return { ok: true };
}

// ─── Locations ─────────────────────────────────────────────────────────────

const locationSchema = z.object({
  locationId: id.optional(), // absent = create
  name: z.string().trim().min(1, "Give the spot a name.").max(60, "Keep the name under 60 characters."),
  addressLine: z.string().trim().min(1, "Enter the street address.").max(120),
  city: z.string().trim().min(1, "Enter the city.").max(60),
  // A pasted Google Maps link (or "lat, lng"). Parsed here, never trusted from the client.
  mapsLink: z.string().trim().max(500, "That link is too long."),
  notes: z.string().trim().max(200, "Keep the notes under 200 characters."),
});

export type SaveLocationResult = { ok: true; note?: string } | { ok: false; error: string };

export async function saveLocation(input: z.input<typeof locationSchema>): Promise<SaveLocationResult> {
  const { truck } = await requireTruckAccess();
  const parsed = locationSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { locationId, mapsLink, notes, ...fields } = parsed.data;

  // TODO(stream C): geocode the address here (Google Geocoding or similar) when no coordinates can be read from a link.
  const coords = mapsLink ? parseMapsLink(mapsLink) : null;
  const data = { ...fields, notes: notes || null, ...(coords ?? (locationId ? {} : { lat: null, lng: null })) };

  const saved = await upsertLocation(truck.id, locationId ?? null, data);
  if (!saved) return fail("That location no longer exists.");
  refresh();
  return mapsLink && !coords
    ? { ok: true, note: "Saved, but we couldn't read coordinates from that link. Directions will use the street address." }
    : { ok: true };
}

export async function setLocationArchived(input: { locationId: string; archived: boolean }): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = z.object({ locationId: id, archived: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail("That location can't be updated.");

  const updated = await archiveLocation(truck.id, parsed.data.locationId, parsed.data.archived);
  refresh();
  return updated ? { ok: true } : fail("That location no longer exists.");
}

// ─── Ordering ──────────────────────────────────────────────────────────────

const orderingSchema = z.object({
  timezone: z.string().refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz), "Pick a timezone."),
  defaultSlotMinutes: z.int("Slot length must be a whole number.").min(5, "Slots can be 5 minutes at the shortest.").max(120, "Slots can be 120 minutes at the longest."),
  defaultOrdersPerSlot: z.int("Orders per slot must be a whole number.").min(1, "Allow at least 1 order per slot.").max(200, "Keep orders per slot at 200 or fewer."),
  orderingOpensHoursBefore: z.int("Opening time must be a whole number of hours.").min(1, "Ordering opens at least 1 hour before.").max(336, "Ordering can open up to 14 days (336 hours) before."),
  orderingClosesMinutesBefore: z.int("Closing time must be a whole number of minutes.").min(0, "Closing time can't be negative.").max(1440, "Ordering can close up to 24 hours before."),
  slotLeadMinutes: z.int("Lead time must be a whole number of minutes.").min(0, "Lead time can't be negative.").max(240, "Lead time can be 240 minutes at most."),
});

export async function saveOrdering(input: z.input<typeof orderingSchema>): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = orderingSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await updateOrderingDefaults(truck.id, parsed.data);
  refresh();
  revalidatePath(`/${truck.slug}`, "layout");
  return { ok: true };
}

// ─── Taxes ─────────────────────────────────────────────────────────────────

// A string, parsed with string math. Never a float. platformFeeBps is never
// writable from here: no action exists for it.
export async function saveTaxRate(percent: string): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = z.string().max(10).safeParse(percent);
  const bps = parsed.success ? parsePercentToBps(parsed.data) : null;
  if (bps === null || bps > 2000) return fail("Enter a rate between 0 and 20, like 8.25.");

  await updateTaxRateBps(truck.id, bps);
  refresh();
  revalidatePath(`/${truck.slug}`, "layout");
  return { ok: true };
}

// ─── Notifications ─────────────────────────────────────────────────────────

const notificationsSchema = z.object({
  enabled: z.boolean(),
  email: z.string().trim().max(200), // validated as an email only when enabled
});

// null already means "off" downstream (markOrderPaid / getOrderNotification), so no column is needed.
export async function saveNotifications(input: z.input<typeof notificationsSchema>): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = notificationsSchema.safeParse(input);
  if (!parsed.success) return fail("Enter a valid email address.");
  const { enabled, email } = parsed.data;
  if (enabled && !z.email().safeParse(email).success) return fail("Enter a valid email address.");

  // TODO(stream C): send a test email through Resend so the vendor can confirm the address works.
  await updateNotificationEmail(truck.id, enabled ? email : null);
  refresh();
  return { ok: true };
}

// ─── Team (OWNER only) ─────────────────────────────────────────────────────

const memberSchema = z.object({ membershipId: id, role: z.enum(["OWNER", "STAFF"]) });

export async function saveMemberRole(input: z.input<typeof memberSchema>): Promise<ActionResult> {
  const { truck, role, userId } = await requireTruckAccess();
  if (role !== "OWNER") return fail("Only owners can manage the team.");
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return fail("That member can't be updated.");

  const member = (await getTeam(truck.id)).find((m) => m.id === parsed.data.membershipId);
  if (!member) return fail("That member no longer exists.");
  if (member.clerkUserId === userId) return fail("You can't change your own role.");

  const updated = await setMemberRole(truck.id, member.id, parsed.data.role);
  refresh();
  return updated ? { ok: true } : fail("A truck needs at least one owner.");
}

export async function removeMember(membershipId: string): Promise<ActionResult> {
  const { truck, role, userId } = await requireTruckAccess();
  if (role !== "OWNER") return fail("Only owners can manage the team.");
  if (!id.safeParse(membershipId).success) return fail("That member can't be removed.");

  const member = (await getTeam(truck.id)).find((m) => m.id === membershipId);
  if (!member) return fail("That member no longer exists.");
  if (member.clerkUserId === userId) return fail("You can't remove yourself.");

  const removed = await deleteMember(truck.id, member.id);
  refresh();
  return removed ? { ok: true } : fail("A truck needs at least one owner.");
}
