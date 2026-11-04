// The daily housekeeping run: the two jobs that have to happen whether or not
// anyone has a dashboard open.
//
//   1. Finish orders nobody closed by hand. A READY order self-advances to
//      PICKED_UP after 30 minutes, but that sweep has only ever run on a page
//      load, so a vendor who shuts their laptop leaves orders stuck on READY.
//   2. Extend repeating stops, so the calendar always runs a fortnight ahead.
//      Opening Schedule does this too; this is what covers the weeks nobody does.
//
// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when that variable is
// set on the project. Without the variable the route stays closed, so an
// unconfigured deploy cannot have its data swept by a passer-by.

import { materializeScheduleRules } from "@/lib/schedule/materialize";
import { getTrucksForMaintenance, sweepAllAutoCompleted } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return new Response("Cron isn't configured.", { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Not authorised.", { status: 401 });
  }

  const now = new Date();
  const completed = await sweepAllAutoCompleted(now);

  let scheduled = 0;
  for (const truck of await getTrucksForMaintenance()) {
    // One truck's rules failing must not stop the rest of the run.
    try {
      scheduled += await materializeScheduleRules(truck.id, truck.timezone, now);
    } catch (error) {
      console.error("[cron] couldn't extend the schedule for truck", truck.id, error);
    }
  }

  return Response.json({ completed, scheduled });
}
