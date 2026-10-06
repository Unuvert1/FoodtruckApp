# Spec — Vendor Service Screen redesign

Scope: the live order queue at `/dashboard`. Spec only; no app code changed.
Primary device: a phone at 375px, held one-handed, mid-rush, greasy thumb.
Job of the screen, in one sentence: **a new paid order shows up, you notice it, you accept it in one tap, and the customer sees that it was accepted.**

---

## 1. Diagnosis — why it reads as "clumped up"

### 1.1 Five competing headline sizes, none of them a hierarchy

| Where | Class | Size |
|---|---|---|
| `(app)/layout.tsx:15` truck name | `text-[1.375rem]` | 22px |
| `order-queue.tsx:64` "Orders" h1 | `text-[2rem] tracking-[-0.03em]` | 32px |
| `stock-board.tsx:32` "Stock" h1 | `text-[2rem] md:text-[1.75rem]` | 32/28px |
| `order-queue.tsx:83` pickup-time h2 | `text-[1.375rem]` | 22px |
| `order-queue.tsx:132` ticket number | `text-[2.25rem]` | **36px** |

The largest type on the page is on the *ticket*, not the page. Two `h1`s ("Orders", "Stock") sit side by side at the same weight, so neither wins. The pickup-time `h2` is the exact size of the global truck name, so a group heading and the app chrome read as peers. Five steps between 22px and 36px is not a scale — it is noise, and noise reads as density.

### 1.2 The counts float, unattached, and repeat information

`order-queue.tsx:63-69` puts `<h1>` and `<p className="flex flex-wrap gap-1.5">` in one `justify-between` baseline row. At 375px "Orders" plus three pills wrap, so the pills land in the middle of a two-line header, belonging to nothing. They also restate what the tickets already encode: `2 new` duplicates `ring-2 ring-signal` + the `h-2 bg-signal` strip + the `Accept` button color + the `STATUS_LABEL` text. Four encodings of one fact.

### 1.3 Everything is a filled, ringed box, so nothing is a card

On a `#ECEEEF` page these are all simultaneously present:

- ticket: `rounded-2xl bg-surface ring-1 ring-border` (`order-queue.tsx:125`)
- completed drawer: `rounded-2xl bg-surface` (`:98`)
- empty state: `rounded-2xl border border-dashed border-border` (`:75`)
- every stock row: `rounded-xl bg-surface ring-1 ring-border` (`stock-board.tsx:52`)
- tab strip: `rounded-xl bg-muted p-1` (`service-screen.tsx:50`)
- service picker: `h-12 rounded-xl border border-input bg-surface` (`:39`)

Six box treatments, every one white-on-grey with a hairline. Two tickets at `gap-3` put 12px between two 1px rings → the eye reads a seam, not a separation. This is the single biggest contributor to "clumped": the design direction says *hairlines rather than boxes*, and the screen is all boxes.

### 1.4 No vertical rhythm

On one screen: `pt-4 pb-16`, `mt-4`, `mt-5`, `mt-6`, `mt-3`, `mt-1`, `mt-8`, `gap-3`, `gap-1.5`, `space-y-1.5`, `py-2.5`, `px-4 pt-3`, `p-3`. Eleven distinct vertical steps, none derived from a scale.

Worst instance: the ticket body is inset `px-4` (`:131`, `:139`, `:150`) but the button block is `p-3` (`:157`). **Every primary button on the screen is 4px misaligned with the text above it.** That misalignment, repeated on every ticket, is most of the "sloppy" feeling.

### 1.5 Group chrome costs more than the content

Grouping by pickup time (`:58-59`) emits a `<section className="mt-6">` + `<h2 className="mb-2">` per slot. A realistic rush — 3 slots, 1-2 orders each — spends three headings and ~90px of chrome on five tickets, while two `h1`s are already shouting above. The number of headings grows with traffic.

### 1.6 The grid never actually produces a grid

`grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]` (`:88`): at 375px minus `px-4` the track is 343px → one column. At 768px, after the `20rem` stock rail and `gap-6`, the orders column is ~400px → still one column. It only breaks to two columns around 1280px. So the auto-fill is cosmetic, and meanwhile each ticket is tall — number + name + status + N lines + phone/total + 56px button + 40px cancel ≈ 280-340px. **A phone shows about 1.2 tickets.** Mid-rush you scroll to find work.

### 1.7 The primary action has no fixed position

The Accept/Start/Ready button sits at the bottom of a variable-height card, so in a list of tickets the buttons never align. "The accept button" has no muscle-memory location; you have to read first.

### 1.8 A destructive action 4px from the most-tapped one

`Cancel order` is a 40px full-width button at `mt-1` under the 56px primary (`:170-180`). Two-tap confirm helps, but the first tap is a greasy thumb 4px from Accept. It also doubles the footer height of every ticket for an action used perhaps once per service.

### 1.9 Stock gets a permanent 320px and can hide the orders

`md:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[minmax(0,1fr)_22rem]` (`service-screen.tsx:59`) gives a twice-a-service toggle list a third of the tablet viewport, squeezing the thing the screen exists for. On a phone it is worse: Stock is a *tab*, so the vendor can be standing on the Stock panel while orders pile up, with a badge in a tab label as the only hint. That defeats the screen's purpose.

### 1.10 The least important control is the first thing on the page

A native `<select>`, 48px tall, full width, above the fold and above the `h1` (`:34-47`). The stop barely ever changes during a service.

---

## 2. Redesign

### 2.1 Governing decisions

1. **Three zones, not N time groups.** `NEW` → `COOKING` → `READY`. The zones are defined by *the action they need* (Accept / Start-or-Mark-ready / hand it over), which is what the vendor is deciding. Three labels are fixed and stable; time groups grow with traffic (§1.5). Within each zone, sort by pickup time — the kitchen's order is preserved, it just isn't spent on headings. A zone renders only when non-empty, and its label carries its own count, which deletes the floating badge cluster (§1.2).
2. **Pickup time rides on the ticket**, as 13px muted meta on the row's top line. A row stays self-contained — which matters, because a row is the unit you act on.
3. **Hairlines, no cards.** Rows are separated by `divide-y divide-border` on a `bg-surface` sheet that runs edge-to-edge at 375px. No ring, no radius, no shadow on a ticket. The only remaining radii on the screen are on controls (buttons, the stock trigger) and the sheet.
4. **One accent per zone, and `--signal` is reserved.** `--signal` appears *only* for PAID work: the NEW zone's 4px left rail, its Accept button, and the arrival flash. `--ready` appears only in the READY zone. `--brand` is the advance button in COOKING. Nothing else is colored. This is what makes a row of tickets readable at arm's length.
5. **Stock is a bottom sheet at every breakpoint.** It never occupies layout, and — crucially — it can never replace the order list.
6. **One column at every breakpoint.** A queue is read top-to-bottom; widening it into a grid costs the vendor reading order and gains nothing.

### 2.2 Spacing and type scale (the whole screen, nothing else allowed)

Space: `4 / 8 / 12 / 16 / 24 / 32` → `gap-1 gap-2 gap-3 gap-4`, `py-4`, `mt-8` between zones. Horizontal inset is **`px-4`, uniformly, including the button block** — this fixes §1.4.

Type (4 sizes, Figtree, tight tracking, no `font-display`):

| Role | Spec |
|---|---|
| Order number | `text-[1.75rem] font-semibold tabular-nums tracking-[-0.03em] leading-none` |
| Customer name / primary button | `text-base font-semibold` / button `text-[1.0625rem] font-bold` |
| Line items | `text-[0.9375rem] leading-snug` |
| Meta, zone labels, status micro-label | `text-[0.8125rem]`; zone label `font-semibold uppercase tracking-[0.08em] text-muted-foreground` |

The visible `h1 "Orders"` and `h1 "Stock"` are both **deleted**. The nav already says "Service"; the sticky bar says which stop. An `sr-only h1` keeps the document outline.

### 2.3 Wireframe — 375px (primary)

```
┌───────────────────────────────────────────┐
│ Today · Lot 4  12–2p   ⌄    ♪    Stock·2 │ ← sticky 56px, hairline bottom,
├═══════════════════════════════════════════┤   bg-surface/90 backdrop-blur
│  ▲ 3px strip: --signal, flashes on arrival│
│                                           │
│  NEW · 2                                  │ ← 13px uppercase, mt-6, px-4
│ ┌───────────────────────────────────────┐ │ ← bg-surface, full-bleed, no radius
│ ║ 104    Maya R.           12:15 pickup │ │   ║ = 4px --signal left rail
│ ║ 2× Birria Taco · 1× Horchata          │ │   one line, truncate
│ ║ ┌───────────────────────────────────┐ │ │
│ ║ │             Accept                │ │ │ ← 64px, bg-signal, px-4 aligned
│ ║ └───────────────────────────────────┘ │ │
│ ╞───────────────────────────────────────╡ │ ← divide-y hairline
│ ║ 105    Devon             12:15 pickup │ │
│ ║ 1× Quesabirria                        │ │
│ ║ ┌───────────────────────────────────┐ │ │
│ ║ │             Accept                │ │ │
│ ║ └───────────────────────────────────┘ │ │
│ └───────────────────────────────────────┘ │
│                                           │
│  COOKING · 2                              │ ← mt-8
│ ┌───────────────────────────────────────┐ │
│ │ 102    Sam           11:45 · Preparing│ │
│ │ 2× Birria Taco                        │ │
│ │   extra onion, no cilantro            │ │
│ │ 1× Agua Fresca                        │ │
│ │ ┌─────────────────────────────┐  ┌──┐ │ │
│ │ │        Mark ready           │  │⋯ │ │ │ ← 56px primary + 56px square
│ │ └─────────────────────────────┘  └──┘ │ │
│ ╞───────────────────────────────────────╡ │
│ │ 103    Priya          12:00 · Accepted│ │
│ │ 3× Taco de Asada                      │ │
│ │ ┌─────────────────────────────┐  ┌──┐ │ │
│ │ │           Start             │  │⋯ │ │ │
│ │ └─────────────────────────────┘  └──┘ │ │
│ └───────────────────────────────────────┘ │
│                                           │
│  READY · 1                                │
│ ┌───────────────────────────────────────┐ │
│ ║ 101    Alex             11:30 · Ready │ │ ← ║ = 4px --ready left rail
│ ║ 1× Birria Taco                        │ │
│ ║ ┌─────────────────────────────┐  ┌──┐ │ │
│ ║ │          Picked up          │  │⋯ │ │ │ ← bg-ready
│ ║ └─────────────────────────────┘  └──┘ │ │
│ └───────────────────────────────────────┘ │
│                                           │
│  12 done today                          › │ ← plain text row, no card, mt-8
└───────────────────────────────────────────┘
```

Empty state (no active orders): the zones vanish; one centered block, no dashed border —
`All caught up.` (16px semibold) / `New orders land here on their own.` (13px muted).

### 2.4 Wireframe — 768px

Same single column, capped and centered; the row gets horizontal room so the primary action moves to the right edge and gains a fixed x-position (§1.7). The sheet gets a radius again because it no longer touches the viewport edge.

```
┌──────────────────────────────────────────────────────────────┐
│  Today · Lot 4   12:00–2:00p    ⌄          ♪       Stock · 2  │ ← sticky
├══════════════════════════════════════════════════════════════┤
│          ┌────────────────────── max-w-[40rem] ────────────┐  │
│          │ NEW · 2                                         │  │
│          │┌───────────────────────────────────────────────┐│  │
│          │║ 104  Maya R.   12:15 pickup   ┌─────────────┐ ││  │
│          │║ 2× Birria Taco · 1× Horchata  │   Accept    │ ││  │
│          │║                               └─────────────┘ ││  │
│          │╞═══════════════════════════════════════════════╡│  │
│          │║ 105  Devon     12:15 pickup   ┌─────────────┐ ││  │
│          │║ 1× Quesabirria                │   Accept    │ ││  │
│          │╚═══════════════════════════════════════════════╝│  │
│          │                                                 │  │
│          │ COOKING · 2                                     │  │
│          │┌───────────────────────────────────────────────┐│  │
│          ││ 102  Sam    11:45 · Preparing  ┌────────┐ ┌──┐││  │
│          ││ 2× Birria Taco                 │  Mark  │ │⋯ │││  │
│          ││   extra onion, no cilantro     │  ready │ │  │││  │
│          ││ 1× Agua Fresca                 └────────┘ └──┘││  │
│          │└───────────────────────────────────────────────┘│  │
│          └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Row at ≥768: `grid grid-cols-[1fr_auto]`, primary button `w-44 h-14`, `⋯` `size-14`, both vertically centered on the row. Button x-position is now identical on every ticket.

### 2.5 Wireframe — 1280px

Identical to 768, `max-w-[44rem]`, centered, sticky bar becomes a static header (nothing to save by sticking on a laptop). No second column, no filler panel.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Pablo's Birria            Ordering page ↗                     Demo mode     │ ← existing layout header
│ Service   Menu   Settings                                                   │ ← existing nav
├────────────────────────────────────────────────────────────────────────────┤
│              Today · Lot 4 · 12:00–2:00p  ⌄       ♪      Stock · 2          │
│              ───────────────────────────────────────────────────            │
│              ┌─────────────── max-w-[44rem] ──────────────┐                 │
│              │ NEW · 2                                    │                 │
│              │ ║ 104 Maya R. 12:15        [  Accept  ]    │                 │
│              │ ║ 105 Devon   12:15        [  Accept  ]    │                 │
│              │ COOKING · 2                                │                 │
│              │ │ 102 Sam     11:45  [Mark ready] [⋯]      │                 │
│              │ │ 103 Priya   12:00  [  Start   ] [⋯]      │                 │
│              │ READY · 1                                  │                 │
│              │ ║ 101 Alex    11:30  [Picked up ] [⋯]      │                 │
│              └────────────────────────────────────────────┘                 │
└────────────────────────────────────────────────────────────────────────────┘
```

**Why no wide layout:** the queue is a linear read with a fixed action per row. Two columns break pickup-time reading order and double the distance the eye travels to find the next thing to do. Empty side margin is cheaper than that. (This is the Mail-reading-pane / iOS-Settings pattern the design direction points at.)

### 2.6 What happens to Stock — decision

**Stock becomes a bottom sheet, opened from a `Stock · 2` button in the sticky bar, at every breakpoint.** Not side-by-side, not a tab.

Justification:
- The phone tab (§1.9) can *hide the order list*. That is a correctness bug in a screen whose job is noticing orders, not just a layout preference.
- Frequency: stock is touched a couple of times per service ("we're out of horchata"); orders are touched continuously. Persistent 320px for the rare task is backwards.
- One implementation at all widths. Today's `hidden md:block` ships both arrangements and keeps both in the tree; a sheet is one code path.
- The trigger label carries the state the vendor needs without opening it (`Stock` / `Stock · 2` when something is sold out), so nothing is lost by hiding the list.
- `components/ui/sheet.tsx` (base-ui Dialog) already exists with `side="bottom"` support, so this is assembly, not new primitives.

Sheet spec: `side="bottom"`, `max-h-[85dvh]`, `overflow-y-auto`, `rounded-t-3xl`, title "Stock", description "Tap an item to mark it sold out. Customers see it right away." At ≥1024 use `side="right"`, `max-w-sm` (the base-ui default) — same component, one prop, because at that width a side sheet keeps the queue visible behind it.

### 2.7 The order ticket

**Kept** — and nothing else:

| Element | Why it earns its place |
|---|---|
| Order number | The only thing shouted at the window. Biggest type on the row. |
| Customer name | How you confirm the right person at the window. |
| Pickup time | Decides what you cook next. |
| Line items + modifiers | The cook ticket. Modifiers indented 1.5rem under their line. |
| Primary action button | The screen's entire purpose. Fixed position, ≥56px, color = zone. |
| Status micro-label | Disambiguates ACCEPTED vs PREPARING inside COOKING. 13px, muted, same line as the time. |
| `⋯` overflow | 56px square. Opens the ticket sheet. Present only in COOKING/READY. |

**Cut from the row** (moved into the `⋯` sheet, or deleted):

| Cut | Reason |
|---|---|
| Inline `tel:` phone link (`:150-153`) | Needed maybe once a service, when something is wrong. → sheet |
| Inline total (`:154`) | Already paid. Changes no vendor decision. → sheet |
| `Cancel order` button (`:170-180`) | Destructive, adjacent to the hottest tap target (§1.8). → sheet, keeps its two-tap confirm |
| `ring-2 ring-signal` / `ring-2 ring-ready` (`:126-127`) | Replaced by the 4px left rail; rings are boxes (§1.3) |
| `h-2 bg-signal` top strip (`:130`) | Third encoding of "new" (§1.2) |
| `STATUS_LABEL` under the name (`:135`) | In NEW and READY the zone already says it; kept only as the COOKING micro-label |
| `rounded-2xl bg-surface ring-1 ring-border` | Rows are hairline-divided, not carded |

**Hierarchy, in the order the eye should hit it:** (1) order number, (2) the filled primary button, (3) the item lines, (4) time + name meta, (5) status micro-label. Weight does the work; only the button and the rail are colored.

**Status at a glance down a row of tickets** — three signals, all readable at arm's length and none dependent on reading text:
- **position** (zone), which does most of it;
- **a 4px left rail**: `--signal` (NEW), none (COOKING), `--ready` (READY);
- **button fill**: `bg-signal` / `bg-brand` / `bg-ready`.

Color-blind safety: the three states differ by *position* first, so hue is never load-bearing. Rail colors also differ in luminance (`#F2B632` vs `#1F7A4D`).

### 2.8 "Done today"

`<details>` with a plain `summary` — `12 done today ›`, 13px, no `bg-surface`, no radius, `mt-8`, `border-t border-border` only. Contents keep the existing compact `divide-y` list (`order-queue.tsx:100-109`); it is already fine.

---

## 3. The accept → notify → confirm loop

### 3.1 How the order arrives

Unchanged: `AutoRefresh seconds={10}` (`components/auto-refresh.tsx`) calls `router.refresh()`, the Server Component re-queries `getServiceOrders`, and `OrderQueue` receives new props. No websockets, no new endpoint.

### 3.2 How the vendor notices — `useNewOrders`

`OrderQueue` is already a client component. Add a small hook that diffs PAID ids across renders:

```ts
// components/dashboard/use-new-orders.ts
export function useNewOrders(orders: OrderView[]) {
  const seen = useRef<Set<string> | null>(null);
  const [arrived, setArrived] = useState<string[]>([]);   // ids to animate
  const [arrivalKey, setArrivalKey] = useState(0);        // bumps to retrigger the flash

  useEffect(() => {
    const paid = orders.filter((o) => o.status === "PAID").map((o) => o.id);
    if (seen.current === null) { seen.current = new Set(paid); return; } // first mount: no alarm
    const fresh = paid.filter((id) => !seen.current!.has(id));
    for (const id of paid) seen.current.add(id);
    if (fresh.length) { setArrived(fresh); setArrivalKey((k) => k + 1); }
  }, [orders]);

  return { arrived, arrivalKey };
}
```

First mount seeds the set, so opening the dashboard with four waiting orders does not alarm. Ids are never removed from the set, so an accepted-then-refreshed order can't re-trigger.

Three notifications, in order of how hard they are to miss:

1. **The NEW zone itself.** It is at the top, above COOKING, with the `--signal` rail and a `bg-signal` button. A new order is the first thing on screen; the vendor does not have to look for it.
2. **The arrival flash.** A 3px `--signal` strip immediately under the sticky bar, normally `opacity-0`. On `arrivalKey` change it runs one `signal-sweep` (§4). Visible even if the vendor has scrolled into COOKING, because the bar is sticky.
3. **The chime** (opt-in). A `♪` toggle in the sticky bar, `aria-pressed`, persisted in `localStorage("ft.chime")`. The tap that enables it is the user gesture that unlocks audio:

```ts
// components/dashboard/new-order-chime.tsx — WebAudio, no asset to commit
function chime(ctx: AudioContext) {
  [880, 1320].forEach((hz, i) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = hz;
    const t = ctx.currentTime + i * 0.14;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.24);
  });
}
```

Two notes, ~380ms total. Default **off** — an unexpected noise in a truck is worse than a missed glance, and autoplay would be blocked anyway.

4. **Tab title badge** (cheap, keep it). While `document.visibilityState === "hidden"` and `newCount > 0`, set `document.title = "(2) Service"`; restore on visible. One `useEffect`. This covers the common real case: the vendor has the POS tab in front.

**Rejected: the Notification API / web push.** It needs a permission prompt, a service worker for push, and on iOS only works for an installed PWA — a large amount of machinery for a loop the sticky `--signal` strip plus an optional chime already closes, on a device that is sitting on the counter. Explicitly out of scope.

### 3.3 How they accept — one tap

`Accept` is the full-width 64px `bg-signal` button on the NEW row. It calls the **existing** `advanceOrder({ orderId, from: "PAID" })`. Already correct and already safe:

- `useOptimistic` (`order-queue.tsx:22-24`) moves the ticket to COOKING on tap, before the round trip;
- `advanceOrderStatus` (`lib/tenant.ts:408-424`) is `updateMany` with `status: from` in the where-clause, so if two staff tap the same ticket the second gets `count === 0`, `advanceOrder` returns `"This order was already updated. The queue has been refreshed."`, and the queue re-syncs. The conditional-update rule is respected as-is.

No confirmation step, no toast, no spinner. The ticket leaving the NEW zone *is* the confirmation, and the NEW label disappearing is the second one.

### 3.4 How the customer learns — exact changes

Today the customer **cannot tell**: `components/storefront/order-status.tsx:11` maps `PAID` and `ACCEPTED` to the same step, "Order received". Accepting changes nothing the customer can see. That is the hole the user is pointing at. Two small changes close it.

**(a) `components/storefront/order-status.tsx` — split the first step.**

```ts
const STEPS: { label: string; statuses: Status[] }[] = [
  { label: "Order sent",            statuses: ["PAID"] },
  { label: "Confirmed by the truck", statuses: ["ACCEPTED"] },
  { label: "Being prepared",         statuses: ["PREPARING"] },
  { label: "Ready at the window",    statuses: ["READY"] },
  { label: "Picked up",              statuses: ["PICKED_UP"] },
];
```

**(b) same file — one status headline in the brand hero**, replacing the hard-coded line at `:27-29`:

```ts
const HEADLINE: Partial<Record<Status, (name: string) => string>> = {
  PAID:      (n) => `Thanks, ${n}. Waiting for the truck to confirm.`,
  ACCEPTED:  (n) => `Confirmed, ${n}. We'll start it before your pickup time.`,
  PREPARING: (n) => `${n}, your order is being made now.`,
  READY:     (n) => `${n}, your order is ready.`,
  PICKED_UP: (n) => `Thanks, ${n}. Enjoy.`,
};
```

That one line is the whole customer-facing payoff: PAID says "waiting", and within ten seconds of the tap it says "Confirmed". No new component, no new state.

**(c) `app/(storefront)/[truckSlug]/order/[orderId]/page.tsx:38` — poll faster while unconfirmed.**

```tsx
{!done && <AutoRefresh seconds={found.order.status === "PAID" ? 8 : 15} />}
```

The one moment the customer is actually staring at the page is right after checkout, waiting for confirmation. 8s there, 15s afterwards.

**Not doing** (and why): SMS (no Twilio, and a paid dependency for a class project); a confirmation email on accept (`Order.customerEmail` exists and is nullable, but `OrderView` doesn't carry it and it'd need a new Resend template — see §7 for the decision); any "customer is watching" indicator for the vendor. The honest limitation, stated plainly: **if the customer closes the tab, they learn nothing until they reopen the link.** For a pre-order picked up in 20-40 minutes that is acceptable.

---

## 4. Motion — exactly one orchestrated moment

**The moment is a new order arriving.** Three things fire together, once, and nothing else on this screen animates ever.

```css
/* app/globals.css — inside @theme inline */
--animate-ticket-in:   ticket-in 0.22s ease-out;
--animate-signal-sweep: signal-sweep 1.1s ease-out;
```

```css
/* app/globals.css — top level */
@keyframes ticket-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: none; }
}
@keyframes signal-sweep {
  0%   { opacity: 0; }
  12%  { opacity: 1; }
  100% { opacity: 0; }
}
```

The orchestration, 0 → 1.1s:

| t | What |
|---|---|
| 0ms | the new row renders with `motion-safe:animate-ticket-in` (6px down-shift + fade, 220ms). Rows below are pushed by normal layout — no FLIP, no library. |
| 0ms | the 3px strip under the sticky bar runs `signal-sweep`, keyed by `arrivalKey` so a second arrival restarts it. |
| 0ms | the chime, if enabled. |
| 1.1s | over. The screen is static again. |

Everything else is instant on purpose: status advances are `useOptimistic` (no transition, no spinner — a 56px button that moves immediately feels faster than any animation), the stock sheet uses the slide base-ui already ships (`sheet.tsx:56`), zone labels and counts change with no transition.

**`prefers-reduced-motion`:** `motion-safe:` on both animations removes them. The reduced-motion substitute is not a flash but **a steady state**: the strip renders at `opacity-100` for as long as `NEW` is non-empty (a persistent 3px `--signal` line under the bar), and the new row simply appears. Motion-safe users get the same persistent line *after* the sweep ends, so the two paths converge — nobody relies on having seen a transient. Implement as: strip is `opacity-100` whenever `newCount > 0`, and the sweep is an *additional* overlay element with `motion-safe:animate-signal-sweep`.

---

## 5. File structure

### Changed

| File | Responsibility after the change |
|---|---|
| `app/(dashboard)/dashboard/(app)/page.tsx` | Unchanged data fetching. Also pass `selected` and `locations[selected.locationId]` into `ServiceScreen` so the sticky bar can label the stop without re-deriving it. Keep `AutoRefresh seconds={10}`. |
| `components/dashboard/service-screen.tsx` | Shrinks to a shell: sticky bar + `<OrderQueue>`. Loses the `<select>`, loses the `role="tablist"` block, loses the `md:grid-cols-[...20rem]` grid, loses the `tab` state. ~35 lines. |
| `components/dashboard/order-queue.tsx` | The three zones, the optimistic advance/cancel transitions (keep as-is), `useNewOrders`, the arrival strip state, the `⋯` sheet's open state, the done drawer. Renders `OrderTicket`s; owns no row markup. |
| `components/dashboard/stock-board.tsx` | Keep the list and the optimistic toggle. **Delete** the `h1`, the `<p>` description, and `md:sticky md:top-4` — the sheet header now supplies title and description. |
| `components/dashboard/badge.tsx` | Keep; now used only by the `Stock · 2` trigger. If the trigger just renders `Stock · 2` as text (preferred), **delete the file** and drop its two imports. |
| `components/storefront/order-status.tsx` | 5 `STEPS` + the `HEADLINE` map (§3.4a/b). No structural change. |
| `app/(storefront)/[truckSlug]/order/[orderId]/page.tsx` | One line: status-dependent `AutoRefresh` interval (§3.4c). |
| `lib/orders/status.ts` | One label change for a 56px button: `ACCEPTED: "Start"` (was `"Start preparing"`). Everything else stands — `NEXT_STATUS`, `ADVANCE_LABEL`, `STATUS_LABEL`, `ACTIVE_STATUSES`, `isAdvanceable` are all still exactly right. |
| `app/globals.css` | Two `@keyframes` + two `--animate-*` theme vars (§4). **No new color tokens.** |

### New

| File | Responsibility |
|---|---|
| `components/dashboard/service-bar.tsx` | Client. Sticky top bar: stop label (`formatDayLabel` + location + `formatTimeRange`, truncated to one line), the switcher trigger, the chime toggle, the stock trigger, and the `--signal` strip (static when `newCount > 0`, plus the sweep overlay). Props: `{ service, location, truck, newCount, soldOutCount, arrivalKey, children }` — stock/switcher sheets rendered as children so the bar stays presentational. |
| `components/dashboard/service-switcher.tsx` | Client. `Sheet side="bottom"`. The stop list as `<Link href={"/dashboard?service=" + id}>` rows, ≥56px each, current one marked `aria-current="true"`. Replaces the native `<select>` and drops `useRouter`. |
| `components/dashboard/order-ticket.tsx` | Client. One row: number, name, time, micro-label, lines, primary button, `⋯`. The left rail and button fill come from one `tone` prop (`"new" | "cooking" | "ready"`) derived from status by the parent. No data fetching, no actions — callbacks only. |
| `components/dashboard/ticket-sheet.tsx` | Client. `Sheet side="bottom"` for one ticket: `tel:` link as a 56px row, the receipt totals (`subtotal / tax / tip / total`, `tabular-nums`), and `Cancel order` with its existing two-tap confirm, as a `text-destructive` row at the bottom, separated by `border-t`. |
| `components/dashboard/stock-sheet.tsx` | Client. `Sheet` (`side="bottom"`, `lg:side="right"`) + `SheetHeader` title/description + `<StockBoard>`. |
| `components/dashboard/new-order-chime.tsx` | Client. The `♪` toggle, `localStorage` pref, lazily-created `AudioContext`, and the oscillator chime (§3.2). Plays when `arrivalKey` changes and the pref is on. |
| `components/dashboard/use-new-orders.ts` | Client hook (§3.2). The PAID-id diff + `arrivalKey`. Also the hidden-tab `document.title` badge, so there's one place that knows "a new order appeared". |

### Deleted

- `TabButton` in `service-screen.tsx:71-97` — no tabs any more.

### New Server Actions

**None are required.** `advanceOrder` (`app/(dashboard)/dashboard/actions.ts:41-52`) already *is* the accept path, its Zod schema already admits exactly `"PAID" | "ACCEPTED" | "PREPARING" | "READY"`, and `cancelOrderAction` and `setStock` are unchanged. Adding an `acceptOrder` wrapper would duplicate a working, correctly-guarded action.

**One optional action**, if §7's "Accept all" decision goes yes — same file, same pattern, no `lib/tenant.ts` change:

```ts
const acceptAllSchema = z.object({ orderIds: z.array(id).min(1).max(25) });

export async function acceptAllNew(
  input: z.input<typeof acceptAllSchema>
): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();
  const parsed = acceptAllSchema.safeParse(input);
  if (!parsed.success) return fail("Those orders can't be updated.");

  // Each one is still a conditional update: PAID → ACCEPTED, never a skipped step.
  const results = await Promise.all(
    parsed.data.orderIds.map((orderId) =>
      advanceOrderStatus(truck.id, orderId, "PAID", "ACCEPTED")
    )
  );
  refresh(truck.slug);
  return results.some(Boolean)
    ? { ok: true }
    : fail("Those orders were already updated. The queue has been refreshed.");
}
```

---

## 6. Build order (dependency-ordered, not dated)

1. `app/globals.css` keyframes — nothing depends on it, and it unblocks §4.
2. `use-new-orders.ts` — pure hook, testable alone.
3. `order-ticket.tsx` + `ticket-sheet.tsx` — the row, with props hand-fed.
4. Rewrite `order-queue.tsx` to zones using those two. **The screen is already better than today at this point** — ship/review here.
5. `service-bar.tsx` + `service-switcher.tsx` + `stock-sheet.tsx`; trim `stock-board.tsx`; gut `service-screen.tsx`.
6. `new-order-chime.tsx` (independent, skippable).
7. The storefront side: `order-status.tsx` steps + headline, and the one-line poll change.

Steps 4 and 7 are the two that actually answer the user's complaint; 5 and 6 are polish.

---

## 7. Needs a user decision

1. **Chime default.** Spec says off, opt-in via the `♪` toggle. If the truck is noisy you may want it on by default and let them mute — but the first poll after page load would then be blocked by autoplay policy until any tap. Recommend keeping it off.
2. **"Accept all · 3"** button at the head of the NEW zone when `newCount > 1`. Genuinely useful mid-rush, costs the optional Server Action in §5 plus one button. Recommend **yes if** two or more orders commonly land in the same minute, otherwise skip.
3. **Email the customer on accept.** `Order.customerEmail` exists but is nullable and absent from `OrderView`; Resend is already wired for the vendor email. Cost: one field through the mapper, one template, one call in `advanceOrder` when `from === "PAID"`. Recommend **no** — the user said not to overwork this, and the polling status page already shows confirmation within ~8s.
4. **Keep the ACCEPTED → PREPARING step?** The data model has both, but a two-person truck may tap "Start" immediately after "Accept" every single time, which makes it a wasted tap mid-rush. Dropping it from the UI (not the enum) would mean Accept jumps PAID → PREPARING, which contradicts the documented flow. Recommend keeping it; flagging because it is the one place the spec adds a tap the vendor may not want.
5. **Does Stock need to be reachable from the sticky bar on the Menu screen too?** Out of scope here, but it's the same sheet and the same question will come up.
