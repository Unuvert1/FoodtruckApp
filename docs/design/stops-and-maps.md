# Spec — Stops & Locations (vendor address autocomplete → customer-visible stop)

Status: proposal, no code written. Researched 2026-10-05.

The user's ask, verbatim:

> "Idk where you add it but vendor is supposed to be able to add their designated spots SO
> seamlessly into their next route like maybe they enter the adress in and it integrates API
> with some Google or Maps and it then picks that up into the stop and the user side can see
> that too (important)."

Translated into the existing domain: a vendor types an address, picks a suggestion, it becomes a
saved **Location** with real coordinates, and that Location attaches to an upcoming **Service**
that customers see on the storefront with a working directions link. Today `Location` rows exist
only in `prisma/seed.ts` and there is no vendor UI for either `Location` or `Service` — the
dashboard literally says so:

> `app/(dashboard)/dashboard/(app)/page.tsx`: "No stops scheduled … Scheduling stops from the
> dashboard is coming next."

This spec closes that gap.

---

## 1. Provider recommendation

### The decision

**Use Geoapify's Address Autocomplete API as the primary provider, and ship a keyless Photon
(Komoot) adapter as the zero-config default so the feature works before anyone signs up for
anything.** Both sit behind one small module (`lib/geo/`) so either can be swapped out, and a
Google adapter can be added later without touching any UI.

**For the map: no map tiles in v1.** Render the address as text plus a keyless **"Get directions"**
deep link to Google Maps (and a second small Apple Maps link). A static map image is an optional
phase-2 add-on. Reasoning in §1.4.

### 1.1 What each provider actually costs and demands

Terminology first, since the user is not an experienced dev:

- **Geocoding** = turning text ("412 Mill St") into coordinates.
- **Autocomplete / typeahead** = geocoding on every few keystrokes, so suggestions appear while
  you type. It is many times more requests than a single lookup, which is exactly why providers
  price and rate-limit it separately.
- **Deep link** = an ordinary `https://` link that opens the Maps app already pointed at a
  destination. No API, no key, no quota.

| Provider | Key? | Credit card? | Free allowance | Price past it | May we store lat/lng? | Attribution |
|---|---|---|---|---|---|---|
| **Geoapify Autocomplete** | yes | **no** | 3,000 req/day (~90k/mo), 5 req/s | $59/mo for 10k/day | **yes, permanently** | "Powered by Geoapify" + © OpenStreetMap contributors |
| **Photon (komoot public)** | **no** | no | undefined "be fair"; throttled, no availability guarantee | n/a (self-host) | yes (ODbL) | © OpenStreetMap contributors |
| Google Places Autocomplete (New) | yes | **yes, mandatory** | 10,000 Autocomplete Requests/mo (Essentials SKU); old $200 credit is gone | ~$2.83/1,000 requests; a session ending in Place Details Pro ≈ $17/1,000 sessions | **no — 30 days max, then delete** | Google branding rules |
| Mapbox Search Box | yes | yes for PAYG | 500 sessions/mo (Search Box); Temporary Geocoding 100k req/mo | $3.00/1,000 sessions | **no for Temporary Geocoding — storing/caching forbidden** | Mapbox wordmark |
| OSM Nominatim (public) | no | no | 1 req/s absolute max | n/a | yes (ODbL) | © OpenStreetMap contributors |
| LocationIQ | yes | reportedly yes | 5,000 req/day, 2 req/s | tiered | yes | OSM |

### 1.2 Why the two obvious choices are the wrong ones here

**Google is disqualified twice over, not once.**

1. *Billing is mandatory.* "To use the Places API, you must enable billing on each of your
   projects and include an API key." Holding a key is free and you are only billed for calls, but
   someone has to attach a real card to a Google Cloud project. For a two-person class project
   that is exactly the signup friction the user said they don't want — and it means a stray loop
   in dev can bill a student's card.
2. *We are not allowed to keep the coordinates.* Google's Service Specific Terms let you cache
   lat/lng for **up to 30 consecutive calendar days**, then you must delete them. Our whole design
   stores `Location.lat` / `Location.lng` forever so a truck's regular brewery stop keeps working.
   Place IDs are exempt and may be stored indefinitely — but then every page render needs a fresh
   (billable) Place Details call to get coordinates back. That turns a storefront page view into a
   paid API call. Wrong shape for this app.

**Mapbox is disqualified by the same storage rule, harder.** The free Temporary Geocoding tier is
explicit: "you may not export, store or cache Temporary Geocodes." Storing is only permitted via
the **Permanent** Geocoding endpoint, which is not what the free allowance covers. And the Search
Box free tier is only **500 sessions/month**, which a demo plus two devs testing could burn.

**Nominatim's public instance forbids this feature outright.** Its usage policy, on autocomplete:
"This is not yet supported by Nominatim and you **must not** implement such a service on the
client side using the API," with an absolute ceiling of 1 request/second. Self-hosting Nominatim
is a multi-gigabyte Postgres import — far out of scope.

### 1.3 Why Geoapify + Photon

**Geoapify** is the only option that clears every constraint at once:

- Free plan: **3,000 credits/day at 5 req/s**, explicitly usable "for commercial websites, apps,
  and business projects, including in production."
- **No credit card.** Email signup, copy a key, done — call it two minutes.
- **Storage is allowed.** Data is OpenStreetMap under ODbL; per the OSMF Geocoding Community
  Guideline, individual geocoding results may be stored alongside your own proprietary data
  without triggering share-alike, as long as you aren't reassembling a substantial part of OSM.
  We store a handful of stops per truck — nowhere near that line.
- A real autocomplete endpoint (`/v1/geocode/autocomplete`) with `bias`, `filter`, `limit`, `lang`
  and a stable GeoJSON response.
- Obligation: show **"Powered by Geoapify"** near where the data is used, plus the OSM credit. One
  muted line in the storefront footer satisfies both (§4.5).

**Photon** is the escape hatch that makes the feature work on a fresh `git clone` with an empty
`.env.local`:

- **No key at all.** `https://photon.komoot.io/api/?q=…&limit=5`.
- Built for exactly this: it advertises "typeahead suggestion" and "search as you type."
- Returns GeoJSON with `geometry.coordinates = [lon, lat]` and properties `osm_id`, `osm_type`,
  `name`, `housenumber`, `street`, `city`, `county`, `state`, `postcode`, `country`, `countrycode`.
- Caveats to state plainly in the README: "please be fair — extensive usage will be throttled. We
  do not guarantee for the availability." So it is fine for development and a class demo, and not
  something to point a real truck's dashboard at.

Shipping both costs about 40 extra lines (one more adapter file) and buys: zero-friction day one,
and a one-line upgrade (`GEOAPIFY_API_KEY=…`) when reliability matters. That is the whole point of
putting the provider behind an interface.

### 1.4 Map display: directions deep link only, for v1

Three options were considered.

1. **Directions deep link — chosen.** The Google Maps URLs API needs **no API key** ("You don't
   need a Google API key to use Maps URLs") and the format is
   `https://www.google.com/maps/dir/?api=1&destination=<lat>%2C<lng>`. Apple devices get a second
   link, `https://maps.apple.com/?daddr=<lat>,<lng>&dirflg=d`. Zero cost, zero quota, zero
   dependencies, and it hands the customer off to the navigation app they already trust and have
   signed into. A customer standing on a sidewalk wants turn-by-turn, not a picture.
2. **Static map image — phase 2, optional.** Geoapify Static Maps would draw a PNG, but every
   storefront view spends a credit against the 3,000/day budget, so it needs our own
   `/api/map/[locationId]` proxy with `Cache-Control: immutable` keyed on the coordinates. Real
   work, low payoff. Deferred, with the route sketched in §6 so it can be bolted on.
3. **Interactive map (MapLibre GL + raster tiles) — rejected.** Adds a ~200 kB client bundle to a
   storefront whose whole aesthetic is fast and typographic, needs a tile provider (OSM's own tile
   usage policy forbids app use at any volume), and gives the customer nothing the deep link
   doesn't. It would also be the only drop-shadowed, non-hairline rectangle on the page.

`lib/service.ts` already has `mapsUrl(lat, lng)` producing a *search* URL. §6 replaces it with
`directionsUrl(location)` / `appleDirectionsUrl(location)` that prefer coordinates and fall back to
the address text, so a Location with no coordinates still gets a usable link.

### 1.5 Sources

- [Google Maps Platform — Places API usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) — "you must enable billing on each of your projects"; the $200 monthly credit applied only until 2025-02-28.
- [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) — lat/lng cacheable for up to 30 consecutive calendar days; Place IDs exempt.
- [Google Places API pricing 2026 — per-SKU breakdown](https://bizcollect.dev/blog/google-places-api-pricing) — ~$2.83/1,000 Autocomplete Requests after 10,000 free/month.
- [Google Maps URLs — get started](https://developers.google.com/maps/documentation/urls/get-started) — "You don't need a Google API key to use Maps URLs."
- [Mapbox pricing](https://www.mapbox.com/pricing) — Search Box: 500 free sessions/month, then $3.00/1,000; Temporary Geocoding 100,000 free requests/month.
- [Mapbox — Temporary versus Permanent Geocoding](https://docs.mapbox.com/help/dive-deeper/understand-temporary-vs-permanent-geocoding/) and [Mapbox Service Terms](https://assets.website-files.com/5d4296d7a839ea49599adba1/5ea348f6b72add6c63b8d0aa_Mapbox%20Service%20Terms.pdf) — "you may not export, store or cache Temporary Geocodes."
- [OSMF Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) — max 1 req/s; autocomplete "must not" be implemented against it; Referer/User-Agent required; ODbL attribution.
- [Photon (komoot.io)](https://photon.komoot.io/) — keyless, typeahead-oriented, "please be fair — extensive usage will be throttled."
- [komoot/photon discussion #598](https://github.com/komoot/photon/discussions/598) — self-host if you have to ask about limits.
- [Geoapify pricing](https://www.geoapify.com/pricing/) — Free plan 3,000 credits/day, 5 req/s, no credit card, production use allowed, "Powered by Geoapify" attribution.
- [Geoapify Address Autocomplete API docs](https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/) — endpoint, params, GeoJSON response fields.
- [OSMF Licence/Community Guidelines — Geocoding](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Geocoding_-_Guideline) — storing individual geocodes does not trigger share-alike.

---

## 2. Schema changes

Three principles drive these edits, all from `CLAUDE.md`: every tenant row carries `truckId`;
anything an order may reference is soft-deleted, never hard-deleted; timestamps are UTC.

A `Service` points at a `Location`, and an `Order` points at a `Service`. So a `Location` is
transitively referenced by orders and **must not be deletable**. `Location` gets `archivedAt`,
exactly like `MenuItem`.

### 2.1 `Location` — reusable saved spot

Locations are already one-to-many with Service (`services Service[]`), so reuse is free; what's
missing is the vendor-facing metadata that makes reuse *pleasant* (recency ordering, dedupe by
provider id) and soft delete.

```prisma
model Location {
  id              String    @id @default(cuid())
  truckId         String
  name            String // what customers see in big letters: "Riverside Brewing Co."
  addressLine     String
  city            String
  region          String    @default("") // state/province, for the address line and search fallback
  postcode        String    @default("")
  lat             Float? // null when the geocoder was down and the vendor typed it by hand
  lng             Float?
  notes           String? // parking note, shown to customers: "Patio side, by the loading door."
  // Where the coordinates came from, so a future provider swap can tell its own ids apart.
  provider        String    @default("manual") // "geoapify" | "photon" | "manual"
  providerPlaceId String? // the provider's opaque id; kept for re-lookup, never trusted as unique
  lastUsedAt      DateTime? // bumped when a Service is scheduled here; drives "your spots" order
  archivedAt      DateTime? // soft delete: a past order's Service still points here
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  truck    Truck     @relation(fields: [truckId], references: [id], onDelete: Cascade)
  services Service[]

  @@index([truckId])
  @@index([truckId, archivedAt])
  @@index([truckId, provider, providerPlaceId])
}
```

Decisions inside that block:

- **`lat`/`lng` become nullable.** This is the one change that might look wrong. It is deliberate:
  the geocoder is a third-party service that can be down, rate-limited, or simply missing a
  farmers-market stall. A vendor must never be blocked from scheduling tomorrow's lunch because
  Photon timed out. With nullable coordinates, `directionsUrl()` falls back to a text search on
  the address, which is what a human would type anyway. Widening a column to nullable is a safe
  migration — existing seeded rows keep their values.
- **`providerPlaceId` is indexed, not unique.** Deduping "I already have this brewery" is a
  *suggestion* in the UI (`findLocationByPlaceId`), not a database constraint. A unique constraint
  on an id from a provider we don't control is brittle (ids can churn; Geoapify documents no
  stability guarantee), and a truck may legitimately want two spots at one address with different
  names and parking notes ("Stall 14" vs "Stall 22").
- **`lastUsedAt`, not `isFavorite`.** Recency is self-maintaining; a favourite flag is one more
  thing to curate. Sorting "your spots" by `lastUsedAt desc` puts last week's stop at the top,
  which is the whole "repeat last week" affordance for free.
- **`region` / `postcode` default to `""`,** matching how `Truck.tagline` and
  `MenuItem.description` already handle optional text in this schema (empty string, not null) so
  template literals never print "null".

### 2.2 `Service` — one per-stop note, plus timestamps

```prisma
model Service {
  id               String        @id @default(cuid())
  truckId          String
  locationId       String
  menuId           String
  startsAt         DateTime
  endsAt           DateTime
  orderingOpensAt  DateTime
  orderingClosesAt DateTime
  slotMinutes      Int
  ordersPerSlot    Int
  status           ServiceStatus @default(DRAFT)
  orderCount       Int           @default(0)
  publicNote       String        @default("") // ← NEW: one-off note for this stop only
  createdAt        DateTime      @default(now()) // ← NEW
  updatedAt        DateTime      @updatedAt      // ← NEW

  truck       Truck        @relation(fields: [truckId], references: [id], onDelete: Cascade)
  location    Location     @relation(fields: [locationId], references: [id])
  menu        Menu         @relation(fields: [menuId], references: [id])
  pickupSlots PickupSlot[]
  orders      Order[]

  @@index([truckId, startsAt])
}
```

- **`publicNote`** is the difference between a permanent property of the place
  (`Location.notes` = "patio side, by the loading door") and a fact about today
  (`Service.publicNote` = "cash only today, card reader is down"). Both render on the hero.
- **`createdAt`/`updatedAt`** are needed to find "the stop you made most recently" for form
  defaults, and are good hygiene the model is missing.
- The `location` relation keeps Prisma's default `onDelete: Restrict`. That is correct: the
  database should refuse to delete a Location that a Service points at. Archiving is the only path.

### 2.3 What does **not** change

- No `ServiceStatus` values added. `DRAFT` already means "saved, not visible" — the vendor's
  "Save as draft" writes `DRAFT`, "Publish" writes `PUBLISHED`, "Cancel this stop" writes
  `CANCELLED`. `VISIBLE_SERVICE_STATUSES` in `lib/tenant.ts` already filters correctly.
- No new table for routes/days. A "route" is just the set of Services on one date; the schedule
  screen groups by zoned date at render time. Introducing a `Route` model now would be a model
  with no behaviour attached to it.
- `PickupSlot` is unchanged. Publishing generates rows exactly as `prisma/seed.ts` already does.

### 2.4 Migration

```
npx prisma migrate dev --name stops_and_locations
```

One migration, additive plus one nullability widening; no data backfill needed. Per `CLAUDE.md`:
whoever edits `schema.prisma` commits the migration.

`prisma/seed.ts` needs matching edits so demo data exercises the new columns: add
`region: "IL"`, `postcode`, `provider: "manual"` to each entry in `LOCATIONS`, set `lastUsedAt`
when creating each Service, and give one stop a `publicNote`. `lib/types.ts`'s `Location` type
gains the same fields, and `toLocation()` in `lib/tenant.ts` maps them.

---

## 3. The vendor flow

### 3.1 Where it lives: a fourth tab, **Schedule**

`components/dashboard/dashboard-nav.tsx` currently has three links: Service / Menu / Settings.
**Add `{ href: "/dashboard/schedule", label: "Schedule" }` between Menu and Settings.**

Justified against each existing tab:

- **Not inside Service.** `/dashboard` is the screen a vendor keeps open *during* service: order
  queue left, stock right, auto-refreshing every 10 seconds, collapsing to two tabs on a phone.
  It is a live operating console with one job. Dropping a scheduling CRUD into it would mean a
  cook poking at date pickers while tickets land. Its only job regarding stops is the `<select>`
  that *chooses* among them — reading the schedule, not writing it.
- **Not inside Settings.** Settings holds things configured once and rarely touched: notification
  email, slug, timezone, tax rate. Stops change every single week. Burying the most frequent
  weekly task behind "Settings" is the opposite of "SO seamlessly."
- **A fourth top-level tab is cheap.** The nav is a flat array of links with a 3px underline for
  the active item; four 15px semibold labels at `px-3` measure roughly 290px, so Service · Menu ·
  Schedule · Settings still fits a 360px phone without scrolling or a hamburger. Nothing about the
  nav component changes except one array entry.
- **The entry point already exists.** `/dashboard`'s empty state says scheduling is "coming next."
  That paragraph becomes a real primary button: **"Schedule a stop" → `/dashboard/schedule`**. The
  stop `<select>` on the populated Service screen gains a quiet trailing "Edit schedule" link.

### 3.2 The Schedule screen — `/dashboard/schedule`

One page, two stacked sections, `max-w-3xl` like the Menu page. Quiet and Apple-like: hairline
`divide-y divide-border` lists on `bg-surface`, no shadows, no cards-within-cards, Figtree at
`tracking-[-0.02em]` for headings.

```
Schedule                                            [ Add a stop ]

  Upcoming
  ┌──────────────────────────────────────────────────────────────┐
  │ Sun  Riverside Brewing Co.          8:00 am – 10:00 pm   ⋯  │   ← Live  · 5 orders
  │  5   412 Mill St, Northfield                                 │
  ├──────────────────────────────────────────────────────────────┤
  │ Mon  Halsted Office Park           11:00 am – 2:00 pm    ⋯  │   ← Published
  │  6   2200 N Halsted Ave, Northfield                          │
  ├──────────────────────────────────────────────────────────────┤
  │ Wed  Lakeview Night Market          5:00 pm – 9:00 pm    ⋯  │   ← Draft
  │  8   3300 N Clark St, Lakeview                               │
  └──────────────────────────────────────────────────────────────┘

  Past  (last 14 days, collapsed)
  ▸ 3 earlier stops                                    [ Repeat ]

  Your spots                                        [ Add a spot ]
  ┌──────────────────────────────────────────────────────────────┐
  │ Riverside Brewing Co.   412 Mill St, Northfield IL   Edit ⋯  │
  │ Halsted Office Park     2200 N Halsted Ave           Edit ⋯  │
  └──────────────────────────────────────────────────────────────┘
```

The day rail (short weekday over a large tabular-nums day number) is lifted straight from
`components/storefront/upcoming-services.tsx` so the vendor's mental model matches what customers
see. The `⋯` menu per upcoming stop: **Repeat next week · Edit · Publish/Unpublish · Cancel stop**.

### 3.3 Add a stop — one sheet, one scroll, no wizard

`Add a stop` opens the right-side `Sheet` already used by `components/dashboard/item-form-sheet.tsx`
(`sm:max-w-md`, `overflow-y-auto`, `bg-surface`). Four labelled groups separated by hairlines, one
submit button. Not a multi-step wizard — the whole form is ~8 controls and every one of them has a
sensible default.

**Group 1 — Where.** A single combobox, `components/dashboard/place-combobox.tsx`.

- Focused but empty, the popup lists **Your spots**, most-recently-used first. Tapping one is the
  entire "where" step. This is the common case — trucks go back to the same four places — so the
  cheapest path is the default path, and no geocoding request fires at all.
- Typing ≥3 characters switches the popup to live suggestions from `/api/geo/suggest` (300 ms
  debounce, §5). Each row: bold first line (POI name, or house number + street), muted second line
  (city, region, postcode).
- Picking a suggestion collapses the combobox into a **confirm block** — not a modal, just the
  field replaced in place by:
  - the formatted address as plain text, with a small "Change" button;
  - **Name this spot** — `Input`, prefilled with the POI name, or the street when the suggestion is
    a bare address. This is the field customers read in 6rem display type on the hero, so it is
    editable and flagged as such: *"Customers see this as the headline."*
  - **Parking note (optional)** — `Input`, placeholder "Patio side, by the loading door." Saved to
    `Location.notes`.
- If the suggestion matches an existing Location by `(provider, providerPlaceId)`, the confirm
  block says *"You already have a spot here"* and reuses that row instead of creating a duplicate.
- If the lookup fails or returns nothing, a quiet **"Enter it manually"** link reveals plain
  address/city/region/postcode inputs. Saves with `provider: "manual"` and null coordinates; the
  customer still gets an address-based directions link. The vendor is never blocked.

**Group 2 — When.** Native `<input type="date">` and two `<input type="time">`s. Native controls on
purpose: they are the best date pickers on a phone, they need no JS, and they match the "quiet"
direction better than a custom calendar. Label reads **"Times are in {truck.timezone}"** — these
are wall-clock values converted to UTC server-side by a new `zonedTimeFromParts()` in `lib/time.ts`.
Validation: end after start, same calendar day in the truck's zone, date not in the past.

**Group 3 — Ordering window.** Two controls, both presets rather than raw datetimes:

- **Preorders open**: `Right away · The evening before · The morning of · 2 hours before` →
  resolved to `orderingOpensAt` server-side.
- **Stop taking orders**: `15 · 30 · 60 minutes before the end` → `orderingClosesAt`.

**Group 4 — Pickup slots.** **Every `15` minutes** and **`6` orders per slot**, matching the seed's
`SLOT_MINUTES` / `ORDERS_PER_SLOT`. A live computed line underneath: *"About 6 orders every 15
minutes — roughly 336 pickup times between 8:00 am and 10:00 pm."* This is the only place a vendor
can accidentally set up a disaster (capacity 1), so showing the arithmetic is worth the line.

**Footer.** Primary **Publish stop**, secondary **Save as draft**, `ErrorBanner` above them.

### 3.4 Making it "SO seamless": defaults and Repeat

Three mechanisms, in order of how much they save:

1. **Every field defaults from the vendor's most recent Service.** `getLatestServiceDefaults()`
   returns `slotMinutes`, `ordersPerSlot`, the ordering-window presets, and the start/end
   wall-clock times. A truck that always does 11–2 at the office park opens the sheet and finds
   11:00–2:00 already filled.
2. **`Repeat` on any stop row** opens the same sheet pre-filled from that Service with the date
   advanced 7 days (and skipped forward if that date already has a stop at that spot). Weekly
   schedule maintenance becomes: open Schedule → `⋯` → Repeat → Publish. **Three taps, no typing.**
   This is the affordance that matters most, because trucks run repeating routes.
3. **Saved spots are the default list.** No geocoding on the repeat path at all.

The first-ever stop is the only one that costs real typing: address → confirm → date → Publish.

### 3.5 Editing a published stop, and the booked-slot rule

Editing times on a `PUBLISHED`/`LIVE` Service has to re-generate `PickupSlot` rows. The hard rule,
following `CLAUDE.md`'s conditional-update discipline:

> **A `PickupSlot` with `bookedCount > 0` is never deleted.**

`lib/schedule/saveService.ts` computes the new slot set inside one transaction, and if any existing
slot with `bookedCount > 0` falls outside it, the whole save is refused with a specific message:

> "Two orders are already booked for 6:15 pm. Keep this stop running until at least 6:30 pm, or
> cancel those orders first."

Slots with `bookedCount === 0` are deleted and recreated freely. Adding slots (extending the end
time) is always safe. Cancelling a stop sets `status: CANCELLED` and leaves slots and orders alone
— `orderingWindow()` in `lib/service.ts` already treats `CANCELLED` as closed — and refunds are
out of scope until Stripe lands.

---

## 4. The customer side  *(flagged "(important)")*

Four touchpoints, in the order a customer meets them.

### 4.1 `ServiceHero` — "where we are next"

`components/storefront/service-hero.tsx` already does most of this: brand-colour panel, location
name in `clamp(3.25rem,15vw,6.5rem)` display type, time range, `MapPin` + address + a "Directions"
link. Changes:

- **Full address.** `{addressLine}, {city}` becomes `{addressLine}` on line one and
  `{city}{region && ", " + region} {postcode}` on line two — a real postal block, which is what a
  driver reads out loud.
- **Directions becomes a proper target, not an inline word.** Replace the small inline underlined
  "Directions" with a 44px-tall outline button on `bg-brand-foreground/15`, label **"Get
  directions"**, `ArrowUpRight` icon, `target="_blank" rel="noreferrer"`. Beneath it, a small
  `opacity-70` "Open in Apple Maps" link. Thumb-sized, because this is tapped while standing up.
- **Both notes render.** `location.notes` as today; `service.publicNote` under it, same muted
  treatment.
- Keeps the existing `--brand` / `--brand-foreground` tokens and the `awning-edge` mask. No new
  colours, no shadows.

```tsx
// components/storefront/service-hero.tsx (sketch)
<a href={directionsUrl(location)} target="_blank" rel="noreferrer"
   className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-foreground/15 px-4
              text-[0.9375rem] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-brand-foreground">
  Get directions <ArrowUpRight aria-hidden className="size-4" />
</a>
<a href={appleDirectionsUrl(location)} target="_blank" rel="noreferrer"
   className="mt-2 block text-sm underline underline-offset-4 opacity-70">
  Open in Apple Maps
</a>
```

### 4.2 `UpcomingServices` — the stop list

`components/storefront/upcoming-services.tsx` rows currently show location name, time range, and
availability. Add the city as a muted suffix on the name line: `{location.name}` then
`<span className="text-muted-foreground"> · {location.city}</span>`, truncation intact.

**No directions link inside these rows.** The whole row is already a `<Link>` that selects the
stop; a nested anchor is invalid HTML and a hit-target trap. Picking the stop reveals the hero,
which carries directions. One decision per tap.

### 4.3 Order status page — where directions actually matter

`components/storefront/order-status.tsx` shows `location.name` and `{addressLine}, {city}` with
**no map link at all**. This is the page a customer has open on the way to collect food, so it gets
the same **"Get directions"** button (neutral surface styling, not brand), the region/postcode, and
`location.notes` — the parking note is at its most useful here.

### 4.4 Checkout

`components/storefront/checkout-form.tsx` line 99 already names the location. Append the address so
the confirmation step is unambiguous: *"Pickup from Ranger Truck at Riverside Brewing Co., 412 Mill
St — today."* No link; checkout should not offer exits.

### 4.5 Attribution (a licence obligation, not a nicety)

`components/storefront/storefront-footer.tsx` gains one muted `text-xs` line, rendered once per
page:

> Addresses from **Geoapify** · map data © **OpenStreetMap** contributors

Both words link out. Which provider name appears comes from `GEO_PROVIDER.attribution` so the
Photon build credits only OpenStreetMap. This satisfies Geoapify's "Powered by Geoapify" rule and
ODbL at the same time, and it is the cheapest line in the spec to forget — so it goes in the same
commit as the provider module, not "later".

---

## 5. Security and abuse

The autocomplete endpoint is the only new attack surface. Six controls, roughly in order of value.

1. **The key never reaches the browser.** All lookups go through
   `app/api/geo/suggest/route.ts`. The env var is `GEOAPIFY_API_KEY` — deliberately *not*
   `NEXT_PUBLIC_*`, which Next.js would inline into client JS. The route returns our own
   `Suggestion[]` shape, never the provider's raw body, so no provider URL, quota header, or
   account detail leaks.
2. **The route is vendor-only.** First line is `await requireTruckAccess()`, exactly as
   `app/api/uploads/route.ts` does. Anonymous traffic cannot reach the provider at all, which
   removes the entire "someone found our endpoint and resold geocoding" class of abuse. It also
   gives us a `truck.id` to rate-limit per tenant.
3. **Debounce, minimum length, and abort.** In `place-combobox.tsx`: trim, require **≥3
   characters**, wait **300 ms** of quiet, and `AbortController.abort()` the in-flight request on
   each keystroke. Plus a per-component `Map<string, Suggestion[]>` so backspacing and retyping
   cost zero requests. Typing a full address becomes roughly 2–4 upstream calls instead of 30 —
   which is what keeps us inside Geoapify's 3,000/day and inside Photon's undefined "be fair".
4. **Rate limit per truck.** `lib/geo/rate-limit.ts`, an in-memory token bucket: **30 requests per
   60 s** and **400 per rolling day**, keyed on `truck.id`. Over the limit → HTTP 429 with
   `{ error: "Too many address lookups. Type the address in manually for now." }`, and the UI
   reveals the manual fields. Honest caveat to put in the file's header comment: module memory
   resets per serverless instance, so this is a speed bump, not a wall; the upgrade path is a
   `GeoLookup` table or Upstash Redis, and it is adequate while the only callers are authenticated
   vendors.
5. **Session tokens.** Geoapify and Photon don't have them — that is a Google Places billing
   concept, where keystrokes within one session are bundled. The interface carries
   `sessionToken?: string` anyway: the combobox generates `crypto.randomUUID()` when it opens and
   sends it with every request, today's adapters ignore it, and a future Google adapter can forward
   it to collapse a session's keystrokes into one billable event. Costs one optional field now,
   saves a refactor later.
6. **Input and transport hygiene.** `z.object({ q: z.string().trim().min(3).max(120), sessionToken:
   z.string().uuid().optional() })`. Upstream fetch wrapped in `AbortSignal.timeout(2500)` so a
   slow provider can't pin our serverless function; on timeout or non-200, return
   `{ suggestions: [], degraded: true }` and let the UI offer manual entry. Response headers
   `Cache-Control: private, no-store`; `export const runtime = "nodejs"`. Geoapify's `filter` /
   `bias` params are set from an optional `GEO_BIAS` env var (a `lat,lng` or `countrycode:us`), both
   to improve results and to narrow what the endpoint can be used to look up.

**One thing we deliberately do not do:** the action trusts the `lat`/`lng` the client sends back
with a chosen suggestion. That is a conscious exception to the spirit of "never trust client
prices" — because coordinates are not prices. The only party harmed by a forged coordinate is the
vendor who forged it, by mislocating their own truck; there is no cross-tenant or financial
exposure, and `requireTruckAccess()` still decides *which* truck the row lands on. Zod does
range-check (`lat` −90…90, `lng` −180…180, strings length-capped). If we ever want this airtight,
the hardening is noted in the file: have `/api/geo/suggest` stash results in a short-lived
server-side map keyed by `sessionToken + providerPlaceId` and have the Server Action read the
coordinates from there rather than from the request body. Not v1.

**Secrets.** `.env.local` stays gitignored; `.env.example` gets the new vars with comments and no
values (§6.5). Nothing else changes.

---

## 6. File structure

### 6.1 New — the provider module

```
lib/geo/types.ts          Suggestion, GeoProvider, ProviderAttribution
lib/geo/geoapify.ts       Geoapify adapter
lib/geo/photon.ts         Photon adapter (keyless)
lib/geo/index.ts          picks the adapter from env; exports GEO_PROVIDER
lib/geo/rate-limit.ts     per-truck token bucket
lib/geo/geoapify.test.ts  pure response-mapping tests (vitest, no network)
lib/geo/photon.test.ts    same
```

```ts
// lib/geo/types.ts — the whole contract. One shape in, one shape out.
export type Suggestion = {
  /** Provider's opaque id, or null when it doesn't issue one. */
  providerPlaceId: string | null;
  /** Bold first line: POI name, or "412 Mill St". */
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

export type GeoProvider = {
  /** "geoapify" | "photon" — stored on Location.provider. */
  readonly id: string;
  /** Rendered in the storefront footer. Licence obligation: never omit. */
  readonly attribution: { label: string; href: string }[];
  /** Throws on transport failure; the route handler turns that into a degraded response. */
  suggest(query: string, options: {
    signal: AbortSignal;
    sessionToken?: string;   // ignored today; a Google adapter would forward it
    bias?: string;           // from GEO_BIAS
    limit?: number;
  }): Promise<Suggestion[]>;
};
```

```ts
// lib/geo/index.ts
import "server-only";
export const GEO_PROVIDER: GeoProvider =
  process.env.GEOAPIFY_API_KEY ? geoapify(process.env.GEOAPIFY_API_KEY) : photon();
```

Swapping providers is this one line. Adding Google later is one new file plus one branch.

### 6.2 New — route handler, pages, components, actions

```
app/api/geo/suggest/route.ts                       GET ?q=…  → { suggestions, degraded }
app/(dashboard)/dashboard/(app)/schedule/page.tsx  Server Component: reads, renders ScheduleScreen
app/(dashboard)/dashboard/schedule/actions.ts      Server Actions (sibling of dashboard/actions.ts)
components/dashboard/schedule-screen.tsx           upcoming + past + your-spots lists
components/dashboard/stop-form-sheet.tsx           the add/edit sheet (mirrors item-form-sheet.tsx)
components/dashboard/place-combobox.tsx            autocomplete field (debounce, abort, cache)
components/dashboard/spot-form-sheet.tsx           edit a saved spot's name/notes/archive
lib/schedule/saveService.ts                        THE single service create/update path + slots
lib/schedule/presets.ts                            ordering-window presets ↔ UTC instants
lib/schedule/saveService.test.ts                   slot generation + booked-slot refusal
lib/time.test.ts                                   zonedTimeFromParts round-trips
```

`lib/schedule/saveService.ts` mirrors `lib/orders/createOrder.ts` as "the single path" for a kind of
write, which is the pattern `CLAUDE.md`'s architecture block already documents.

### 6.3 Changed

| File | Change |
|---|---|
| `prisma/schema.prisma` | §2 |
| `prisma/seed.ts` | `region`/`postcode`/`provider` on `LOCATIONS`; `lastUsedAt`; one `publicNote` |
| `lib/types.ts` | `Location` gains `region`, `postcode`, nullable `lat`/`lng`, `provider`, `providerPlaceId`, `archived`; `Service` gains `publicNote` |
| `lib/tenant.ts` | all new queries (§6.4); `toLocation`/`toService` map the new fields |
| `lib/service.ts` | `mapsUrl` → `directionsUrl(location)` + `appleDirectionsUrl(location)`, coordinate-preferring with an address fallback |
| `lib/time.ts` | `zonedTimeFromParts(tz, "YYYY-MM-DD", "HH:mm")`, `toZonedDateInput`, `toZonedTimeInput` |
| `components/dashboard/dashboard-nav.tsx` | one array entry: Schedule |
| `app/(dashboard)/dashboard/(app)/page.tsx` | empty state → real "Schedule a stop" button; "Edit schedule" link beside the stop select |
| `components/dashboard/service-screen.tsx` | trailing "Edit schedule" link |
| `components/storefront/service-hero.tsx` | §4.1 |
| `components/storefront/upcoming-services.tsx` | city on the name line |
| `components/storefront/order-status.tsx` | §4.3 |
| `components/storefront/checkout-form.tsx` | §4.4 |
| `components/storefront/storefront-footer.tsx` | attribution line |
| `.env.example` | §6.5 |

No change to `app/globals.css`: everything uses `--brand`, `--surface`, `--muted`, `--border`,
`--ready`, `--signal` and existing radii.

### 6.4 `lib/tenant.ts` additions

Every one takes `truckId` as its first argument and includes it in the where-clause, per the file's
own header rule.

```ts
// Locations
getVendorLocations(truckId): Promise<Location[]>              // archivedAt null, lastUsedAt desc
findLocationByPlaceId(truckId, provider, placeId): Promise<Location | null>
createLocation(truckId, input: LocationInput): Promise<string>
updateLocation(truckId, locationId, input: LocationInput): Promise<boolean>
setLocationArchived(truckId, locationId, archived): Promise<boolean>
countFutureServicesAt(truckId, locationId, now): Promise<number>   // warn before archiving
touchLocationUsed(tx, truckId, locationId): Promise<void>

// Schedule
getScheduleServices(truckId, now): Promise<ScheduleRow[]>   // upcoming + 14 days past, DRAFT included,
                                                            // with location and a paid-order count
getServiceForEdit(truckId, serviceId): Promise<ServiceDraft | null>
getLatestServiceDefaults(truckId): Promise<ServiceDefaults | null>
createServiceWithSlots(tx, truckId, data, slots): Promise<string>
replaceServiceSlots(tx, truckId, serviceId, slots): Promise<{ ok: true } | { ok: false; conflictAt: Date }>
updateServiceTimes(tx, truckId, serviceId, data): Promise<boolean>
setServiceStatus(truckId, serviceId, status): Promise<boolean>
getDefaultMenuIdForTruck(truckId): Promise<string | null>   // export the existing private helper
```

`getScheduleServices` is a *new* query, not a reuse of `getDashboardServices`, because the vendor's
schedule must include `DRAFT` and recent past rows while the Service screen must not.

### 6.5 Server Actions and Zod shapes

`app/(dashboard)/dashboard/schedule/actions.ts`, following `dashboard/actions.ts` exactly:
`requireTruckAccess()` → Zod-parse → a `lib/tenant.ts` call → `refresh(truck.slug)` →
`ActionResult`.

```ts
"use server";

const id = z.string().min(1).max(50);

/** A place either chosen from a suggestion or typed by hand. */
const placeSchema = z.object({
  provider: z.enum(["geoapify", "photon", "manual"]),
  providerPlaceId: z.string().max(200).nullable(),
  name: z.string().trim().min(1, "Give this spot a name.").max(80),
  addressLine: z.string().trim().min(1, "Enter the street address.").max(160),
  city: z.string().trim().max(80),
  region: z.string().trim().max(80),
  postcode: z.string().trim().max(20),
  // Range-checked, not recomputed: see §5. Null means "geocoder unavailable".
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  notes: z.string().trim().max(200),
});

const stopSchema = z
  .object({
    serviceId: id.optional(),              // present = editing
    locationId: id.optional(),             // an existing saved spot …
    place: placeSchema.optional(),         // … or a new one. Exactly one is required.
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time."),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick an end time."),
    opens: z.enum(["RIGHT_AWAY", "EVENING_BEFORE", "MORNING_OF", "TWO_HOURS_BEFORE"]),
    closesMinutesBeforeEnd: z.union([z.literal(15), z.literal(30), z.literal(60)]),
    slotMinutes: z.number().int().min(5).max(60),
    ordersPerSlot: z.number().int().min(1).max(60),
    publicNote: z.string().trim().max(200),
    publish: z.boolean(),
  })
  .refine((v) => v.endTime > v.startTime, { message: "The end time has to be after the start time.", path: ["endTime"] })
  .refine((v) => Boolean(v.locationId) !== Boolean(v.place), { message: "Choose where this stop is.", path: ["place"] });

export type SaveStopResult =
  | { ok: true; serviceId: string }
  | { ok: false; error: string; field?: "place" | "date" | "endTime" | "slots" };

export async function saveStop(input: z.input<typeof stopSchema>): Promise<SaveStopResult>;
export async function saveSpot(input: z.input<typeof placeSchema> & { locationId?: string }): Promise<ActionResult>;
export async function archiveSpot(input: { locationId: string; archived: boolean }): Promise<ActionResult>;
export async function setStopStatus(input: { serviceId: string; status: "DRAFT" | "PUBLISHED" | "CANCELLED" }): Promise<ActionResult>;
/** Returns a pre-filled draft for the sheet; writes nothing. */
export async function repeatStop(input: { serviceId: string; weeks: number }): Promise<{ ok: true; draft: StopDraft } | { ok: false; error: string }>;
```

`saveStop` body, in order: `requireTruckAccess()` → parse → resolve the Location (`locationId`
verified against `truckId`, or `findLocationByPlaceId` dedupe, or `createLocation`) →
`zonedTimeFromParts(truck.timezone, date, startTime/endTime)` → resolve the ordering presets via
`lib/schedule/presets.ts` → hand everything to `lib/schedule/saveService.ts`, which runs one
transaction: upsert the Service, generate slots, enforce the booked-slot rule, `touchLocationUsed`
→ `refresh(truck.slug)`.

### 6.6 `.env.example` additions

```bash
# ── Address autocomplete ────────────────────────────────────────────────────
# Blank = the keyless Photon demo service (photon.komoot.io) is used, which needs no
# signup. It is fine for development and a class demo: komoot throttle heavy use and
# promise no uptime. For anything real, get a free Geoapify key below.
#
# Geoapify (geoapify.com) → sign up with an email → Projects → API key.
# Free plan: 3,000 lookups/day, no credit card, production use allowed.
# Required if set: the storefront footer credits Geoapify and OpenStreetMap.
GEOAPIFY_API_KEY=
# Optional: nudge results toward where the truck operates, so "Mill St" finds the
# right one. "countrycode:us" or "proximity:-87.65,41.91" (lng,lat).
GEO_BIAS=countrycode:us
```

Nothing is `NEXT_PUBLIC_*`: the key is read only inside `lib/geo/`, which is `server-only`.

---

## 7. Sequence of work

Dependency-ordered, not dated. `‖` marks work that can run on a second machine in parallel.

**Step 1 — Schema and types.** `schema.prisma` (§2) → `npx prisma migrate dev --name
stops_and_locations` → `lib/types.ts` → `toLocation`/`toService` in `lib/tenant.ts` →
`prisma/seed.ts` → `npx prisma db seed`. One person, one commit, including the migration file.
Everything else depends on this; nothing else should start before the migration is pushed.

**Step 2 — Two independent foundations.** Both unblock step 3.

- **2a ‖ Provider module.** `lib/geo/*` + `app/api/geo/suggest/route.ts` +
  `lib/geo/rate-limit.ts` + `.env.example`. Verifiable on its own with `curl` against the running
  dev server while logged in, and with vitest tests on the response mappers (pure functions, no
  network). No UI needed.
- **2b ‖ Time and presets.** `zonedTimeFromParts` / `toZonedDateInput` / `toZonedTimeInput` in
  `lib/time.ts`, `lib/schedule/presets.ts`, and `directionsUrl` / `appleDirectionsUrl` in
  `lib/service.ts`. All pure, all unit-tested, and the directions helpers are what step 5 needs.

**Step 3 — Writes.** `lib/tenant.ts` queries (§6.4), `lib/schedule/saveService.ts`, and
`app/(dashboard)/dashboard/schedule/actions.ts`. Needs step 1 and 2b. Test
`saveService.ts` first — slot generation and the booked-slot refusal are the only genuinely tricky
logic in the whole feature, and they are much easier to get right against a test than against a
sheet.

**Step 4 — Vendor UI.** `schedule/page.tsx`, `schedule-screen.tsx`, `stop-form-sheet.tsx`,
`spot-form-sheet.tsx`, `place-combobox.tsx`, the nav entry, and the `/dashboard` empty-state
button. Needs steps 2a and 3. Build it in this order so each piece is usable as it lands:
list → sheet with a saved-spot picker only → combobox → Repeat.

**Step 5 ‖ Customer UI.** `service-hero.tsx`, `upcoming-services.tsx`, `order-status.tsx`,
`checkout-form.tsx`, `storefront-footer.tsx`. Depends only on steps 1 and 2b — **so it runs fully
in parallel with steps 3 and 4**, which is the natural two-person split: one dev on the vendor
pipeline, one on the storefront. The seed already produces four Locations with coordinates, so the
storefront work is testable immediately after step 1.

**Step 6 — Polish, after both sides land.** `npm run lint` + `npm test`; the slot-count preview
line; the "you already have this spot" dedupe message; the archive-a-spot warning when future
Services reference it; the degraded/manual-entry path exercised by temporarily setting a bogus
`GEOAPIFY_API_KEY`.

**Deferred, explicitly out of scope for v1:** static map images (`/api/map/[locationId]` with
immutable caching), an interactive map, multi-stop "routes" as a first-class model, recurring-series
Services (`RRULE`), and a Google adapter.

---

## 8. Decisions the user has to make

Ordered by how much they block.

1. **Geoapify account — yes or no?** *Recommended: yes, but not urgently.* Email signup at
   geoapify.com, no credit card, free plan allows production use: 3,000 lookups/day. The reason to
   bother is reliability and attribution clarity, not capability. **If the answer is "not now",
   nothing stops: leaving `GEOAPIFY_API_KEY` blank uses keyless Photon, which is good enough for
   development and a class demo.** This is the only signup in the entire spec.
2. **Confirm: no Google Maps API key.** This spec assumes none and needs none — the "Get
   directions" link uses Google's keyless Maps URLs API. If the user has a strong preference for
   Google *suggestions* specifically, they must accept attaching a credit card to a Google Cloud
   project **and** the 30-day cache limit on coordinates, which would force re-fetching a place's
   details on storefront renders. Recommendation: don't.
3. **A fourth dashboard tab, "Schedule".** Service · Menu · **Schedule** · Settings. Alternative
   considered and rejected: folding it into Settings. Needs a yes before step 4.
4. **Nullable `Location.lat` / `lng`.** Lets a vendor save a spot when the geocoder is down or
   doesn't know the address, falling back to an address-text directions link. Say no and vendors
   get blocked by a third-party outage.
5. **Map display: directions link only in v1.** No tiles, no static image, no map library.
   Confirm, or ask for the static-image phase 2 up front (it costs a proxy route plus Geoapify
   credits per unique spot).
6. **Attribution line in the storefront footer** — "Addresses from Geoapify · map data ©
   OpenStreetMap contributors". Not optional under Geoapify's terms and ODbL. Confirm the wording.
7. **Default slot settings:** every 15 minutes, 6 orders per slot, orders close 15 minutes before
   the end — copied from the seed. Change now if those are wrong, since they become every truck's
   starting point.
8. **In-memory rate limiting (30/min, 400/day per truck) is a speed bump, not a wall** — it resets
   per serverless instance on Vercel. Acceptable for an authenticated, vendor-only endpoint on a
   class project. Say so out loud so it isn't a surprise later.
