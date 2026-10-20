"use server";

// Every Settings mutation. Same discipline as the dashboard's actions.ts:
// requireTruckAccess() for the truck (never an ID from the browser) →
// Zod-validate the input → a lib/tenant.ts function scoped to that truck →
// revalidate.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/app/(dashboard)/dashboard/actions";
import { sendInviteEmail, sendTestEmail, type SendResult } from "@/lib/email";
import { inviteExpiry, newInviteToken, normalizeEmail } from "@/lib/invites";
import { parsePercentToBps } from "@/lib/money";
import { slugSchema } from "@/lib/slug";
import {
  countFutureServicesAt,
  createLocation,
  deleteMember,
  findLocationByPlaceId,
  getTeam,
  isSlugTaken,
  createOrRefreshInvite,
  renewInvite,
  requireTruckAccess,
  revokeInvite,
  setLocationArchived as archiveLocation,
  setMemberRole,
  setTruckArchived,
  updateNotifications,
  updateLocation,
  updateOrderingDefaults,
  updateStorefront,
  updateTaxRateBps,
  updateTruckProfile,
  updateTruckSlug,
} from "@/lib/tenant";

const id = z.string().min(1).max(50);
const fail = (error: string): ActionResult => ({ ok: false, error });

// Settings change the whole business — the storefront URL, the tax customers
// are charged — so every one of them is owner-only. The rail already hides
// them from staff, but a hidden link is not a permission.
const OWNER_ONLY = "Only owners can change settings.";

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
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await updateTruckProfile(truck.id, parsed.data);
  refresh();
  revalidatePath(`/${truck.slug}`, "layout");
  return { ok: true };
}

// The slug is its own action: it is the only setting that breaks live links.
export async function saveSlug(slug: string): Promise<ActionResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
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
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
  const parsed = storefrontSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await updateStorefront(truck.id, { ...parsed.data, brandColor: parsed.data.brandColor.toUpperCase() });
  refresh();
  revalidatePath(`/${truck.slug}`, "layout");
  return { ok: true };
}

// ─── Locations ─────────────────────────────────────────────────────────────

// The same shape as a Schedule spot (SpotInput): a geocoder result or a typed address.
const locationSchema = z.object({
  locationId: id.optional(), // absent = create
  provider: z.enum(["geoapify", "photon", "manual"]),
  providerPlaceId: z.string().max(200).nullable(),
  name: z.string().trim().min(1, "Give the spot a name.").max(60, "Keep the name under 60 characters."),
  addressLine: z.string().trim().min(1, "Enter the street address.").max(160, "Keep the address under 160 characters."),
  city: z.string().trim().max(80),
  region: z.string().trim().max(80),
  postcode: z.string().trim().max(20),
  // Range-checked, not recomputed. Null means no pin (typed by hand, or the geocoder had none).
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  notes: z.string().trim().max(200, "Keep the notes under 200 characters."),
});

export type SaveLocationResult = { ok: true; note?: string } | { ok: false; error: string };

const ALREADY_HAVE = "You already have a spot here.";

export async function saveLocation(input: z.input<typeof locationSchema>): Promise<SaveLocationResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
  const parsed = locationSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { locationId, ...place } = parsed.data;

  // Same geocoder result as a spot already saved: reuse it rather than duplicate it.
  const known = place.provider !== "manual" && place.providerPlaceId ? await findLocationByPlaceId(truck.id, place.provider, place.providerPlaceId) : null;
  if (known && known.id !== locationId) return locationId ? fail(`${ALREADY_HAVE} It's saved as "${known.name}".`) : { ok: true, note: ALREADY_HAVE };

  if (locationId) {
    if (!(await updateLocation(truck.id, locationId, place))) return fail("That location no longer exists.");
  } else {
    await createLocation(truck.id, place);
  }
  refresh();
  revalidatePath(`/${truck.slug}`, "layout");
  return place.lat == null || place.lng == null ? { ok: true, note: "Saved, but without a map pin. Directions will use the street address." } : { ok: true };
}

/** How many stops are still to come at this spot, so the sheet can warn before archiving it. */
export async function countSpotStops(locationId: string): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return { ok: false, error: OWNER_ONLY };
  if (!id.safeParse(locationId).success) return { ok: false, error: "That location can't be checked." };
  return { ok: true, count: await countFutureServicesAt(truck.id, locationId, new Date()) };
}

export async function setLocationArchived(input: { locationId: string; archived: boolean }): Promise<ActionResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
  const parsed = z.object({ locationId: id, archived: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail("That location can't be updated.");

  const updated = await archiveLocation(truck.id, parsed.data.locationId, parsed.data.archived);
  refresh();
  revalidatePath(`/${truck.slug}`, "layout");
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
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
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
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
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
  notifyNewOrder: z.boolean(),
  notifyCancellation: z.boolean(),
  notifyDailySummary: z.boolean(),
});

// null already means "off" downstream (markOrderPaid / getOrderNotification), so the master switch needs no column.
export async function saveNotifications(input: z.input<typeof notificationsSchema>): Promise<ActionResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
  const parsed = notificationsSchema.safeParse(input);
  if (!parsed.success) return fail("Enter a valid email address.");
  const { enabled, email, ...events } = parsed.data;
  if (enabled && !z.email().safeParse(email).success) return fail("Enter a valid email address.");

  await updateNotifications(truck.id, { notificationEmail: enabled ? email : null, ...events });
  refresh();
  return { ok: true };
}

export type SaveResult = { ok: true; note?: string } | { ok: false; error: string };

/** Sends to the saved address, not the one being typed, so a pass proves what orders will actually use. */
export async function sendTestNotification(): Promise<SaveResult> {
  const { truck, role, notificationEmail } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
  if (!notificationEmail) return fail("Save an email address first.");

  const sent = await sendTestEmail({ to: notificationEmail, truckName: truck.name });
  return sent.sent ? { ok: true, note: `Sent to ${notificationEmail}. Check your inbox (and spam).` } : fail(`Not sent: ${sent.error}`);
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

// ─── Team invites (OWNER only) ─────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().trim().max(200).pipe(z.email("Enter a valid email address.")),
  role: z.enum(["OWNER", "STAFF"]),
});

/** The invite exists either way; this says whether the email actually went out. */
function inviteOutcome(email: string, sent: SendResult): SaveResult {
  if (sent.sent) return { ok: true, note: `Invite sent to ${email}.` };
  if (sent.reason === "not-configured") return { ok: true, note: "Invite created, but this server can't send email. Copy the link from the list below." };
  return fail(`Invite created, but the email didn't send: ${sent.error} You can copy the link from the list below.`);
}

export async function inviteMember(input: z.input<typeof inviteSchema>): Promise<SaveResult> {
  const { truck, role, userId } = await requireTruckAccess();
  if (role !== "OWNER") return fail("Only owners can manage the team.");
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const email = normalizeEmail(parsed.data.email);
  const now = new Date();
  const expiresAt = inviteExpiry(now);
  const invite = await createOrRefreshInvite(truck.id, { email, role: parsed.data.role, invitedBy: userId, token: newInviteToken(), expiresAt, now });
  if (invite.status === "already_member") return fail("That person is already on your team.");

  refresh();
  return inviteOutcome(email, await sendInviteEmail({ to: email, truckName: truck.name, role: parsed.data.role, token: invite.token, expiresAt }));
}

// Resending rotates the token, so the link in the earlier email stops working.
export async function resendInvite(inviteId: string): Promise<SaveResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail("Only owners can manage the team.");
  if (!id.safeParse(inviteId).success) return fail("That invite can't be resent.");

  const token = newInviteToken();
  const expiresAt = inviteExpiry(new Date());
  const invite = await renewInvite(truck.id, inviteId, token, expiresAt);
  if (!invite) return fail("That invite is no longer pending.");

  refresh();
  return inviteOutcome(invite.email, await sendInviteEmail({ to: invite.email, truckName: truck.name, role: invite.role, token, expiresAt }));
}

export async function revokePendingInvite(inviteId: string): Promise<ActionResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail("Only owners can manage the team.");
  if (!id.safeParse(inviteId).success) return fail("That invite can't be revoked.");

  const revoked = await revokeInvite(truck.id, inviteId, new Date());
  refresh();
  return revoked ? { ok: true } : fail("That invite is no longer pending.");
}

// ─── Your account (any member) ─────────────────────────────────────────────

// The one settings action that is not owner-only: it acts on the caller's own
// membership and nobody else's. deleteMember keeps the last-owner rule.
export async function leaveTruck(): Promise<ActionResult> {
  const { truck, userId } = await requireTruckAccess();

  const me = (await getTeam(truck.id)).find((m) => m.clerkUserId === userId);
  if (!me) return fail("You're not on this truck.");

  const left = await deleteMember(truck.id, me.id);
  if (!left) return fail("You're the only owner. Make someone else an owner first, or close the truck.");
  refresh();
  return { ok: true };
}

// ─── Danger zone (OWNER only) ──────────────────────────────────────────────

const closeSchema = z.object({ confirmName: z.string().max(100) });

export async function closeTruck(input: z.input<typeof closeSchema>): Promise<ActionResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);
  const parsed = closeSchema.safeParse(input);
  // Checked here, not just in the form: the typed name is the whole safety.
  if (!parsed.success || parsed.data.confirmName.trim() !== truck.name) return fail("Type the truck's name exactly to confirm.");

  await setTruckArchived(truck.id, true);
  refresh();
  revalidatePath(`/${truck.slug}`, "layout");
  return { ok: true };
}

export async function reopenTruck(): Promise<ActionResult> {
  const { truck, role } = await requireTruckAccess();
  if (role !== "OWNER") return fail(OWNER_ONLY);

  await setTruckArchived(truck.id, false);
  refresh();
  revalidatePath(`/${truck.slug}`, "layout");
  return { ok: true };
}
