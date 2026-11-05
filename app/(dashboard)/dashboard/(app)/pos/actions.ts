"use server";

// Counter sales. Same shape as the other dashboard mutations:
// requireTruckAccess() for the truck (never an ID from the browser) →
// Zod-validate → createOrder, which is the single order-creation path.
//
// Not owner-only, unlike settings and schedule: working the window is exactly
// what a STAFF member is there to do.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createOrder } from "@/lib/orders/createOrder";
import { MAX_QUANTITY_PER_LINE } from "@/lib/pricing";
import { requireTruckAccess } from "@/lib/tenant";

const id = z.string().min(1).max(50);

const saleSchema = z.object({
  lines: z
    .array(
      z.object({
        menuItemId: id,
        optionIds: z.array(id).max(30),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
      })
    )
    .min(1, "Add something to the check first.")
    .max(100, "That's too many lines for one check."),
  tender: z.enum(["CASH", "CARD", "OTHER"]),
});

export type SaleResult = { ok: true; orderNumber: string } | { ok: false; error: string };

export async function recordCounterSale(input: z.input<typeof saleSchema>): Promise<SaleResult> {
  const { truck } = await requireTruckAccess();

  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "That sale couldn't be recorded." };
  }

  const result = await createOrder({
    truckId: truck.id,
    source: "COUNTER",
    lines: parsed.data.lines,
    tender: parsed.data.tender,
    customerName: "Counter sale",
  });
  if (!result.ok) return result;

  // The sale lands in the day's totals on the Service screen.
  revalidatePath("/dashboard", "layout");
  return { ok: true, orderNumber: result.orderNumber };
}
