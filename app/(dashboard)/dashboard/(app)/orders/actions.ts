"use server";

// Order-detail mutations. Same discipline as the dashboard's actions.ts:
// requireTruckAccess() for the truck (never an ID from the browser) →
// Zod-validate the input → a lib/tenant.ts function scoped to that truck.
// Advance and cancel are reused from the shared dashboard actions file.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/app/(dashboard)/dashboard/actions";
import { requireTruckAccess, voidOrderLineItem } from "@/lib/tenant";

const id = z.string().min(1).max(50);

const voidLineSchema = z.object({
  orderId: id,
  lineItemId: id,
  reason: z.enum(["SOLD_OUT", "CUSTOMER_REQUEST", "MISTAKE"]),
  refund: z.boolean(),
});

export async function voidLineItem(input: z.input<typeof voidLineSchema>): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = voidLineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That item can't be removed." };

  const { orderId, lineItemId, reason, refund } = parsed.data;
  // voidOrderLineItem is gated on voidedAt: null, so a line can't be voided twice.
  const result = await voidOrderLineItem(truck.id, orderId, lineItemId, { reason, refund, now: new Date() });

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${truck.slug}`, "layout");

  if (result === "voided") return { ok: true };
  if (result === "already") return { ok: false, error: "That item was already removed." };
  return { ok: false, error: "That item can't be removed anymore." };
}
