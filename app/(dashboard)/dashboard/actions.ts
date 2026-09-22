"use server";

// Every dashboard mutation. Each one: requireTruckAccess() for the truck
// (never an ID from the browser) → Zod-validate the input → a lib/tenant.ts
// function that scopes the write to that truck.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  advanceOrderStatus,
  cancelOrder,
  createMenuItem,
  createSection,
  createTruckForUser,
  isSlugTaken,
  joinDemoTruck,
  requireTruckAccess,
  setItemArchived,
  setItemAvailability,
  updateMenuItem,
  updateNotificationEmail,
  userHasTruck,
} from "@/lib/tenant";
import { NEXT_STATUS } from "@/lib/orders/status";
import { parseDollarsToCents } from "@/lib/money";

export type ActionResult = { ok: true } | { ok: false; error: string };

const id = z.string().min(1).max(50);
const fail = (error: string): ActionResult => ({ ok: false, error });

function refresh(truckSlug: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${truckSlug}`, "layout");
}

// ─── Orders ────────────────────────────────────────────────────────────────

const advanceSchema = z.object({ orderId: id, from: z.enum(["PAID", "ACCEPTED", "PREPARING", "READY"]) });

export async function advanceOrder(input: z.input<typeof advanceSchema>): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = advanceSchema.safeParse(input);
  if (!parsed.success) return fail("That order can't be updated.");
  const { orderId, from } = parsed.data;

  const moved = await advanceOrderStatus(truck.id, orderId, from, NEXT_STATUS[from]);
  refresh(truck.slug);
  return moved ? { ok: true } : fail("This order was already updated. The queue has been refreshed.");
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  if (!id.safeParse(orderId).success) return fail("That order can't be cancelled.");

  // TODO(Stream C): refund the payment through Stripe as part of cancelling.
  const cancelled = await cancelOrder(truck.id, orderId);
  refresh(truck.slug);
  return cancelled ? { ok: true } : fail("This order can't be cancelled anymore.");
}

// ─── Stock & menu ──────────────────────────────────────────────────────────

export async function setStock(input: { itemId: string; isAvailable: boolean }): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = z.object({ itemId: id, isAvailable: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail("That item can't be updated.");

  const updated = await setItemAvailability(truck.id, parsed.data.itemId, parsed.data.isAvailable);
  refresh(truck.slug);
  return updated ? { ok: true } : fail("That item no longer exists.");
}

const itemSchema = z.object({
  itemId: id.optional(),
  sectionId: id,
  name: z.string().trim().min(1, "Give the item a name.").max(80, "Keep the name under 80 characters."),
  description: z.string().trim().max(300, "Keep the description under 300 characters."),
  price: z.string().max(20),
  isAvailable: z.boolean(),
});

export type SaveItemResult = ActionResult | { ok: false; error: string; field: "name" | "description" | "price" };

export async function saveMenuItem(input: z.input<typeof itemSchema>): Promise<SaveItemResult> {
  const { truck } = await requireTruckAccess();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    return field === "name" || field === "description"
      ? { ok: false, error: issue.message, field }
      : fail("Check the item's details and try again.");
  }

  const priceCents = parseDollarsToCents(parsed.data.price);
  if (priceCents === null || priceCents > 100_000) {
    return { ok: false, error: "Enter a price like 12.50.", field: "price" };
  }

  const { itemId, sectionId, name, description, isAvailable } = parsed.data;
  const data = { sectionId, name, description, isAvailable, priceCents };
  const saved = itemId ? await updateMenuItem(truck.id, itemId, data) : await createMenuItem(truck.id, data);
  refresh(truck.slug);
  return saved ? { ok: true } : fail("That section or item no longer exists.");
}

export async function setArchived(input: { itemId: string; archived: boolean }): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = z.object({ itemId: id, archived: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail("That item can't be updated.");

  const updated = await setItemArchived(truck.id, parsed.data.itemId, parsed.data.archived);
  refresh(truck.slug);
  return updated ? { ok: true } : fail("That item no longer exists.");
}

export async function addSection(name: string): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = z.string().trim().min(1, "Give the section a name.").max(40).safeParse(name);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const created = await createSection(truck.id, parsed.data);
  refresh(truck.slug);
  return created ? { ok: true } : fail("Your truck doesn't have a menu yet.");
}

// ─── Settings ──────────────────────────────────────────────────────────────

export async function saveNotificationEmail(email: string): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const trimmed = email.trim();
  if (trimmed && !z.email().safeParse(trimmed).success) return fail("Enter a valid email address.");

  await updateNotificationEmail(truck.id, trimmed || null);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// ─── Onboarding ────────────────────────────────────────────────────────────

// Top-level paths a truck slug can't take, since /<slug> is the storefront.
const RESERVED_SLUGS = new Set(["dashboard", "sign-in", "sign-up", "api", "order", "admin", "settings", "help", "about"]);

const truckSchema = z.object({
  name: z.string().trim().min(1, "Enter your truck's name.").max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/, "Use 3–40 lowercase letters, numbers, and dashes.")
    .refine((s) => !RESERVED_SLUGS.has(s), "That address is reserved. Try another."),
  timezone: z.string().refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz), "Pick a timezone."),
});

export type CreateTruckResult = { ok: false; error: string; field?: "name" | "slug" | "timezone" };

async function primaryEmail(): Promise<string | null> {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress ?? null;
}

export async function createTruck(input: z.input<typeof truckSchema>): Promise<CreateTruckResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (await userHasTruck(userId)) redirect("/dashboard");

  const parsed = truckSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path[0] as "name" | "slug" | "timezone";
    return { ok: false, error: issue.message, field };
  }
  if (await isSlugTaken(parsed.data.slug)) {
    return { ok: false, error: "That address is taken. Try another.", field: "slug" };
  }

  await createTruckForUser(userId, { ...parsed.data, notificationEmail: await primaryEmail() });
  redirect("/dashboard");
}

export async function joinDemo(): Promise<CreateTruckResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_TRUCK_JOIN !== "true") {
    return { ok: false, error: "The demo truck isn't available here." };
  }

  const joined = await joinDemoTruck(userId, await primaryEmail());
  if (!joined) return { ok: false, error: "The demo truck hasn't been seeded. Run: npx prisma db seed" };
  redirect("/dashboard");
}
