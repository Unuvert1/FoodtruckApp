# Vendor Settings redesign — spec

Status: spec only, no application code changed.
Repo: `C:\Users\sodno001\Claude projects\Foodtruck`
Branch at time of writing: `feature/menu-photos-ui`

---

## 0. Summary of decisions

| Question | Decision |
|---|---|
| Where does Settings live? | A gear icon button in the dashboard header's right cluster, between the "Ordering page" link and the Clerk `UserButton`. |
| What does the tab bar become? | Two tabs: **Service · Menu**. No filler tabs. |
| Settings nav pattern | **Left rail + detail pane** (list-detail), rail is `sticky`, hairline divider, grouped headings. |
| Mobile (375px) | Rail collapses to one full-width "current section" button that opens the existing `Sheet` (side `left`) with the whole category list. |
| Category count | 8 sections, 2 group headings. All 8 ship with at least one real, working control. |
| Routes | `/dashboard/settings/<section>`; `/dashboard/settings` server-redirects to `/dashboard/settings/profile`. |
| Server Actions | New colocated file `app/(dashboard)/dashboard/(app)/settings/actions.ts`. |
| Schema changes needed | `Location.archivedAt`, five ordering-default columns on `Truck`, (later) an `Invite` model. Nothing else. |

The one place I am overruling the literal request: **the rail goes on the left, not the right.** Reasoning in §4.1, and the escape hatch is a two-token change if the user disagrees.

---

## 1. Research: how the incumbents organise merchant settings

### 1.1 What each product does

**DoorDash Merchant Portal.** A single left rail for the whole portal — Insights, Reports, Customers, Orders, Marketing, Menu, Store availability, Financials, **Settings**, Add solutions, Request a delivery, Help, Point of sale. Settings sits near the bottom and expands into: Account Settings, Pricing Plans, Store settings, Manage Users, Store communications, Bank account, Integrations. Notably *Store settings* holds name/address/phone/website/description/logo/header image, *Account Settings* holds operational knobs (pickup instructions, tablet PIN, store tax rate, payout opt-ins), and *Store communications* is purely "which email addresses get what."
Sources: <https://merchants.doordash.com/en-us/learning-center/navigation>, <https://help.doordash.com/en-us/merchants/article/merchant-portal-settings>, <https://help.doordash.com/en-us/merchants/article/how-to-update-your-store-description-in-the-merchant-portal>, <https://merchants.doordash.com/en-us/learning-center/banking>

**Vagaro.** Gear icon → Settings, then a **left-hand menu** of category groups: Business Information, Employee Information, Booking Settings, Things We Sell, Customizing Look & Feel, Add-On Features, Marketing. Because there are so many leaves, Vagaro adds a search box over its settings and lets you bookmark the ones you use often — a tell that a flat list stops scaling past ~40 leaves.
Sources: <https://www.vagaro.com/learn/the-quickstart-guide-to-vagaro>, <https://support.vagaro.com/hc/en-us/categories/115000066094-Business-and-Account-Settings>, <https://support.vagaro.com/hc/en-us/articles/26120850768027-Bookmark-and-Search-Your-Settings-and-Reports>, <https://support.vagaro.com/hc/en-us/articles/18977243390491-Set-Up-Your-Business-Profile>

**Square Dashboard.** Settings → **Account & Settings**, split at the top level into *Personal information* (Sign in and security, Preferences) and *My business* (About, Locations, Sales taxes, Receipts, Payment methods). Device management and Checkout live outside that page as their own settings areas. The important structural idea: **the person's own account is separated from the business's configuration.**
Sources: <https://squareup.com/help/us/en/article/3861-edit-your-account-and-business-settings>, <https://squareup.com/help/us/en/article/5580-manage-multiple-locations-with-square>

**Toast Web.** No single "Settings" page at all — configuration is organised by *function* in a left rail: Menus, Takeout & delivery (→ Availability → Online ordering / Takeout-delivery, UI Options), Payments and money, Kitchen/Dining Room (Printers, Dining Options), Other setup. Deep, path-like, two to three levels (`Takeout & delivery > Availability > Online Ordering`). This is the enterprise end of the spectrum and the wrong model to copy at our size.
Sources: <https://doc.toasttab.com/doc/platformguide/index.html>, <https://support.toasttab.com/en/article/How-do-I-set-up-my-take-out-and-delivery-options-1492745822028>, <https://support.toasttab.com/en/article/Getting-Started-Online-Ordering>

**Clover.** Merchant Dashboard → **Account & Setup**, grouped into Business Information, Business Operations (→ Taxes & Fees), Employees, plus `Setup > Order Types`. Same shape as Square: identity, operations, people.
Sources: <https://www.clover.com/help/set-up-taxes-fees-and-additional-charges>, <https://www.la.clover.com/en-US/help/manage-tax-rate-and-fee-details>, <https://www.clover.com/en-US/help/access-the-web-dashboard>

### 1.2 The common denominator

Every one of the five, Toast included, lands on the same seven buckets under different names:

1. **Business identity** — legal/display name, description, logo, header image, contact
2. **Customer-facing presentation** — brand colours, images, storefront/online-ordering look ("Customizing Look & Feel" at Vagaro, "UI Options" at Toast)
3. **Locations** — one at Clover/Toast, a managed list at Square and DoorDash
4. **Availability / ordering rules** — hours, closures, lead times, quote times, scheduled-order toggles
5. **Taxes & fees** — a tax rate, plus the platform's own commission shown read-only
6. **Money out** — bank account, payout schedule, processing status
7. **People** — users, roles, permissions

and an eighth that is *not* part of business settings: **the signed-in person's own account**, which Square and Clover deliberately keep in a separate top-level group.

### 1.3 Navigation pattern — unanimous

All five use a **left vertical list, detail pane on the right.** Nobody uses a right rail. Nobody uses horizontal tabs for settings (DoorDash and Clover use horizontal tabs *inside* a settings page, one level down). Vagaro and Square add group headings to the left list once it passes ~6 entries. At narrow widths the list and the detail become two screens (list → detail → back), or the list collapses behind a button.

### 1.4 What a food truck needs that a fixed-address restaurant does not

This is where a cloned restaurant IA fails, and it maps directly onto our `Service` model:

- **Location is a variable, not a constant.** Restaurant settings have one address field; a truck rotates between a handful of regular spots and the occasional one-off event. The incumbents' workaround is "edit your address again every morning," with DoorDash offering saved addresses or GPS auto-update. Trucks need a **saved-locations list** they pick from when scheduling, with the ability to retire a spot without breaking the history of services held there. Sources: <https://merchants.doordash.com/en-us/blog/food-truck-delivery>, <https://www.ordering.co/best-online-ordering-for-food-trucks-commission-free-pre-order>, <https://businesscart.ai/blog/online-ordering-for-food-trucks-pre-orders-pickup-no-app-needed>
- **"Hours" are not weekly.** A restaurant sets Mon–Sun open/close once. A truck's availability is a list of discrete windows. In our model that is the `Service`, and Settings must not try to own a weekly-hours grid — Settings owns the *defaults a new Service starts from* (slot length, orders per slot, when ordering opens/closes relative to the window). That is the single biggest IA difference from Square/Toast.
- **Throughput, not seating.** `ordersPerSlot` is the truck's real constraint — one window, one fryer. A restaurant's equivalent (quote times, order throttling) is buried in Toast; for us it's front-and-centre.
- **Scheduled pickup is the product, not an option.** Community advice for trucks on Square is literally "turn off Schedule Pickup for Later," because the generic product assumes immediate orders. We have no "ASAP" mode at all, so our ordering settings are about lead time and cutoff, not about enabling scheduling. Source: <https://community.squareup.com/t5/Square-for-Restaurants/I-own-a-food-truck-and-want-to-do-online-orders-Is-anyone-out/m-p/110905>
- **One timezone, loudly.** A truck owner travelling for an event will see wrong times before they see wrong anything else, and `Truck.timezone` is the only lever. It belongs at the top of the ordering section, not buried in "about."

---

## 2. Settings entry point

### 2.1 Placement

In `app/(dashboard)/dashboard/(app)/layout.tsx`, the header's right cluster becomes, left to right:

```
[ truck name ...............flex-1 ] [ Ordering page ↗ ] [ ⚙ ] [ avatar / Demo mode ]
```

The gear is the **second-to-last** item. That is the "right corner-ish, not literally the corner" the user asked for, and it is also correct: the avatar is the person's account (Clerk), the gear is the business's configuration, and keeping them adjacent-but-distinct mirrors Square's and Clover's separation of *personal information* from *business setup*. The gear must not be the outermost element, because the outermost slot is conventionally the identity menu and users reach for it by muscle memory.

### 2.2 Exact affordance

- **Element:** `next/link` to `/dashboard/settings`, rendered inside a new client component so it can compute its own active state.
- **Icon:** `Settings` from `lucide-react` (the toothed gear). Not `Settings2` (sliders — reads as "filter"), not `Cog`. `className="size-5"`.
- **Size:** `size-10` (40×40 box) with the icon centred — 40px is the same height as the existing "Ordering page" link, so the cluster keeps one baseline. On touch, the header's own padding brings the effective target to ≥44px.
- **Shape:** `rounded-lg`, no border, no shadow. Resting state `text-muted-foreground`; `hover:bg-muted hover:text-foreground`; `focus-visible:bg-muted` with the global ring.
- **Active state** (pathname starts with `/dashboard/settings`): `bg-muted text-foreground` and `aria-current="page"`. No underline bar — the bar is the tab bar's vocabulary and the gear is not a tab.
- **Accessibility:** `aria-label="Settings"` on the link plus `<span className="sr-only">Settings</span>`; `title="Settings"` for the desktop tooltip. Never label-less.
- **Behaviour:** plain navigation. **No dropdown menu.** A menu here would duplicate the rail one click later and give us two places to maintain the same list.
- **Mobile:** identical, unchanged. The gear is the only settings entry on phones, which is why it is never collapsed or hidden behind the `sm:` breakpoint the way the "Ordering page" label is.

### 2.3 What the tab bar becomes

`components/dashboard/dashboard-nav.tsx` drops the third entry:

```ts
const LINKS = [
  { href: "/dashboard", label: "Service" },
  { href: "/dashboard/menu", label: "Menu" },
];
```

Two tabs is correct and should be left alone. The tab bar is now exactly "the two things you do during service" — take orders, fix the menu — and everything you do once a quarter moved to the gear. Do **not** add a placeholder "Orders" or "Reports" tab to make it look fuller; the slot is reserved for the first real third screen (order history is the likely candidate).

---

## 3. Information architecture

### 3.1 The category list

Two group headings, eight sections. Every section ships with at least one control that actually writes to the database — no section is an empty "coming soon" page.

#### Group: **Your truck**

**1. Truck profile** — `/dashboard/settings/profile`
Who you are and where customers find you.
- Truck name — `Truck.name` ✅ existing
- Tagline — `Truck.tagline` ✅ existing
- Logo — `Truck.logoUrl` ✅ existing (uploads via the existing `/api/uploads` → `/api/photos/<id>`)
- Ordering page address (slug) — `Truck.slug` ✅ existing. **Editable, with teeth:** changing it breaks every link and QR code already in the wild, so it sits behind a confirm step and reuses the onboarding slug rules (`RESERVED_SLUGS`, `isSlugTaken`). This is the one destructive-ish control in Settings.
- Custom domain — `Truck.customDomain` ✅ field exists, **but** `middleware.ts` has a `TODO` where domain→slug rewriting would go, so there is no resolution path yet. Render it read-only with the current value and one line: "Custom domains aren't switched on yet." Honest, and costs nothing.

**2. Storefront** — `/dashboard/settings/storefront`
What the customer page looks like. (Vagaro's "Customizing Look & Feel.")
- Brand colour — `Truck.brandColor` ✅ existing. Native `<input type="color">` plus a hex text field, because a colour picker nobody has to learn beats a bespoke one.
- Text-on-brand colour — `Truck.brandColorForeground` ✅ existing. Offer **two choices only, white or ink** (`#FFFFFF` / `#1D2733`), chosen as swatches, with the computed contrast ratio shown next to each. Letting a vendor type an arbitrary foreground is how you get unreadable storefronts.
- Hero image — `Truck.heroImageUrl` ✅ existing
- A live preview tile showing the brand colour behind the logo and tagline, and a link to open `/{slug}` in a new tab.

**3. Locations** — `/dashboard/settings/locations`
The saved spots you serve from. **This is the food-truck section** and it is the single largest gap in the current dashboard: `Location` rows exist in the schema and are required to create a `Service`, but there is no UI anywhere to create one.
- List of `Location` rows: name, address line, city, notes. Add / edit.
- Retire a spot → **needs `Location.archivedAt`** (new column). `Service.locationId` references `Location`, so hard delete is forbidden by the project's own rule; archived spots stay visible on past services and disappear from the "new service" picker.
- `lat` / `lng` are required by the schema. Do **not** build geocoding for this. See decision 2 in §6.

#### Group: **Business**

**4. Ordering** — `/dashboard/settings/ordering`
Time zone, and the defaults every new service starts from.
- Time zone — `Truck.timezone` ✅ existing. Top of the page, `Intl.supportedValuesOf("timeZone")` in a select, same validation as `createTruck`.
- Default slot length (minutes) — **new**: `Truck.defaultSlotMinutes Int @default(15)`
- Default orders per slot — **new**: `Truck.defaultOrdersPerSlot Int @default(4)`
- Ordering opens (hours before the window starts) — **new**: `Truck.orderingOpensHoursBefore Int @default(24)`
- Ordering closes (minutes before the window ends) — **new**: `Truck.orderingClosesMinutesBefore Int @default(15)`
- Minimum pickup lead time (minutes) — **new**: `Truck.slotLeadMinutes Int @default(10)`. This one already exists as a hard-coded constant: `SLOT_LEAD_MS = 10 * 60 * 1000` in `lib/tenant.ts`. Promoting it to a column is the highest-value new field in this spec — it is the knob a vendor actually wants on a slow day.
- Copy must be explicit that these are **defaults for new services**, not retroactive. Each field's helper text says so.

**5. Taxes & fees** — `/dashboard/settings/taxes`
- Sales tax rate — `Truck.taxRateBps` ✅ existing. Input accepts a percentage string ("8.25"); a new `parsePercentToBps` in `lib/money.ts` converts with string math, mirroring `parseDollarsToCents`. **No floats.** Display with a `centsToInput`-style `bpsToPercentInput`.
- Platform fee — `Truck.platformFeeBps` ✅ existing, **read-only**, shown as "2.50% — set by FoodtruckApp". A vendor editing their own platform commission is a bug, not a feature; DoorDash likewise shows Pricing Plans read-only.
- Tip presets — would need new schema (`Truck.tipPresetBps Int[]`). **Cut from v1.** `tipCents` is already collected per order; a preset list is a nice-to-have that does not justify a column yet.

**6. Payments** — `/dashboard/settings/payments`
- Status card driven by real data: `Truck.stripeAccountId` ✅ and `Truck.stripeOnboarded` ✅ already exist. Three honest states: not connected / connected but onboarding incomplete / connected. Badge uses `--ready` when onboarded, `--signal` when incomplete.
- "Connect Stripe" button, `disabled`, with one line of copy: "Orders are marked paid on creation until Stripe is wired up." This matches CLAUDE.md's stated reality and is a *status* page, not a placeholder.
- Payout destination and schedule: not ours to own — Stripe Connect's own dashboard handles it. Say so in one line rather than building fields we'd delete.

**7. Notifications** — `/dashboard/settings/notifications`
- Order email address — `Truck.notificationEmail` ✅ existing. This is the current `components/dashboard/settings-form.tsx`, moved verbatim.
- An explicit on/off switch for new-order emails. **No new column needed** — `notificationEmail = null` already means off (see `lib/orders/markOrderPaid.ts` / `getOrderNotification`). The switch clears or restores the address, and the current form's own success copy already acknowledges that state ("Saved. Order emails are off."). Making it a visible switch instead of an implicit empty field is pure UX win at zero schema cost.
- Daily summary email — needs new schema and a cron. **Cut from v1**, not even shown.

**8. Team** — `/dashboard/settings/team` — **OWNER only**
- List `Membership` rows for the truck: Clerk user id (or email once we read it from Clerk), role, joined date. `MembershipRole` is already `OWNER | STAFF`.
- Change a member's role; remove a member. `Membership` is referenced by nothing else, so a hard delete is legitimate here — the soft-delete rule applies to rows an `Order` can reach, and a membership is not one. Guard: a truck must always keep at least one `OWNER`.
- Invite by email — **needs new schema** (an `Invite` model: truckId, email, role, token, expiresAt, acceptedAt) plus a Resend email and an accept route. **Cut from v1.** v1 shows the real roster and real role/remove controls, and a line explaining that new members join by signing up and being added once invites land.
- `requireTruckAccess()` already returns `role`, so gating is free. STAFF users get an "Only owners can manage the team" panel, and the rail hides the entry.

### 3.2 Explicitly out of scope

- **The signed-in person's own account** (email, password, 2FA, name). Clerk's `UserButton` already owns this and renders its own modal. Following Square's and Clover's split, Settings is *business* settings only. Do not build a "My account" section that re-implements Clerk.
- **Weekly opening hours.** Wrong model for a truck (§1.4). Availability is the `Service`, which lives on the Service screen.
- **Menu settings.** Already its own tab.
- Reports, marketing, integrations, devices, printers — nothing behind them yet.

### 3.3 Buildable-now vs. deferred, at a glance

| Section | Real controls in v1 | Schema |
|---|---|---|
| Truck profile | name, tagline, logo, slug | existing only |
| Storefront | brand colour, foreground, hero | existing only |
| Locations | list, add, edit, archive | **+ `Location.archivedAt`** |
| Ordering | timezone + 5 defaults | **+ 5 `Truck` columns** |
| Taxes & fees | tax rate (fee read-only) | existing only |
| Payments | status only, button disabled | existing only |
| Notifications | email + on/off switch | existing only |
| Team | roster, role, remove (OWNER only) | existing only |

Two migrations' worth of change, six columns, zero new tables. Everything else is UI over fields that already exist and currently have no way to be edited.

---

## 4. Navigation layout

### 4.1 Pattern and why

**Left rail, detail pane on the right, rail reachable at every breakpoint (a sheet on mobile).**

The user asked for "a navbar inside the settings section on the right side." I am recommending the left, and this is the one place I'm pushing back:

1. **Every product we studied puts it on the left** — DoorDash, Vagaro, Square, Toast, Clover (§1.3). Not one uses a right rail. A vendor who has used any POS before will scan left for the index.
2. **The rail is an index, the pane is the subject.** In a left-to-right language the index comes first. A right rail makes the eye land on the content, fail to find a heading hierarchy, then travel right to discover there was a list.
3. **Form layout breaks.** Settings pages are left-aligned label/field stacks. Put the rail on the right and the forms' ragged right edge collides with the rail's hairline, so you end up padding the pane to fake a gutter — the layout fights itself.
4. **`--brand` as the active marker works on the left.** A 2px brand bar on the rail item's inner edge reads as "you are here, and the content is this way." On the right it points away from the content.

**What the user actually wins:** the *entry point* is on the right, exactly as asked — the gear sits top-right in the header, and on the settings screen the gear stays visibly active in that same top-right position. The spatial logic "settings live over there on the right" is preserved at the level that matters.

**Escape hatch if the user insists:** the rail/pane container is a single `md:flex-row` on the shell. Changing it to `md:flex-row-reverse` and moving the divider from `md:border-r md:pr-6` to `md:border-l md:pl-6` flips it, with no other change. It is a two-token edit, so this is cheap to try and cheap to revert. Build it left; show them; flip if they still want it.

### 4.2 Desktop (≥768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Smoke & Barrel                     Ordering page ↗   [⚙]   (avatar)         │  header
│  Service   Menu                                                              │  tabs
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Settings                                                                   │  h1, 2rem, -0.03em
│                                                                              │
│   ┌────────────────────────┐ ┆ ┌──────────────────────────────────────────┐   │
│   │ YOUR TRUCK             │ ┆ │  Truck profile                           │   │
│   │                        │ ┆ │  Who you are and where customers find    │   │
│   │ ▌Truck profile         │ ┆ │  you.                                    │   │
│   │  Storefront            │ ┆ │ ──────────────────────────────────────── │   │
│   │  Locations             │ ┆ │  Truck name     [ Smoke & Barrel       ] │   │
│   │                        │ ┆ │ ──────────────────────────────────────── │   │
│   │ BUSINESS               │ ┆ │  Tagline        [ Low and slow         ] │   │
│   │                        │ ┆ │ ──────────────────────────────────────── │   │
│   │  Ordering              │ ┆ │  Logo           ( ◻ )  Replace           │   │
│   │  Taxes & fees          │ ┆ │ ──────────────────────────────────────── │   │
│   │  Payments              │ ┆ │  Ordering page  app.com/[smoke-barrel]   │   │
│   │  Notifications         │ ┆ │                 Changing this breaks     │   │
│   │  Team                  │ ┆ │                 existing links.          │   │
│   │                        │ ┆ │ ──────────────────────────────────────── │   │
│   └────────────────────────┘ ┆ │  Custom domain  — not available yet      │   │
│      220px, sticky           ┆ │                                          │   │
│                              ┆ │                     [ Save changes ]     │   │
│                              ┆ └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
   ▌ = 2px --brand bar on the item's inner edge
   ┆ = 1px --border hairline, full height of the content area
```

Metrics:
- Shell: `mx-auto max-w-5xl px-4 pt-6 pb-16`. Wider than the current `max-w-2xl` because it now carries two columns; the pane itself stays `max-w-2xl` so line lengths don't grow.
- Rail: `w-[13.75rem]` (220px), `shrink-0`, `sticky top-6 self-start`, `md:border-r md:border-border md:pr-6`.
- Rail item: `h-11` (44px), `px-3`, `rounded-lg`, `text-[0.9375rem]`, `tracking-[-0.01em]`. Resting `text-muted-foreground`; hover `bg-muted text-foreground`; active `font-semibold text-foreground` + the 2px `bg-brand` bar at `inset-y-1.5 right-0` (inner edge) + `aria-current="page"`. No filled pill, no shadow.
- Group heading: `text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground`, `px-3 pb-1.5 pt-5`, first one `pt-0`.
- Pane: `min-w-0 flex-1 md:pl-6`.
- Sections render as hairline-separated rows on `bg-surface` with `rounded-2xl`, matching the existing settings cards' radius but using `divide-y divide-border` instead of nesting boxes. **No drop shadows anywhere.**
- Row: label column `w-44 shrink-0 text-sm text-muted-foreground` at `md` and up, control fills the rest; `py-4`. Stacks to label-over-control below `md`.
- Inputs keep the existing dashboard sizing: `h-12 rounded-xl px-3.5 text-base` (as in the current `settings-form.tsx`), which is also the generous-tap-target rule.

### 4.3 Mobile (375px)

The rail becomes a single full-width button that opens the existing `Sheet` from the left with the full list. No horizontal chip strip (hides entries past the fold), no list→detail push (needs back-button handling we don't want to own).

```
375px wide
┌───────────────────────────────────────┐
│ Smoke & Barrel        ↗   [⚙]  (av)   │  header (gear never collapses)
│ Service   Menu                        │
├───────────────────────────────────────┤
│                                       │
│  Settings                             │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ ☰  Truck profile              ▾   │ │  h-12, bg-surface, rounded-xl,
│ └───────────────────────────────────┘ │  border border-border
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ Truck profile                     │ │
│ │ Who you are and where customers   │ │
│ │ find you.                         │ │
│ │ ───────────────────────────────── │ │
│ │ Truck name                        │ │
│ │ [ Smoke & Barrel                ] │ │  h-12 inputs
│ │ ───────────────────────────────── │ │
│ │ Tagline                           │ │
│ │ [ Low and slow                  ] │ │
│ │ ───────────────────────────────── │ │
│ │ Logo                              │ │
│ │ ( ◻ )  Replace                    │ │
│ │ ───────────────────────────────── │ │
│ │ Ordering page                     │ │
│ │ [ smoke-barrel                  ] │ │
│ │ Changing this breaks existing     │ │
│ │ links.                            │ │
│ └───────────────────────────────────┘ │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │          Save changes             │ │  h-12, full width
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘

Sheet open (side="left", w-3/4 ≈ 281px):
┌──────────────────────────┬────────────┐
│ Settings             [✕] │▒▒▒▒▒▒▒▒▒▒▒▒│
│                          │▒▒▒ scrim ▒▒│
│ YOUR TRUCK               │▒▒ black/10 │
│ ▌Truck profile           │▒▒ + blur ▒▒│
│  Storefront              │▒▒▒▒▒▒▒▒▒▒▒▒│
│  Locations               │▒▒▒▒▒▒▒▒▒▒▒▒│
│                          │▒▒▒▒▒▒▒▒▒▒▒▒│
│ BUSINESS                 │▒▒▒▒▒▒▒▒▒▒▒▒│
│  Ordering                │▒▒▒▒▒▒▒▒▒▒▒▒│
│  Taxes & fees            │▒▒▒▒▒▒▒▒▒▒▒▒│
│  Payments                │▒▒▒▒▒▒▒▒▒▒▒▒│
│  Notifications           │▒▒▒▒▒▒▒▒▒▒▒▒│
│  Team                    │▒▒▒▒▒▒▒▒▒▒▒▒│
└──────────────────────────┴────────────┘
   items h-12, tapping one navigates and closes the sheet
```

Mobile details:
- Trigger button: `md:hidden`, `h-12 w-full`, `Menu` icon (lucide) + current section name + `ChevronDown`. `aria-label="Choose a settings section"`.
- The sheet must close on navigation — control `open` state in the client rail component and close it in the link's `onClick`, since `next/link` navigation does not unmount the sheet by itself.
- **`SheetTitle` defaults to `font-heading`**, which is Big Shoulders (`app/layout.tsx`). The dashboard has retired that face, so pass `className="font-sans text-base font-semibold tracking-[-0.01em]"` on the settings sheet's title. See decision 6 in §6.
- Below `md` the rail's `border-r` and `sticky` are off; it's just a flex column.

### 4.4 Save model

One **explicit Save per section**, not per field, and not autosave.
- A sticky save bar is overkill at this size; a plain right-aligned `Save changes` button at the end of the section's rows is enough on desktop, full-width on mobile.
- Button is `disabled` until the form is dirty, so "Save" never lies.
- Result banner reuses the current pattern from `settings-form.tsx`: `role="status"`, `text-ready` on success, `text-destructive` on failure. Factor it into one `components/dashboard/settings/save-row.tsx` so all eight sections behave identically.
- Toggles (the notifications switch, a location's archive) save immediately — a switch that needs a Save button is a lie. Those use an optimistic `useTransition`, like `stock-board.tsx` already does.

---

## 5. Files and Server Actions

### 5.1 Files to change

| Path | Change |
|---|---|
| `app/(dashboard)/dashboard/(app)/layout.tsx` | Insert `<SettingsButton />` into the header cluster between the Ordering-page link and `UserButton` / Demo badge. |
| `components/dashboard/dashboard-nav.tsx` | Remove the Settings entry. Two links remain. |
| `app/(dashboard)/dashboard/(app)/settings/page.tsx` | Replace body with `redirect("/dashboard/settings/profile")`. Keep `export const metadata`. |
| `components/dashboard/settings-form.tsx` | Delete. Its content becomes `components/dashboard/settings/notifications-form.tsx` plus the switch. |
| `app/(dashboard)/dashboard/actions.ts` | Remove `saveNotificationEmail` (moves to the settings actions file). Everything else untouched. |
| `lib/tenant.ts` | Add the settings reads/writes listed in §5.6, in the existing "Dashboard: settings & onboarding" section. |
| `lib/money.ts` | Add `parsePercentToBps(input: string): number \| null` and `bpsToPercentInput(bps: number): string`, string math only, with tests alongside `money.test.ts`. |
| `prisma/schema.prisma` | `Location.archivedAt DateTime?`; five `Truck` ordering-default columns. |
| `prisma/seed` | Give the demo truck non-default values and at least two `Location` rows so the new pages aren't blank. |

### 5.2 Files to create — routes

| Path | Responsibility |
|---|---|
| `app/(dashboard)/dashboard/(app)/settings/layout.tsx` | Server Component. `requireTruckAccess()` for `role`. Renders the `Settings` h1, the shell flex container, `<SettingsRail role={role} />`, and `{children}`. The only place the two-column geometry lives. |
| `.../settings/actions.ts` | `"use server"`. All settings mutations. Same three-step discipline as `actions.ts`: `requireTruckAccess()` → Zod → a `lib/tenant.ts` function → `revalidatePath`. |
| `.../settings/profile/page.tsx` | Reads truck + `NEXT_PUBLIC_APP_URL`, renders `<ProfileForm />`. |
| `.../settings/storefront/page.tsx` | Renders `<StorefrontForm />`. |
| `.../settings/locations/page.tsx` | `getLocations(truck.id)` → `<LocationsManager />`. |
| `.../settings/ordering/page.tsx` | `getOrderingDefaults(truck.id)` → `<OrderingForm />`; passes the timezone list from `Intl.supportedValuesOf("timeZone")`. |
| `.../settings/taxes/page.tsx` | Renders `<TaxesForm />` + the read-only platform fee row. |
| `.../settings/payments/page.tsx` | `getPaymentStatus(truck.id)` → `<PaymentsStatus />`. Server-rendered, no client component needed. |
| `.../settings/notifications/page.tsx` | Renders `<NotificationsForm />`. |
| `.../settings/team/page.tsx` | `if (role !== "OWNER")` → owner-only panel. Otherwise `getTeam(truck.id)` → `<TeamList />`. |

Each page exports `metadata = { title: "<Section> · Settings" }`.

### 5.3 Files to create — components

| Path | Responsibility |
|---|---|
| `lib/settings-sections.ts` | Single source of truth: `export const SETTINGS_SECTIONS: { href, label, group: "truck" \| "business", ownerOnly?: true }[]` plus `GROUP_LABELS`. Imported by the rail, the sheet, and the layout's "current section" lookup. One list, one place. |
| `components/dashboard/settings-button.tsx` | `"use client"`. The header gear. `usePathname()` for active state. ~15 lines. |
| `components/dashboard/settings/settings-rail.tsx` | `"use client"`. Desktop rail + mobile trigger + `Sheet`. Owns the sheet's open state and closes it on navigate. Filters `ownerOnly` by the `role` prop. |
| `components/dashboard/settings/section.tsx` | Presentational: `<Section title description>` → `bg-surface rounded-2xl divide-y divide-border` card with a header block. Every section page uses it, so they cannot drift apart. |
| `components/dashboard/settings/field-row.tsx` | `<FieldRow label hint>` → the label-left / control-right row that stacks below `md`. |
| `components/dashboard/settings/save-row.tsx` | The Save button + `role="status"` result line, shared by all forms. |
| `components/dashboard/settings/profile-form.tsx` | `"use client"`. name, tagline, logo (`PhotoField`), slug with confirm step. |
| `components/dashboard/settings/storefront-form.tsx` | `"use client"`. colour input + hex, foreground swatch pair with contrast ratio, hero image, preview tile. |
| `components/dashboard/settings/locations-manager.tsx` | `"use client"`. List + add/edit form (reuse the `Sheet` pattern from `item-form-sheet.tsx`) + archive/restore toggle. |
| `components/dashboard/settings/ordering-form.tsx` | `"use client"`. Timezone `Select` + five number fields with helper text. |
| `components/dashboard/settings/taxes-form.tsx` | `"use client"`. Percent input → bps on the server. |
| `components/dashboard/settings/notifications-form.tsx` | `"use client"`. The migrated email form + the on/off `Switch`. |
| `components/dashboard/settings/team-list.tsx` | `"use client"`. Roster rows, role `Select`, remove with confirm. |
| `components/dashboard/settings/payments-status.tsx` | Server Component. Status badge + disabled Connect button. |

### 5.4 shadcn primitives to add

`components/ui/` currently has only button, checkbox, input, label, radio-group, sheet. Add via the shadcn CLI (the `@base-ui/react`-backed versions, matching the existing files):

- `switch` — notifications on/off, location archive
- `select` — timezone, member role
- `separator` — optional; `divide-y` covers most of it

Do **not** add `tabs`, `dialog`, `dropdown-menu`, or `accordion`. The rail replaces tabs, `Sheet` covers both modal needs, and a dropdown on the gear was rejected in §2.2.

### 5.5 Server Actions — Zod shapes

All in `app/(dashboard)/dashboard/(app)/settings/actions.ts`. Every one: `const { truck, role } = await requireTruckAccess()` first, Zod second, a `lib/tenant.ts` function third, `revalidatePath` last. Reuse the existing `ActionResult` type and the `fail()` helper (see decision 3 in §6 for where they should live).

```ts
// ─── Truck profile ────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your truck's name.").max(60),
  tagline: z.string().trim().max(80, "Keep the tagline under 80 characters."),
  // Only a URL this app issued, same rule as the menu item image.
  logoUrl: z.string().regex(/^\/api\/photos\/[a-z0-9]{1,40}$/).nullable(),
});
export async function saveProfile(input: z.input<typeof profileSchema>): Promise<ActionResult>

// Slug is its own action: it's the only setting that breaks live links.
const slugSchema = z
  .string().trim().toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/, "Use 3–40 lowercase letters, numbers, and dashes.")
  .refine((s) => !RESERVED_SLUGS.has(s), "That address is reserved. Try another.");
export async function saveSlug(slug: string): Promise<ActionResult>
// → also checks isSlugTaken(); on success revalidates BOTH the old and the new
//   storefront paths, because /{oldSlug} must stop resolving from cache.

// ─── Storefront ───────────────────────────────────────────────────────────
const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #22603F.");
const storefrontSchema = z.object({
  brandColor: hex,
  // Two allowed values only — an arbitrary foreground makes storefronts unreadable.
  brandColorForeground: z.enum(["#FFFFFF", "#1D2733"]),
  heroImageUrl: z.string().regex(/^\/api\/photos\/[a-z0-9]{1,40}$/).nullable(),
});
export async function saveStorefront(input: z.input<typeof storefrontSchema>): Promise<ActionResult>

// ─── Locations ────────────────────────────────────────────────────────────
const locationSchema = z.object({
  locationId: z.string().min(1).max(50).optional(), // absent = create
  name: z.string().trim().min(1, "Give the spot a name.").max(60),
  addressLine: z.string().trim().min(1, "Enter the street address.").max(120),
  city: z.string().trim().min(1, "Enter the city.").max(60),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  notes: z.string().trim().max(200).nullable(),
});
export async function saveLocation(input: z.input<typeof locationSchema>): Promise<ActionResult>
export async function setLocationArchived(
  input: { locationId: string; archived: boolean }
): Promise<ActionResult>   // soft delete only: Service.locationId references this row

// ─── Ordering ─────────────────────────────────────────────────────────────
const orderingSchema = z.object({
  timezone: z.string().refine(
    (tz) => Intl.supportedValuesOf("timeZone").includes(tz), "Pick a timezone."),
  defaultSlotMinutes: z.int().min(5).max(120),
  defaultOrdersPerSlot: z.int().min(1).max(200),
  orderingOpensHoursBefore: z.int().min(1).max(336),      // up to 2 weeks
  orderingClosesMinutesBefore: z.int().min(0).max(1440),
  slotLeadMinutes: z.int().min(0).max(240),
});
export async function saveOrdering(input: z.input<typeof orderingSchema>): Promise<ActionResult>

// ─── Taxes ────────────────────────────────────────────────────────────────
// A string, parsed with string math. Never a float.
export async function saveTaxRate(percent: string): Promise<ActionResult>
// → parsePercentToBps(percent); null or > 2000 bps (20%) → fail("Enter a rate like 8.25.")
// platformFeeBps is never writable from here. No action exists for it.

// ─── Notifications ────────────────────────────────────────────────────────
const notificationsSchema = z.object({
  enabled: z.boolean(),
  email: z.string().trim(),           // validated as an email only when enabled
});
export async function saveNotifications(
  input: z.input<typeof notificationsSchema>
): Promise<ActionResult>
// → enabled && !z.email().safeParse(email).success → fail("Enter a valid email address.")
// → enabled ? updateNotificationEmail(truck.id, email) : updateNotificationEmail(truck.id, null)
// Replaces saveNotificationEmail() in actions.ts. `null` already means "off"
// everywhere downstream (markOrderPaid / getOrderNotification), so no column is added.

// ─── Team (OWNER only) ────────────────────────────────────────────────────
const memberSchema = z.object({
  membershipId: z.string().min(1).max(50),
  role: z.enum(["OWNER", "STAFF"]),
});
export async function saveMemberRole(input: z.input<typeof memberSchema>): Promise<ActionResult>
export async function removeMember(membershipId: string): Promise<ActionResult>
// Both: if (role !== "OWNER") return fail("Only owners can manage the team.")
// Both: refuse if it would leave the truck with zero OWNERs, and refuse to
// remove or demote your own membership (userId is already on TruckAccess).
```

### 5.6 New `lib/tenant.ts` functions

All scoped by `truckId`, in the existing settings section of the file:

```ts
// reads
getTruckSettings(truckId): Promise<TruckSettings>        // the settings fields of the row
getLocations(truckId, opts?: { includeArchived?: boolean }): Promise<Location[]>
getOrderingDefaults(truckId): Promise<OrderingDefaults>
getPaymentStatus(truckId): Promise<{ accountId: string | null; onboarded: boolean }>
getTeam(truckId): Promise<TeamMember[]>                  // Membership rows + role + createdAt

// writes — each `where: { id: truckId }` or `where: { id, truckId }`
updateTruckProfile(truckId, { name, tagline, logoUrl })
updateTruckSlug(truckId, slug): Promise<{ ok: boolean; oldSlug: string }>
updateStorefront(truckId, { brandColor, brandColorForeground, heroImageUrl })
upsertLocation(truckId, locationId | null, data): Promise<boolean>
setLocationArchived(truckId, locationId, archived): Promise<boolean>
updateOrderingDefaults(truckId, data)
updateTaxRateBps(truckId, bps)
setMemberRole(truckId, membershipId, role): Promise<boolean>   // guards last-owner
deleteMember(truckId, membershipId): Promise<boolean>          // guards last-owner
```

`updateNotificationEmail` already exists and is reused as-is.

Note on `toTruck()`: it currently projects only the storefront-facing fields. **Do not widen it** — storefront components depend on that shape. Add a separate `toTruckSettings()` mapper and a `TruckSettings` type in `lib/types.ts` for the dashboard's use.

### 5.7 Schema diff

```prisma
model Truck {
  // ...existing...
  // Defaults a new Service starts from. Changing these never touches a
  // Service that already exists.
  defaultSlotMinutes          Int @default(15)
  defaultOrdersPerSlot        Int @default(4)
  orderingOpensHoursBefore    Int @default(24)
  orderingClosesMinutesBefore Int @default(15)
  slotLeadMinutes             Int @default(10) // was SLOT_LEAD_MS in lib/tenant.ts
}

model Location {
  // ...existing...
  archivedAt DateTime? // soft delete: a Service may reference this spot
}
```

Follow-ups once `slotLeadMinutes` is a column: `getBookableSlots` and `reserveSlot` in `lib/tenant.ts` must read it instead of the module constant, and both must take it from the same source so the read and the conditional update can't disagree. Keep the constant as the fallback default. Also add `where: { archivedAt: null }` to whatever eventually lists locations in the new-service picker.

Per CLAUDE.md: whoever edits the schema runs `npx prisma migrate dev` and commits the migration.

---

## 6. Decisions the user needs to make

1. **Rail side.** Specced with the rail on the **left**, against the literal request, for the reasons in §4.1 — all five researched products do it, and the forms lay out better. The entry point *is* top-right as asked. Flipping to the right is a two-token change (`md:flex-row` → `md:flex-row-reverse`, `md:border-r md:pr-6` → `md:border-l md:pl-6`). **Recommendation: build left, look at it, flip only if they still prefer right.**
2. **Latitude / longitude on Locations.** The schema requires both and we have no geocoder. Pick one: (a) two plain number fields with a "find your coords" link, (b) a paste-a-Google-Maps-link field that regexes the pair out, (c) make `lat`/`lng` optional in the schema and skip them for now. **Recommendation: (b)** — ~10 lines, no API key, and a vendor can do it from their phone. (c) is a migration on a column the storefront may want later for a map.
3. **Where the settings actions live.** Specced as a new colocated `settings/actions.ts` rather than growing `app/(dashboard)/dashboard/actions.ts` past ~400 lines. That means `ActionResult` and `fail()` need a shared home — cleanest is a small `lib/action-result.ts` that both files import. **Confirm this split is wanted**, since CLAUDE.md's architecture block implies one actions file for the dashboard.
4. **Slug editing at all.** Letting a vendor change their own URL will eventually produce a support ticket from the one who printed 500 flyers. Options: editable with a confirm step (specced), or read-only with "contact us." **Recommendation: editable with the confirm step** — a class project has no support desk, and the field is already validated by the onboarding rules.
5. **Team invites.** v1 shows the real roster but cannot add anyone, because there is no `Invite` model, no email, and no accept route — roughly one full sitting of work. **Confirm it's acceptable to ship Team as read + role + remove first**, or move invites into scope and design the `Invite` model now.
6. **Big Shoulders leak (existing bug worth knowing).** `components/ui/sheet.tsx`'s `SheetTitle` uses `font-heading`, which `app/layout.tsx` maps to Big Shoulders — the face that's been retired from the dashboard. Any sheet in the dashboard, including today's `item-form-sheet.tsx`, is rendering its title in the condensed display face right now. The settings sheet overrides it with `font-sans`, but **the real fix is to stop `SheetTitle` defaulting to `font-heading`**, or to drop `--font-display` from the dashboard subtree. Worth a separate small commit rather than per-call overrides forever.
7. **Max width.** The settings shell goes to `max-w-5xl` to fit two columns, while `menu` is `max-w-3xl` and today's settings is `max-w-2xl`. The pane itself stays `max-w-2xl` so text measure is unchanged. Flagging only because it makes Settings the widest dashboard screen.

---

## 7. Suggested build order (dependency-ordered, not dated)

1. `lib/settings-sections.ts` + `settings/layout.tsx` + `settings-rail.tsx` + the gear in the header + `dashboard-nav.tsx` trimmed + `settings/page.tsx` redirect. At this point the shell navigates with eight stub panes.
2. `section.tsx`, `field-row.tsx`, `save-row.tsx` — the three shared presentational pieces, so no section invents its own layout.
3. **Notifications** first, because it is a straight port of working code and proves the shell end to end.
4. **Truck profile** and **Storefront** — existing fields, `PhotoField` already exists.
5. **Taxes** — needs the two new `lib/money.ts` helpers and their tests.
6. **Payments** and **Team** — read-mostly, no migration.
7. Migration 1: `Location.archivedAt` → **Locations**.
8. Migration 2: the five `Truck` ordering columns → **Ordering**, then move `SLOT_LEAD_MS` off the constant.
