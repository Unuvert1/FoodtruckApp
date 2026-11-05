// The daily housekeeping run: the jobs that have to happen whether or not
// anyone has a dashboard open.
//
//   1. Finish orders nobody closed by hand. A READY order self-advances to
//      PICKED_UP after 30 minutes, but that sweep has only ever run on a page
//      load, so a vendor who shuts their laptop leaves orders stuck on READY.
//   2. Extend repeating stops, so the calendar always runs a fortnight ahead.
//      Opening Schedule does this too; this covers the weeks nobody does.
//   3. Send yesterday's summary to the trucks that asked for one.
//
// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when that variable is
// set on the project. Without the variable the route stays closed, so an
// unconfigured deploy cannot have its data swept by a passer-by.

import { sendDailySummaryEmail } from "@/lib/email";
import { materializeScheduleRules } from "@/lib/schedule/materialize";
import {
  claimDailySummary,
  getDayNumbers,
  getTrucksForDailySummary,
  getTrucksForMaintenance,
  sweepAllAutoCompleted,
} from "@/lib/tenant";
import { addDaysToDateKey, zonedDateKey } from "@/lib/time";

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

  const summaries = await sendDailySummaries(now);

  return Response.json({ completed, scheduled, summaries });
}

/**
 * Yesterday's figures, in each truck's own timezone — a summary of a day that
 * has actually finished. claimDailySummary is what makes a second run in the
 * same day a no-op rather than a duplicate email.
 */
async function sendDailySummaries(now: Date): Promise<number> {
  let sent = 0;

  for (const truck of await getTrucksForDailySummary()) {
    const yesterday = addDaysToDateKey(zonedDateKey(now, truck.timezone), -1);
    if (truck.lastDailySummaryOn === yesterday) continue;

    try {
      const numbers = await getDayNumbers(truck.id, truck.timezone, yesterday);
      if (numbers.orderCount === 0) {
        // A day with no trading is not news. Still claim it, so a later run
        // doesn't keep reconsidering the same empty day.
        await claimDailySummary(truck.id, yesterday);
        continue;
      }
      if (!(await claimDailySummary(truck.id, yesterday))) continue; // another run got there first

      const result = await sendDailySummaryEmail({
        to: truck.notificationEmail,
        truckName: truck.name,
        dayLabel: new Date(`${yesterday}T12:00:00Z`).toLocaleDateString("en-GB", {
          timeZone: "UTC",
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        orderCount: numbers.orderCount,
        netCents: numbers.netCents,
        counterCents: numbers.counterCents,
        onlineCents: numbers.onlineCents,
        topItems: numbers.topItems,
      });
      if (result.sent) sent++;
    } catch (error) {
      console.error("[cron] daily summary failed for truck", truck.id, error);
    }
  }

  return sent;
}
