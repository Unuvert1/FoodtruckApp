import { NextResponse } from "next/server";
import { z } from "zod";
import { GEO_BIAS, GEO_PROVIDER } from "@/lib/geo";
import { geoRateLimiter } from "@/lib/geo/rate-limit";
import { requireTruckAccess } from "@/lib/tenant";

// Address autocomplete for the vendor's schedule form. Vendor-only on purpose:
// anonymous traffic never reaches the geocoder, and the provider key never
// reaches the browser. We return our own Suggestion shape, never the
// provider's raw body.

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().min(3).max(120),
  sessionToken: z.string().uuid().optional(),
});

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const { truck } = await requireTruckAccess();

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? "",
    sessionToken: searchParams.get("sessionToken") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Type at least 3 characters." }, { status: 400, headers });

  const limit = geoRateLimiter.take(truck.id);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many address lookups. Type the address in manually for now." },
      { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    // A slow provider must not pin this function: give up after 2.5 seconds.
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(2500)]);
    const suggestions = await GEO_PROVIDER.suggest(parsed.data.q, { signal, sessionToken: parsed.data.sessionToken, bias: GEO_BIAS });
    return NextResponse.json({ provider: GEO_PROVIDER.id, suggestions, degraded: false }, { headers });
  } catch {
    // Timeout, throttled upstream, or down: the form offers manual entry.
    return NextResponse.json({ provider: GEO_PROVIDER.id, suggestions: [], degraded: true }, { headers });
  }
}
