// Finishes orders nobody closed by hand.
//
// A READY order self-advances to PICKED_UP after 30 minutes, but that sweep has
// only ever run when someone loaded the dashboard — so a vendor who shuts their
// laptop leaves orders stuck on READY forever. This endpoint is the version
// that runs with nobody watching.
//
// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when that variable is
// set on the project. Without the variable the route stays closed, so an
// unconfigured deploy cannot have its data swept by a passer-by.

import { sweepAllAutoCompleted } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return new Response("Cron isn't configured.", { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Not authorised.", { status: 401 });
  }

  const completed = await sweepAllAutoCompleted(new Date());
  return Response.json({ completed });
}
