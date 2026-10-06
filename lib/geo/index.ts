import "server-only";
import { geoapify } from "@/lib/geo/geoapify";
import { photon } from "@/lib/geo/photon";
import type { GeoProvider } from "@/lib/geo/types";

/**
 * The active address-lookup provider. Swapping providers is this one line:
 * a Geoapify key switches to Geoapify; blank uses keyless Photon, so
 * autocomplete works on a fresh clone. The key is read only here (server-only),
 * never as a NEXT_PUBLIC_* variable.
 */
export const GEO_PROVIDER: GeoProvider = process.env.GEOAPIFY_API_KEY ? geoapify(process.env.GEOAPIFY_API_KEY) : photon();

export const GEO_BIAS: string | undefined = process.env.GEO_BIAS?.trim() || undefined;
