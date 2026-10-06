# POS screen — design spec

Branch `feature/sprint-2`. A fourth dashboard tab where a vendor rings up a walk-up
sale at the window. **UI only in this change: nothing is written to the database.**

Three decisions are already made and are not reopened here:

1. Light theme, the dashboard's existing neutral palette and tokens. Not Toast's dark UI.
2. UI only. Tapping Pay clears the check and shows a confirmation. No Prisma models, no
   migration, no Server Actions that mutate. Check state is client-side only.
3. Categories are the existing `MenuSection` rows. Adding an item in the Menu tab makes it
   appear on the POS with no further work. One source of truth, no new schema.

---

## 1. The design concept

**Receipt paper against a menu board.**

The screen is two surfaces with two different jobs, and they are built to look like two
different materials.

The **check column** on the left is pure white (`--surface`), flush to the left viewport
edge, with no radius and no gap — a strip of receipt paper fed into the screen. Its
devices are receipt devices: a fixed-width leading quantity column so quantities stack
into a scannable vertical line, hairline rules between lines, a dashed hairline above the
totals block, everything numeric set `tabular-nums`.

The **tile field** on the right is concrete (`--background`) with white tiles floating on
it — a menu board. Its devices are board devices: dish names set large and confident,
price demoted to a small tabular figure, nothing else.

That single material contrast is the whole identity of the screen, and it costs nothing:
no shadows (banned), no gradients, no decoration. The boldness is spent on **weight and
scale**, not on hue: the ink-filled Pay bar and the 2.5rem total are the heaviest things
in the app's dashboard. Exactly one saturated colour appears anywhere on the screen, for
a few seconds, at the one moment that deserves it — the `--ok` green check mark when the
sale closes.

Three radii, each encoding a class of object, so the screen does not read as one
undifferentiated card kit:

| Object | Radius | Why |
| --- | --- | --- |
| Category chips | `rounded-full` | A control you flip between. Pills read as switches. |
| Dish tiles | `rounded-xl` (1.05rem) | A thing you take. Matches the repo's button radius. |
| Check column, totals block, tender buttons | square / `rounded-xl` | Structure, not objects. |

### What is deliberately not here

- **No photos on tiles.** `MenuItem.imageUrl` exists and is ignored. A cashier reads
  names at speed; an 88px photo is mush, and a photo grid would be the prettiest and the
  slowest version of this screen. Text-first tiles are also what lets the type treatment
  carry the design. The storefront is where photos earn their place.
- **No search field.** Four sections and ~20 items do not need one. Revisit above ~60
  items.
- **No "All" chip** on the category rail. It would recreate the undifferentiated wall
  that the rail exists to avoid.
- **No tip row.** A counter sale tips in the jar. Tipping on a POS is a separate decision
  (see §11).
- **No polling.** The Service screen has `<AutoRefresh seconds={10} />`; the POS must not.
  A page that reloads under a cashier's hand mid-check is hostile. Stock is read at page
  load and on navigation.

### Typography

One family, `--font-body` (Figtree). `font-display` / `font-heading` (Big Shoulders) is
retired in the dashboard and appears nowhere here.

| Role | Size / treatment |
| --- | --- |
| Total amount | `text-[2.5rem] leading-none font-semibold tracking-[-0.03em] tabular-nums` |
| Change due | same as total |
| Dish tile name | `text-[1.0625rem] leading-[1.15] font-semibold`, clamp 2 lines |
| Pay / tender button label | `text-[1.0625rem] font-bold` |
| Check line name | `text-[0.9375rem] leading-snug` |
| Category chip | `text-[0.9375rem] font-semibold` |
| Tile price, modifier names, totals labels, micro-labels | `text-[0.8125rem]` |

Every size except 2.5rem already exists in the dashboard. 2.5rem is justified: the total
is the only figure read from arm's length across a counter, and the next step down
(2rem, the Menu `h1`) is not enough separation from the 1.0625rem rows above it.

**No uppercase tracked labels anywhere on this screen.** The queue and stock board use
them for section headers; the POS has no section headers (the category rail replaces
them) and "Subtotal / Tax / Total" are sentence case.

---

## 2. The central problem: do category tiles get colours?

**No. Nothing on this screen is colour-coded. Here is why, and what replaces it.**

### Why Toast colour-codes, and why we are not Toast

Toast's saturated tiles exist because Toast shows **many categories' items in one
scrollable wall simultaneously**. When Drinks and Mains are interleaved on screen, hue is
the only pre-attentive way to find a target. Colour is doing real work there.

Our layout shows **one category's items at a time**. The rail selects, the grid shows only
that selection. So every tile visible on screen already belongs to the same category, and
a tile's hue would encode a fact the vendor can already see. It is decoration.

### What the palette can actually afford

Of the usable hues in `app/globals.css`, four are already spoken for and carry meaning a
vendor must never misread:

| Token | Already means |
| --- | --- |
| `--new #17774A` | a new order, needs accepting |
| `--cooking #9A6510` | in the pan |
| `--ready #2A74C4` | ready at the window |
| `--signal #F2B632` | needs attention (platform chrome) |
| `--ok #1F7A4D` | saved / available / connected |
| `--brand` | arbitrary per truck; the demo truck is `#22603F` |

A category palette would therefore have to be a fifth, sixth, seventh hue invented for
this screen, on a surface whose entire job is reading names and numbers. And it breaks
structurally: a truck with nine sections forces the ramp to repeat, which teaches the
cashier a grouping that does not exist. A vendor whose brand is green already has one
green collision risk; adding generated hues multiplies it.

Hashing section names to hues is the engineering answer and it is worse than no colour: it
is unpredictable, it will produce values that sit next to `--cooking` amber, and the
vendor cannot control it.

### What replaces colour: position stability

Speed at a till comes from **the target always being in the same place**, not from its
colour. The design guarantees that:

- Sections appear in `sortOrder` — the vendor's own order from the Menu tab — and the rail
  never reorders.
- The grid is a fixed column count per breakpoint; items appear in `sortOrder`.
- **Sold-out items keep their tile and their position** (§6). The grid never reflows.
- Tile width stays ~205px at every breakpoint from 1024px up (§4), so moving between a
  tablet and a desktop browser does not move the targets.

### What carries state instead

| Signal | Treatment | Contrast |
| --- | --- | --- |
| Selected category | Ink fill: `bg-foreground text-background`, `rounded-full h-11 px-5` | 12.98:1 |
| Unselected category | `bg-surface text-foreground border border-border` | 15.11:1 |
| Available dish tile | `bg-surface border border-border`, ink name | 15.11:1 |
| Sold-out dish tile | `bg-muted`, `text-muted-foreground line-through` | 4.75:1 |
| Tile price | `text-muted-foreground` on `--surface` | 5.96:1 |
| Pay bar | `bg-foreground text-background` | 12.98:1 |
| Sale closed check mark + amount | `text-ok` on `--surface` | 5.32:1 |
| Clear / Remove (confirming) | `text-destructive` on `--surface` | 6.58:1 |

All computed against the real token values; every text pairing clears WCAG AA (4.5:1) and
all but the two muted cases clear AAA.

### Why Pay is ink, not brand

The order queue deliberately refuses `--brand` so a vendor's colour never carries
meaning. The POS follows that precedent for the same reason, plus one more: a truck whose
brand is green (the demo truck) would put a green **Pay** button one tab away from a green
**New order** ticket. Pay is `--foreground` ink on every truck — the darkest, heaviest
element available, unmistakable, and truck-independent.

`--brand` therefore appears nowhere on this screen, not even as the focus ring: big
targets use `focus-visible:ring-4 focus-visible:ring-foreground/30`, matching
`order-ticket.tsx`, the app's other big-target vendor surface.

---

## 3. Wireframe — 1024px (the design target)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Pollo Loco                              Ordering page ↗   ⚙   [Demo mode]    │  header 52px
│  Service   POS   Menu   Schedule                                             │  nav 48px
│            ▔▔▔                                                               │
├─────────────────────────┬────────────────────────────────────────────────────┤
│ Check               4   │  ( Tacos ) ( Plates ) ( Sides ) ( Drinks )         │
│                   Clear │                                                    │
│ ─────────────────────── │  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  2  Al pastor taco      │  │ Al pastor    │ │ Carnitas     │ │ Barbacoa    │ │
│     Flour tortilla      │  │ taco         │ │ taco         │ │ taco        │ │
│                   $7.00 │  │ 3.50       ⌄ │ │ 3.75       ⌄ │ │ 4.25      ⌄ │ │
│ ─────────────────────── │  └──────────────┘ └──────────────┘ └─────────────┘ │
│  1  Horchata            │  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│     ┌───┬───┬───┐       │  │ Lengua       │ │ Pescado      │ │ Veggie      │ │
│     │ − │ 1 │ + │ Remove│  │ taco         │ │ taco         │ │ taco        │ │
│     └───┴───┴───┘ $3.25 │  │ 4.00       ⌄ │ │ Sold out     │ │ 3.25      ⌄ │ │
│ ─────────────────────── │  └──────────────┘ └──────────────┘ └─────────────┘ │
│  1  Chips & salsa       │  ┌──────────────┐                                  │
│                   $2.50 │  │ Quesabirria  │                                  │
│ ─────────────────────── │  │ taco         │                                  │
│                         │  │ 5.00       ⌄ │                                  │
│         ↕ scrolls       │  └──────────────┘                                  │
│                         │                                                    │
│                         │                     ↕ scrolls                      │
│ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ │                                                    │
│ Subtotal         $12.75 │                                                    │
│ Tax 8.25%         $1.05 │                                                    │
│ Total            $13.80 │   ← 2.5rem tabular                                 │
│ ┌─────────────────────┐ │                                                    │
│ │  Pay        $13.80  │ │   ← ink fill, h-16                                 │
│ └─────────────────────┘ │                                                    │
└─────────────────────────┴────────────────────────────────────────────────────┘
      22rem fixed                 flexible · 3 cols (4 at ≥1280px)
      white, flush left           concrete field, white tiles
```

`⌄` on a tile = this dish has choices; tapping opens the options panel (§5).
The `− 1 + Remove` row appears only on the **selected** check line.
Neither column scrolls the document: both scroll internally (§4).

### Tender step — replaces the check footer in place, lines stay visible

```
│  1  Chips & salsa       │
│                   $2.50 │
│ ─────────────────────── │
│         ↕ scrolls       │
│ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ │
│ Total            $13.80 │
│                         │
│ ‹ Back to check         │
│ ┌─────────────────────┐ │
│ │  Card               │ │  h-16
│ ├─────────────────────┤ │
│ │  Cash               │ │
│ ├─────────────────────┤ │
│ │  Other              │ │
│ └─────────────────────┘ │
```

### Cash — change due, integer cents only

```
│ Total            $13.80 │
│ Cash received    $20.00 │
│ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ │
│ Change due              │
│            $6.20        │  ← 2.5rem tabular
│                         │
│ (Exact)($15)($20)($40)  │  quick cash, h-11 pills
│ ┌────┬────┬────┐        │
│ │ 1  │ 2  │ 3  │        │  h-14 keys
│ ├────┼────┼────┤        │
│ │ 4  │ 5  │ 6  │        │
│ ├────┼────┼────┤        │
│ │ 7  │ 8  │ 9  │        │
│ ├────┼────┼────┤        │
│ │ 0  │ 00 │ ⌫  │        │
│ └────┴────┴────┘        │
│ ┌─────────────────────┐ │
│ │  Complete sale      │ │
│ └─────────────────────┘ │
```

### Sale closed

```
│                         │
│           ✓             │  --ok, the only hue on the screen
│                         │
│      Sale closed        │
│        $13.80           │
│      Cash · change      │
│         $6.20           │
│                         │
│ ┌─────────────────────┐ │
│ │  New sale           │ │
│ └─────────────────────┘ │
│                         │
│  Tiles stay live — tap  │
│  a dish to start the    │
│  next check.            │
```

---

## 4. Breakpoints

**This is the one tablet-first screen in the app.** Everything else is designed at 375px
and grows. A POS is used on a counter-mounted tablet in landscape, so the design target is
1024–1180px wide and — critically — **744–820px tall**, which is the scarce axis.

### Height budget (why the screen must not scroll)

Dashboard chrome above `{children}`: header `pt-3` (12px) + control row (40px) = 52px, plus
`DashboardNav` `h-12` (48px), plus the `border-b` (1px) = **101px ≈ 6.375rem**.

On an iPad mini landscape (1133×744) that leaves ~643px. So at `lg` and up:

- The POS root is `lg:h-[calc(100dvh-var(--pos-chrome))] lg:overflow-hidden`, with
  `--pos-chrome: 6.375rem` declared inline on that root.
- The document never scrolls. The check lines scroll in their own `overflow-y-auto
  min-h-0` region; the tile grid scrolls in its own.
- Totals + Pay are pinned to the bottom of the check column and never scroll away. The
  category rail is pinned to the top of the tile column and never scrolls away.

`--pos-chrome` is a local layout constant, not a design token, and is the single number to
change if the header height ever changes. It is deliberately **not** added to
`globals.css`, and the dashboard layout is **not** modified — making the layout a flex/
`h-dvh` container would change scrolling on every other dashboard page and break
`ServiceBar`'s `sticky top-0 lg:static`.

### The three sizes

| Width | Layout | Check | Tiles | Tile size |
| --- | --- | --- | --- | --- |
| **≥1280px** | two columns | `w-[24rem]` (384px) | 4 columns | ~207 × 88px |
| **1024–1279px** | two columns | `w-[22rem]` (352px) | 3 columns | ~205 × 88px |
| **768–1023px** | two columns | `w-[17rem]` (272px) | 2 columns | ~226 × 88px |
| **<768px** | single column + bottom bar + sheet | in a bottom Sheet | 2 columns | ~167 × 80px |

Tile width lands at ~205px at both 1024 and 1280 by design: the column count steps up
exactly as fast as the width, so the targets do not move when a vendor switches between the
counter tablet and a laptop.

**768px (portrait tablet)** keeps two columns. The left check is the entire point of the
layout and a portrait tablet has 1024px of height to spare, so the check narrows rather
than disappears. Two 226px tiles per row is comfortable.

**<768px (a phone) abandons the two-column layout.** There is no honest way to fit a 272px
check beside a tile grid in 375px, and pretending otherwise produces two unusable columns.
Instead:

- Category chips become a horizontally scrolling rail (`overflow-x-auto` + the existing
  `.no-scrollbar` utility).
- Dish tiles in 2 columns (343px of content − 8px gap = ~167px each), `min-h-20`.
- A `sticky bottom-0` bar with `pb-[max(0.75rem,env(safe-area-inset-bottom))]` showing
  `4 items · $13.80` and a **Review check** button.
- Review check opens the **same `CheckPanel` component** in the existing
  `components/ui/sheet.tsx` with `side="bottom"`, `max-h-[92dvh]` — identical to how the
  storefront's `ItemSheet` presents itself. The tender step and cash pad render inside
  that sheet.

Because `CheckPanel` is written once and mounted in two containers, the phone layout costs
one conditional wrapper, not a second implementation.

Stated plainly in the spec and worth repeating to the user: **the phone layout exists so
the tab is not broken when a vendor opens the dashboard on their phone — not because a
phone is a good till.**

---

## 5. Items with modifier groups

`components/storefront/item-sheet.tsx` already solved modifier selection, including the
right default behaviour: `defaultSelections()` pre-picks the first available option of
every **required single-choice** group, so the common case ("pick a tortilla" → flour)
needs no interaction. The POS keeps that and routes by how much the cashier must actually
decide:

| Item | Tap behaviour | Taps to add |
| --- | --- | --- |
| No modifier groups | Adds to the check instantly | 1 |
| Any **required** group | Opens the options panel, pre-filled with defaults; **Add** is enabled immediately | 2 |
| Only **optional** groups | Adds instantly. The check line carries an **Options** affordance to open the same panel after the fact | 1 |

Rationale: a required group is not ceremony — it is a question the cashier has to ask the
customer anyway, and the till should show it so the kitchen gets the right ticket.
Defaults being pre-applied means the fast path is still two taps. An *optional* group is an
upsell; making the cashier dismiss a panel for an upsell nobody asked about is pure tax, so
those items add straight through.

### Where the panel appears

- **≥768px: not a sheet.** The options panel **replaces the tile field in the right
  column**, full height, with a sticky Add footer. Two reasons: a bottom sheet on a
  landscape tablet puts the controls at the far bottom edge away from the eye line, and it
  covers the check — the cashier is reading the order back out loud while picking options,
  so the check must stay visible. Replacing the tile field also gives option rows a huge
  target (`min-h-14` rows instead of the storefront's `min-h-12`).
- **<768px:** the existing bottom `Sheet`, matching the storefront.

### Reuse boundary

Do **not** import `ItemSheet`. It is coupled to `useCart`, to `ItemPhoto`, and it uses
`font-display`, which is banned in the dashboard. Imitate its structure instead.

The piece genuinely worth sharing is the selection model, which is pure and has no UI:

```
lib/menu/selections.ts          (new, pure, no DB)
  export type Selections = Record<string, string[]>   // groupId → chosen option ids
  export function defaultSelections(item: MenuItem): Selections
  export function unmetGroup(item: MenuItem, s: Selections): ModifierGroup | undefined
  export function chosenOptionIds(s: Selections): string[]
```

Lifted verbatim from the logic currently inline in `item-sheet.tsx`. The POS imports it;
unit price comes from the existing `unitPriceCents(item, optionIds)` in `lib/money.ts`.
**Pointing `item-sheet.tsx` at the same module is an optional follow-up**, not part of this
change — the POS lands without touching the storefront.

Option rows use the existing `RadioGroup` / `RadioGroupItem` (single-select) and `Checkbox`
(multi-select) primitives, `min-h-14`, hairline-divided, with `+$1.50` deltas right-aligned
`tabular-nums` and unavailable options disabled and labelled "Sold out" — same semantics as
the storefront, bigger targets.

---

## 6. Sold-out items

A tile for an item with `isAvailable === false`:

- **Keeps its position.** The grid never reflows. This is the whole speed argument from §2 —
  and a visible sold-out tile is a useful reminder that the dish exists but is gone, which
  is better than the cashier hunting for a tile that silently vanished.
- `bg-muted` (`#E3E6E8`) instead of `bg-surface`, so it recedes into the concrete field
  rather than reading as a white target.
- Name `text-muted-foreground line-through` (4.75:1 on that fill).
- The price is **replaced** by the words "Sold out", not shown alongside them.
- No `⌄` options marker.
- **Not tappable:** a real `<button disabled>` with `aria-disabled` — it stays in the DOM
  and in the accessibility tree so a screen reader announces "Pescado taco, sold out,
  dimmed", but tabbing skips it and taps do nothing. No toast, no error. There is nothing
  for the cashier to fix from here.

The POS is a **read-only reflection** of stock. Flipping stock stays where it already lives:
the Service screen's stock sheet and the Menu tab. Rationale: two places to change one fact
is how the two screens drift apart, and the cashier at the window is not the person
deciding the kitchen is out of fish. Since the page is `force-dynamic` and does not poll,
a stock change made on the Service tab appears on the POS as soon as the vendor navigates
back to it.

---

## 7. The check panel

### Header

`Check` + the item count (sum of quantities), and a **Clear** button on the right. Clear
uses the two-tap confirm pattern already in `menu-manager.tsx`: first tap turns it into
"Clear check?" in `text-destructive` on a `bg-destructive/10` pill, `onBlur` cancels.

### Line rows

```
 2   Al pastor taco              ← qty in a fixed 2.25rem tabular column
     Flour tortilla, extra salsa ← 0.8125rem muted, modifier names only
                          $7.00  ← line total, right-aligned tabular
```

- Divided by hairlines (`divide-y divide-border`), no boxes.
- The whole row is a button. **Tapping a line selects it**; the selected row expands to
  reveal a `size-11` `−` / qty / `+` stepper and a **Remove** button. Only one line is
  selected at a time. Quiet rows, 44px targets, no per-row chrome multiplied by ten lines.
- Quantity is clamped 1…20, matching `MAX_QUANTITY_PER_LINE` in `lib/pricing.ts`, so the
  POS can never build a check the real pricer would reject. Pressing `−` at 1 is disabled;
  Remove is the way to get to zero.
- **Tapping the same dish again increments the matching line** rather than appending a
  second one. Merge key: `menuItemId` + `optionIds` sorted and joined. Standard POS
  behaviour and it keeps the check short enough to read back.
- A just-added or just-incremented line gets a 150ms `motion-safe:` background fade and
  `scrollIntoView({ block: "nearest" })`. That is the only non-user-triggered motion on the
  screen, and it answers an action rather than decorating.

### Totals

A dashed hairline (`border-t border-dashed border-border`) — the one receipt flourish, used
exactly once — then:

```
Subtotal        $12.75
Tax 8.25%        $1.05
Total           $13.80      ← 2.5rem
```

- Integer cents throughout. `taxCents = applyBps(subtotalCents, truck.taxRateBps)` and the
  total via the existing `orderTotals(subtotalCents, taxRateBps, 0)` in `lib/money.ts` —
  tip is `0`. No floats anywhere, even though nothing persists.
- The tax label shows the rate using the existing `bpsToPercentInput(taxRateBps)` →
  `"8.25"` → `Tax 8.25%`. Showing the rate means a vendor who thinks the number looks wrong
  can see why without opening Settings.
- All money rendered with `formatCents`.

### Empty state

```
│ Check                   │
│ ─────────────────────── │
│                         │
│   No items yet.         │
│   Tap a dish to start   │
│   the check.            │
│                         │
│ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ │
│  Nothing to charge yet. │  ← footer keeps its height, no dead button
```

The totals rows are hidden rather than showing `$0.00` — zeros are noise. The footer keeps
its height so the layout does not jump when the first item lands, but it shows the
invitation line instead of a disabled Pay button: a greyed-out primary button is a dead
end, and an empty screen should point somewhere.

---

## 8. Checkout flow

Five states in one state machine, all inside the check column (and inside the sheet on a
phone). No modals: a dialog over a 744px-tall tablet hides the lines the cashier may still
need to read back, and keeping the flow in one column is what makes the later wiring a
single function body (§10).

```
check ──Pay──▶ tender ──Card──▶ closed
                 │  ──Other─▶ closed
                 │  ──Cash──▶ cash ──Complete sale──▶ closed
                 └──‹ Back to check──▶ check
closed ──New sale / tapping any dish──▶ check (empty)
```

**1. check** — Pay bar: `bg-foreground text-background h-16 w-full rounded-xl`, label
`Pay` left, amount right, `tabular-nums`. Present only when the check has lines.

**2. tender** — three stacked `h-16` buttons, `bg-surface border border-border`, hairline
between: **Card**, **Cash**, **Other**. Plus a quiet `‹ Back to check` text button above
them. Focus moves to **Card** when the step opens.

**3. Card** → straight to **closed**. No fake terminal animation and no fake "insert card"
screen: a card tender is later a Stripe Terminal or Checkout handoff and inventing chrome
for it now is chrome we will delete. Tender recorded as `"CARD"` in local state.

**4. Cash** → a shallow change calculator:

- Quick-cash pills: **Exact**, then the next $5 / $10 / $20 above the total, computed in
  integer cents — `Math.ceil(totalCents / 500) * 500`, `/ 1000`, `/ 2000`. Duplicates (an
  exact total of $20.00 making the "$20" pill redundant) are filtered out.
- A numeric keypad for any other amount. Digits build cents directly by shifting:
  `cents => Math.min(cents * 10 + digit, 9_999_999)`. A `00` key shifts twice, `⌫` divides
  by 10. **There is no `parseFloat` and no decimal point** — the amount is only ever an
  integer. (`parseDollarsToCents` from `lib/money.ts` is available if a typed-text field is
  ever preferred, but the keypad does not need it.)
- **Change due** = `tenderedCents - totalCents`, shown at 2.5rem the moment it is ≥ 0.
  While tendered is short, that figure is replaced by `Short $4.80` in `text-muted-foreground`
  and **Complete sale** is disabled.

**5. closed** — the panel becomes a single quiet state: an `--ok` check mark (5.32:1), "Sale
closed", the amount, the tender name, and change due when there was any. Wrapped in
`role="status"` so it is announced. Focus moves to **New sale**.

- **It never auto-dismisses.** A till waits for the human — especially on a cash sale,
  where the change-due figure must stay on screen until the cashier has counted it out.
  (This also means there is no timer to make `prefers-reduced-motion`-sensitive.)
- The tile field stays live behind it: **tapping any dish starts the next check with that
  item already on it**, which is the real fast path during a rush. **New sale** is the
  explicit route to an empty check.

No order number is shown. Nothing persists, so there is no number to show, and inventing
one would be a lie the cashier might read out to a customer.

---

## 9. Navigation — four tabs at 375px

**Order: `Service · POS · Menu · Schedule`.** POS goes second: the two screens used *during*
a service sit adjacent, then the two used to set one up. Settings stays a gear in the
header (`settings-button.tsx` documents why, and that reasoning is unchanged).

### Do four fit at 375px?

Measured against the existing styles — `nav` is `flex gap-1 px-2`, each link is
`px-3 text-[0.9375rem] font-semibold` (Figtree SemiBold at 15px):

| Label | Text | + `px-3` (24px) |
| --- | --- | --- |
| Service | ~52px | 76px |
| POS | ~31px | 55px |
| Menu | ~42px | 66px |
| Schedule | ~65px | 89px |
| gaps | 3 × 4px | 12px |
| container `px-2` | | 16px |
| **total** | | **~314px** |

**Four tabs fit at 375px with ~60px of slack.** No change to `dashboard-nav.tsx` beyond
adding the entry. "POS" is the shortest of the four labels, which is lucky and also the
reason to keep the acronym.

**If it ever stops fitting** — a longer label, a larger OS text size, a 320px device — the
fix is two lines and does not require a redesign: add `overflow-x-auto no-scrollbar` to the
`nav` and drop the links to `px-2.5`. The existing `.no-scrollbar` utility in
`globals.css` already exists for exactly this. Do **not** collapse tabs into a "More"
menu; four is not enough to earn one.

The active tab keeps the existing treatment: ink text plus the `h-[3px]` ink underline
inset to `inset-x-3`. Active detection needs `pathname.startsWith("/dashboard/pos")`,
which the existing `LINKS.map` logic already handles for non-root hrefs.

---

## 10. Files

### Create

| Path | Owns | Component type |
| --- | --- | --- |
| `app/(dashboard)/dashboard/(app)/pos/page.tsx` | `requireTruckAccess()` → `getManagedMenu(truck.id)`, drops archived items and then empty sections, renders `<PosScreen>`. `export const dynamic = "force-dynamic"`, `metadata = { title: "POS" }`. Menu-empty state links to `/dashboard/menu`. | **Server** |
| `components/dashboard/pos/pos-screen.tsx` | The root. Owns the flow state (`check \| tender \| cash \| closed`), which category is selected, which item's options are open, and the two-column vs. phone shell. | `"use client"` |
| `components/dashboard/pos/use-check.ts` | All check state: add / increment / set quantity / remove / clear, the merge rule, and the display totals. **This is the seam** (below). | client hook |
| `components/dashboard/pos/category-rail.tsx` | Section chips. Presentational: `sections`, `selectedId`, `onSelect`. | `"use client"` |
| `components/dashboard/pos/dish-grid.tsx` | The tile grid and its column counts. Presentational. | `"use client"` |
| `components/dashboard/pos/dish-tile.tsx` | One tile: available / sold-out / has-options states. Presentational. | `"use client"` |
| `components/dashboard/pos/check-panel.tsx` | Header, scrolling line list, totals block, and a `footer` slot. Mounted in the left column at ≥768px and inside the `Sheet` below it. Presentational. | `"use client"` |
| `components/dashboard/pos/check-line.tsx` | One line row plus the selected-state stepper and Remove. Presentational. | `"use client"` |
| `components/dashboard/pos/pos-options.tsx` | Modifier picking. Right-column panel at ≥768px, bottom `Sheet` below. Imports `lib/menu/selections.ts`. | `"use client"` |
| `components/dashboard/pos/tender-step.tsx` | Card / Cash / Other + back. Presentational. | `"use client"` |
| `components/dashboard/pos/cash-pad.tsx` | Quick-cash pills, integer-cent keypad, change due. Presentational. | `"use client"` |
| `components/dashboard/pos/sale-closed.tsx` | The confirmation state. Presentational. | `"use client"` |
| `lib/menu/selections.ts` | `Selections`, `defaultSelections`, `unmetGroup`, `chosenOptionIds`. Pure, no DB, unit-testable. | shared |

### Edit

| Path | Change |
| --- | --- |
| `components/dashboard/dashboard-nav.tsx` | One entry: `{ href: "/dashboard/pos", label: "POS" }`, placed second. |

### Do not create

No Prisma model, no migration, no Server Action, no `lib/tenant.ts` change, no
`globals.css` change, no new colour token.

### Server / client boundary

`page.tsx` is the only server file and crosses exactly two props:

```ts
const { truck } = await requireTruckAccess();        // the only source of truckId
const menu = await getManagedMenu(truck.id);         // the only query, via lib/tenant.ts

const sections = (menu?.sections ?? [])
  .map((s) => ({ ...s, items: s.items.filter((i) => !i.archived) }))
  .filter((s) => s.items.length > 0);

<PosScreen sections={sections} taxRateBps={truck.taxRateBps} />
```

Same shape the Service page already uses for its stock board, so the two screens read the
menu identically. Everything below `PosScreen` is client and presentational: callbacks and
props only, no data fetching, no actions.

### The seam for wiring it to the real pipeline

Deliberately one function body. `use-check.ts` stores lines in **the shape
`lib/pricing.ts` already wants**:

```ts
// use-check.ts
export type CheckLine = {
  key: string;        // menuItemId + sorted optionIds — the merge key, display only
  menuItemId: string;
  optionIds: string[];
  quantity: number;
};

// RequestedLine in lib/pricing.ts is { menuItemId, optionIds, quantity }.
// So the hand-off is a field drop, not a transform:
export const toRequestedLines = (lines: CheckLine[]) =>
  lines.map(({ menuItemId, optionIds, quantity }) => ({ menuItemId, optionIds, quantity }));
```

Totals shown on screen are computed client-side from the same menu rows the Server
Component already sent, via `unitPriceCents` and `orderTotals` from `lib/money.ts`. That is
exactly the "display an estimate" use `lib/money.ts`'s own header comment sanctions; the
authoritative number will come back from the server once the action exists.

`PosScreen` has one callback that closes a sale:

```ts
function onPaid(tender: Tender, tenderedCents: number) {
  setFlow({ step: "closed", tender, tenderedCents, totalCents });
  clear();                       // ← today, the whole implementation
  // later:
  // const result = await completePosSale({ lines: toRequestedLines(lines), tender });
  // priceOrder() reprices server-side, createOrder() persists, markOrderPaid() fires.
}
```

**That function body is the entire wiring surface.** Nothing else changes: the tiles, the
check, the tender step and the confirmation are all already driven by state that the server
round-trip would simply confirm.

---

## 11. Open questions for the user

1. **A walk-up sale has no Service and no pickup slot — and that blocks persistence, not
   this UI.** `createOrder` reserves a `PickupSlot` on a `Service`, and `Order` carries a
   customer name. A cash sale at the window has none of those. Before the POS can ever
   write a row, one of these has to be chosen: (a) every Service gets a "walk-up"
   pseudo-slot with effectively unlimited capacity, (b) `Order.serviceId` and the slot
   become nullable with an `OrderChannel` of `PREORDER | COUNTER`, or (c) counter sales are
   a separate table and never enter the queue at all. **(b) is the recommendation** — the
   vendor almost certainly wants counter sales in the same day's totals — but it is a
   schema decision and the spec deliberately does not make it. Worth deciding now because
   it shapes what "later" costs.
2. **Tab label.** The spec ships "POS" because the user asked for it and vendors arriving
   from Square or Toast recognise it. "Sell" or "Till" is plainer English for someone who
   has never used a POS before. The owner's call; it is a one-word change.
3. **Tip on a counter sale?** Omitted on purpose. If counter tips matter, the natural place
   is a fourth step between tender and closed (three percentage pills + No tip), and
   `orderTotals` already takes `tipCents`.
4. **Does the POS belong behind a role check?** `Membership.role` is `OWNER | STAFF`. Every
   dashboard tab is currently open to both. If a till should be staff-accessible while
   Settings is not, that is a broader permissions decision than this screen.
5. **One number to watch.** `--pos-chrome: 6.375rem` is measured from the current header
   (12px padding + 40px control row + 48px nav + 1px border). If the dashboard header ever
   changes height, that one value changes with it. Noted so it is not a silent breakage.
