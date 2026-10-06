// The whole address-lookup contract. One shape in, one shape out: the UI and
// the Server Actions only ever see `Suggestion`, never a provider's raw body,
// so swapping providers touches lib/geo/ and nothing else.

export type Suggestion = {
  /** The provider's opaque id, or null when it doesn't issue one. */
  providerPlaceId: string | null;
  /** Bold first line: the place's name, or "412 Mill St". */
  primary: string;
  /** Muted second line: "Northfield, IL 60093". */
  secondary: string;
  /** Pre-filled into Location.name; the vendor may edit it. */
  suggestedName: string;
  addressLine: string;
  city: string;
  region: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
};

/** One credit in the storefront footer: "Addresses from" + a link. */
export type AttributionLink = { lead: string; label: string; href: string };

export type SuggestOptions = {
  signal: AbortSignal;
  /** Ignored by today's providers; a Google adapter would forward it to bundle one typing session into one billable event. */
  sessionToken?: string;
  /** From GEO_BIAS: "countrycode:us" or "proximity:<lng>,<lat>". */
  bias?: string;
  limit?: number;
};

export type GeoProvider = {
  /** Stored on Location.provider: "geoapify" | "photon". */
  readonly id: string;
  /** Rendered in the storefront footer. A licence obligation: never omit. */
  readonly attribution: AttributionLink[];
  /** Throws on transport failure; the route turns that into a degraded response. */
  suggest(query: string, options: SuggestOptions): Promise<Suggestion[]>;
};
