// How many orders are waiting to be accepted. The dashboard nav polls this so
// a vendor sitting on POS or Menu still notices an order arriving; the Service
// screen has its own polling and does not use this.

import { NextResponse } from "next/server";
import { countNewOrders, requireTruckAccess } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { truck } = await requireTruckAccess();
  return NextResponse.json(
    { count: await countNewOrders(truck.id) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
