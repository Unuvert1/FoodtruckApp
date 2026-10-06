# Spec — Service queue rework + order detail view

Branch base: `feature/sprint-2` (clean, 6 commits on `origin/main`).
Scope: the four requests below. Two implementation streams with disjoint file ownership (see the end).

> This is a spec. No application file is edited by this document.

## The four requests

1. New orders in green, gently blinking, so the owner notices them.
2. Drop the "Start" step — Accept starts cooking. "Mark ready" → Ready. Ready orders close themselves after 30 minutes.
3. Pastel palette, rework the colours. New = green, slowly flashing. "The other ones idc."
4. A real order-detail view: customer name, line-by-line food with modifiers and prices, contact-customer button, and an "issue with order" block offering cancel order / cancel an item / refund an item.

---

## 1. Resolved tensions

### (a) Colour collision — what READY becomes

Today: `--signal` `#F2B632` (yellow) = NEW, `--ready` `#1F7A4D` (green) = READY. The user wants NEW green.

**Decision: a three-colour semantic triad.**

| Zone | Hue | Why |
| --- | --- | --- |
| **New** (`PAID`) | **green** `#17774A` | What the user asked for; DoorDash's "accept" green. The loudest control on the screen. |
| **Cooking** (`PREPARING`, legacy `ACCEPTED`) | **warm amber** `#9A6510` / tint `#FBE9C8` | The freed-up yellow family moves here. Warm = "in the pan". Only ever a tint + border, never a loud fill. |
| **Ready** (`READY`) | **blue** `#2A74C4` | A cool hue, maximally far from green in every common colour-vision deficiency (green↔blue separates cleanly under protan/deutan/tritan; green↔amber does not). |

Why blue and not "darker green" or amber: green→green is exactly the confusion the user must never have, and amber is already spoken for by Cooking. Blue also reads as "done / informational", which is what Ready is — the vendor's remaining job there is handing food over, not cooking.

**Second collision, not in the brief but real:** today the Cooking button is `bg-brand`. The seeded demo truck's brand colour is `#22603F` — green. If NEW becomes green, a green-branded truck gets two green buttons in adjacent zones. **The queue must stop using `--brand` entirely.** The queue's three colours are platform-owned and brand-free (see (b)).

**Colour is never the only signal.** Each zone keeps its heading (`New · 3`, `Cooking · 2`, `Ready · 1`), each button has a distinct word (`Accept` / `Mark ready` / `Picked up`), and the three zones differ structurally: New is tinted *and* animated, Cooking is plain white, Ready is tinted and static. A greyscale screenshot still parses.

### (b) Pastel vs. legibility

Pastel lives in the **row/zone backgrounds and the two calm buttons**; the one saturated colour on screen is the New zone's Accept button. All ratios computed against sRGB relative luminance (WCAG 2.x formula).

#### Exact tokens to change in `app/globals.css`

Add to `@theme inline` (keep the existing `--color-*` lines and `--animate-ticket-in` / `--animate-signal-sweep`):

```css
@theme inline {
  --color-new: var(--new);
  --color-new-foreground: var(--new-foreground);
  --color-new-tint: var(--new-tint);
  --color-new-tint-strong: var(--new-tint-strong);

  --color-cooking: var(--cooking);
  --color-cooking-ink: var(--cooking-ink);
  --color-cooking-tint: var(--cooking-tint);

  --color-ready: var(--ready);
  --color-ready-ink: var(--ready-ink);
  --color-ready-tint: var(--ready-tint);
  --color-ready-tint-strong: var(--ready-tint-strong);

  --color-ok: var(--ok);

  --animate-new-pulse: new-pulse 2.4s ease-in-out infinite;
}
```

Replace the `--signal` / `--ready` block in `:root` with:

```css
:root {
  /* unchanged: the generic "needs attention" chrome token */
  --signal: #f2b632;
  --signal-foreground: #1d2733;

  /* NEW token, carries --ready's OLD value. "saved / available / connected". */
  --ok: #1f7a4d;

  /* Queue zone: NEW */
  --new: #17774a;
  --new-foreground: #ffffff;
  --new-tint: #e6f4ea;
  --new-tint-strong: #d3ebdc;

  /* Queue zone: COOKING */
  --cooking: #9a6510;
  --cooking-ink: #4a3000;
  --cooking-tint: #fbe9c8;

  /* Queue zone: READY — CHANGED from #1f7a4d (green) to blue */
  --ready: #2a74c4;
  --ready-ink: #1b4c86;
  --ready-tint: #e4edfa;
  --ready-tint-strong: #cfe2f6;
}
```

#### Contrast table

Ink is `--foreground` `#1D2733`; muted is `--muted-foreground` `#5C6660`; surface is `#FFFFFF`.

| Pair | Role | Ratio | Needs | ✓ |
| --- | --- | --- | --- | --- |
| `#FFFFFF` on `--new` `#17774A` | Accept button label | **5.56:1** | 4.5 | ✓ |
| `--new` vs surface | New rail, button edge (UI boundary) | **5.56:1** | 3.0 | ✓ |
| `--new` vs `--new-tint` | rail sitting on the tinted zone | **4.90:1** | 3.0 | ✓ |
| ink on `--new-tint` `#E6F4EA` | all New-row text, pulse trough | **13.30:1** | 4.5 | ✓ |
| ink on `--new-tint-strong` `#D3EBDC` | pulse crest / reduced-motion steady | **12.00:1** | 4.5 | ✓ |
| muted on `--new-tint` | "12:45 pickup" meta | **5.25:1** | 4.5 | ✓ |
| `--cooking-ink` `#4A3000` on `--cooking-tint` | "Mark ready" button label | **10.26:1** | 4.5 | ✓ |
| `--cooking` `#9A6510` vs surface | Cooking button border | **4.95:1** | 3.0 | ✓ |
| ink on `--cooking-tint` `#FBE9C8` | (if a cooking tint is used behind text) | **12.65:1** | 4.5 | ✓ |
| muted on `--cooking-tint` | | **4.99:1** | 4.5 | ✓ |
| `--ready-ink` `#1B4C86` on `--ready-tint-strong` `#CFE2F6` | "Picked up" button label | **6.54:1** | 4.5 | ✓ |
| `--ready` `#2A74C4` vs surface | Ready rail / button border | **4.78:1** | 3.0 | ✓ |
| `--ready` vs `--ready-tint` | rail on the tinted zone | **4.05:1** | 3.0 | ✓ |
| ink on `--ready-tint` `#E4EDFA` | all Ready-row text | **12.80:1** | 4.5 | ✓ |
| muted on `--ready-tint` | | **5.05:1** | 4.5 | ✓ |
| `--destructive` `#B42318` on surface | "Cancel order" | **6.57:1** | 4.5 | ✓ |

Note the deliberate asymmetry: **only New gets a filled, saturated button.** Cooking and Ready get tint-fill + 1px coloured border + dark same-hue ink. That is how the New zone stays loudest without the other zones shouting back, and it is what makes the whole screen read as pastel.

#### What this does to the platform-palette comment

The comment currently says the chrome stays neutral *so a truck's brand colour can sit on it*. That rule holds for the storefront and `--primary`, and it needs one revision for the dashboard. Replace the "Platform-only" paragraph with:

```
  Platform-only (home page, dashboard):
    signal    #F2B632  street-sign amber: "needs attention" chrome (badges, pills)
    ok        #1F7A4D  saved / available / connected
  The vendor's order queue owns a fixed three-colour triad and deliberately does
  NOT use --brand: a truck whose brand colour is green (the demo truck is
  #22603F) would collide with the NEW green and a vendor must never confuse
  "new" with "ready". --brand still drives the storefront and --primary.
    new       #17774A  green, tint #E6F4EA  a new order, needs accepting
    cooking   #9A6510  amber, tint #FBE9C8  in the pan
    ready     #2A74C4  blue,  tint #E4EDFA  ready at the window
```

`--signal` keeps its exact value and its three existing consumers (dashboard layout badge, home-page stop list, payments pill). `--ready`'s old green value survives under the new name `--ok`, so the six incidental "saved / available / connected" usages change token name only — zero visual change there.

### (c) The pulse, specified

```css
@keyframes new-pulse {
  0%, 100% { background-color: var(--new-tint); }
  50%      { background-color: var(--new-tint-strong); }
}
```

- **Property animated:** `background-color` only. Not `opacity` (would fade the text with it), not `transform`, not `box-shadow` (banned), not border colour.
- **Applied to:** the New zone's `<ul>` — **one element, not one per row.** Per-row animations start at each row's mount time and drift out of phase, which reads as visual noise; one parent element makes the whole zone breathe as one. Rows sit on a transparent background.
- **Period:** 2.4s, `ease-in-out`, `infinite`. That is 0.42 Hz — one slow breath. The user's "calm pace".
- **Amplitude:** ΔL = 0.0903 absolute relative luminance (`#E6F4EA` L=0.8746 → `#D3EBDC` L=0.7843). WCAG 2.3.1's general-flash definition requires ≥0.10 relative-luminance change, so **this is under the threshold and does not count as a flash at all** — the 3-flashes-per-second limit is not merely respected, it does not apply. Both endpoints hold ≥12:1 against ink, so text legibility never moves during the cycle.
- **`prefers-reduced-motion: reduce`:** no animation; the zone rests at a **steady** `--new-tint-strong` (the crest), so the New zone is still the most-tinted, most-obvious zone. Steady state, not a transient.

  Implement as: base class is the steady state, `motion-safe:` adds the animation.
  ```tsx
  // the New zone's <ul>
  className="bg-new-tint-strong motion-safe:bg-new-tint motion-safe:animate-new-pulse"
  ```
- **Keep** the existing per-row `motion-safe:animate-ticket-in` (0.22s entrance). It is a one-shot transient, not a flash, and it is how the vendor sees *which* row is the new one.
- **Service bar strip** (`service-bar.tsx`): the 3px strip becomes `bg-new` instead of `bg-signal`; it stays steady while `newCount > 0` (that is already the reduced-motion path, unchanged) and the one-off `animate-signal-sweep` on arrival stays as-is, recoloured. Rename nothing in the keyframe.
- The audio chime (`new-order-chime.tsx`) is untouched. It is opt-in and already the right non-visual channel.

### (d) Removing "Start" — the state machine

**Decision: Accept moves `PAID → PREPARING` directly. `ACCEPTED` becomes legacy — kept in the enum, never written again.**

Why `PREPARING` and not "keep `ACCEPTED` as the cooking state":

- `PREPARING` is the honest name for "the kitchen is cooking it".
- `ADVANCE_LABEL.PREPARING` is already `"Mark ready"` — exactly the next tap the user wants.
- The customer step `"Being prepared"` already exists and is the correct thing to show. If `ACCEPTED` were the cooking state, the customer's cooking step would be labelled "Confirmed by the truck", which is wrong.
- Keeping `ACCEPTED` in the Prisma enum means **no destructive enum migration** and any order sitting in `ACCEPTED` at deploy time still renders and still advances.

`lib/orders/status.ts` becomes:

```ts
export type AdvanceableStatus = "PAID" | "ACCEPTED" | "PREPARING" | "READY";

export const NEXT_STATUS: Record<AdvanceableStatus, OrderStatus> = {
  PAID: "PREPARING",   // Accept starts cooking; there is no separate Start tap
  ACCEPTED: "READY",   // legacy rows only — nothing writes ACCEPTED any more
  PREPARING: "READY",
  READY: "PICKED_UP",
};

export const ADVANCE_LABEL: Record<AdvanceableStatus, string> = {
  PAID: "Accept",
  ACCEPTED: "Mark ready", // a legacy row behaves exactly like a PREPARING one
  PREPARING: "Mark ready",
  READY: "Picked up",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "New",
  ACCEPTED: "Cooking", // was "Accepted"
  PREPARING: "Cooking", // was "Preparing"
  READY: "Ready",
  PICKED_UP: "Picked up",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const ACTIVE_STATUSES: OrderStatus[] = ["PAID", "ACCEPTED", "PREPARING", "READY"]; // unchanged

/** How long a READY order waits before it closes itself. */
export const AUTO_COMPLETE_AFTER_MINUTES = 30;
```

`ZONES` in `order-queue.tsx` is unchanged in shape — `cooking` already matches `["ACCEPTED", "PREPARING"]`, which is exactly what we want during the transition.

`advanceSchema`'s `from: z.enum(["PAID","ACCEPTED","PREPARING","READY"])` needs **no change** — the set is still valid.

**Exactly what the customer sees** (`components/storefront/order-status.tsx`): five steps collapse to four.

```ts
const STEPS = [
  { label: "Order sent",          statuses: ["PAID"] },
  { label: "Being prepared",      statuses: ["ACCEPTED", "PREPARING"] },
  { label: "Ready at the window", statuses: ["READY"] },
  { label: "Picked up",           statuses: ["PICKED_UP"] },
];
```

`"Confirmed by the truck"` is deleted as a step. The `HEADLINE` map keeps `PAID` as-is and maps `ACCEPTED` to the same copy as `PREPARING` so a legacy row reads right:

```ts
PAID:      (n) => `Thanks, ${n}. Waiting for the truck to confirm.`,
ACCEPTED:  (n) => `${n}, the truck has your order — it's being made.`,
PREPARING: (n) => `${n}, the truck has your order — it's being made.`,
READY:     (n) => `${n}, your order is ready.`,
PICKED_UP: (n) => `Thanks, ${n}. Enjoy.`,
```

So: the moment the vendor taps **Accept**, the customer jumps from step 1 of 4 to step 2 of 4 and the headline changes from "Waiting for the truck to confirm" to "the truck has your order — it's being made". They no longer see a confirm step that is instantly superseded.

**⚠️ CLAUDE.md needs an edit — the user must make it, not us.** Line 47 currently reads:

> `Order status: `PENDING_PAYMENT → PAID → ACCEPTED → PREPARING → READY → PICKED_UP` (+ `CANCELLED`, `REFUNDED`).`

Drafted replacement (one line):

> `Order status: `PENDING_PAYMENT → PAID → PREPARING → READY → PICKED_UP` (+ `CANCELLED`, `REFUNDED`; `ACCEPTED` is legacy and never written). `READY` self-advances to `PICKED_UP` after 30 minutes.`

### (e) "Auto-outed after 30 mins" with no cron and no worker

**Decision: a lazy sweep, run as one conditional `updateMany` inside the tenant read the dashboard already performs on every poll.** No new infrastructure, no Vercel cron, no background job.

- **Where:** a new `sweepAutoCompleted()` in `lib/tenant.ts`, called at the top of `getServiceOrders()` (and of the new `getOrderDetail()`), before the `findMany`. The dashboard page is `force-dynamic` with `<AutoRefresh seconds={10} />`, so it runs at least every 10 seconds while anyone has the queue open.
- **Which transition:** `READY → PICKED_UP` and **only** that one.
  - Not `PAID → PREPARING`: never auto-accept an order the kitchen hasn't seen.
  - Not `PREPARING → READY`: never tell a customer food is ready when nobody said it was.
- **From which timestamp:** `Order.readyAt`, which `advanceOrderStatus()` already sets when it writes `READY`. Cutoff = `now - 30 min` (`AUTO_COMPLETE_AFTER_MINUTES`).
- **The query** — one conditional update, no read-then-write:

  ```ts
  export async function sweepAutoCompleted(
    truckId: string,
    opts: { serviceId?: string; now: Date }
  ): Promise<number> {
    const cutoff = new Date(opts.now.getTime() - AUTO_COMPLETE_AFTER_MINUTES * 60_000);
    const { count } = await prisma.order.updateMany({
      where: {
        truckId,
        ...(opts.serviceId && { serviceId: opts.serviceId }),
        status: "READY",            // the gate
        readyAt: { lte: cutoff },
      },
      data: { status: "PICKED_UP", pickedUpAt: opts.now, autoCompletedAt: opts.now },
    });
    return count;
  }
  ```

  It is gated on `status: "READY"`, so it is a conditional update by construction and is safe to run concurrently from several browser tabs.
- **If the vendor taps "Picked up" at the same moment:** both statements are `UPDATE … WHERE status='READY'`. Whichever commits first matches the row; the other matches zero. The order ends up `PICKED_UP` either way — the only difference is whether `autoCompletedAt` got set. The vendor's `advanceOrder` would currently surface the loss as the error banner *"This order was already updated."*, which is noise for a no-op. Fix in the action: when `!moved`, read the current status and treat "already at the target" as success.

  ```ts
  // app/(dashboard)/dashboard/actions.ts — advanceOrder
  const to = NEXT_STATUS[from];
  const moved = await advanceOrderStatus(truck.id, orderId, from, to);
  refresh(truck.slug);
  if (moved) return { ok: true };
  // The 30-minute sweep (or the other tab) may have already put it there.
  if ((await getOrderStatus(truck.id, orderId)) === to) return { ok: true };
  return fail("This order was already updated. The queue has been refreshed.");
  ```

  New tenant helper: `getOrderStatus(truckId, orderId): Promise<OrderStatus | null>`.
- **Index:** add `@@index([status, readyAt])` on `Order` so the sweep is a cheap index scan rather than a per-truck table scan. One extra indexed `UPDATE` per 10-second poll is negligible.
- **What the customer's page shows for an auto-completed order:** the status is genuinely `PICKED_UP`, so all four steps render complete and the headline is `Thanks, {name}. Enjoy.` Because that can be wrong (they may never have collected it), add one note under the step list when `autoCompletedAt` is set:

  > "We closed this order automatically 30 minutes after it was ready. If you didn't collect it, ask at the window."

  This needs `autoCompletedAt` on `OrderView` (additive).
- Also surface it to the vendor: in the "done today" list, an auto-closed row reads `Picked up (auto)` instead of `Picked up`.

### (f) Refunds with no Stripe

**Recommendation: record the intent now, move no money. Ship item-level void in v1.**

Why not omit it: the vendor genuinely needs to mark "we ran out of horchata" against a specific line and have it visible on the ticket — that need exists whether or not a card is involved, and today the truck settles at the window. Why not fake it: calling it "Refunded" when nothing moved is a lie the vendor would act on. So the UI says **"Refund owed — settle at the window"** and the number is recorded for Stripe to consume later.

Model:

```prisma
model OrderLineItem {
  // … existing fields unchanged …
  voidedAt     DateTime? // the vendor removed this line after the fact
  voidedReason String?   // "SOLD_OUT" | "CUSTOMER_REQUEST" | "MISTAKE"
  voidedCents  Int       @default(0) // refund owed for this line, excl. tax
}

model Order {
  // … existing fields unchanged …
  refundedCents Int @default(0) // sum of voidedCents; no money has moved yet
}
```

Rules:

- **Line items stay immutable price snapshots.** `nameSnapshot`, `unitPriceCents`, `quantity`, `modifiersSnapshot`, `lineTotalCents` are **never** rewritten. A void adds three new fields alongside them; it never edits the snapshot. Same for the order: `subtotalCents`, `taxCents`, `tipCents`, `totalCents` are **never** recomputed.
- **Totals are derived, not mutated.** The detail view shows the original receipt unchanged, then two extra rows when `refundedCents > 0`:
  ```
  Refund owed      −$7.00
  Net              $7.45     // totalCents − refundedCents
  ```
  Both are computed at render time in integer cents. No float anywhere.
- **Tax on a voided line is deferred.** v1 records `voidedCents = lineTotalCents` (the pre-tax snapshot) and labels it "excl. tax". Apportioning tax and the platform fee across a partial refund is Stripe's problem; it gets a `// TODO(Stream C)`.
- **The pickup slot is not released.** The order still exists and still occupies its seat. Only a whole-order cancel gives the seat back (existing `cancelOrder()` already does that — see below).
- **Voiding the last un-voided line does not auto-cancel.** The detail view instead shows "Every item on this order is removed" and points at the existing Cancel order button. No surprise state changes.
- **Cancel order reuses `cancelOrderAction`.** Do not write a second cancel path. It already: gates on `status IN ACTIVE_STATUSES`, writes `CANCELLED` with a conditional `updateMany`, and decrements `bookedCount` in the same transaction. It already carries the `// TODO(Stream C)` for the Stripe refund.
- **Allowed statuses for a void:** `ACTIVE_STATUSES ∪ {PICKED_UP}`. Not `PENDING_PAYMENT`, not `CANCELLED`, not `REFUNDED`.
- **Double-tap safe:** the void is a conditional update gated on `voidedAt: null`, so two staff cannot double-refund the same line.

### (g) "Contact customer" with no SMS provider

**Decision: plain anchors. No provider, no cost, no JS.**

`Order` has `customerPhone` (required) and `customerEmail` (nullable). The detail view renders:

| Button | href | Always? |
| --- | --- | --- |
| **Call {first name}** | `tel:${phone.replace(/[^\d+]/g, "")}` | yes |
| **Text {first name}** | `sms:${digits}?&body=${encodeURIComponent(msg)}` | yes |
| **Email {first name}** | `mailto:${email}?subject=…` | only when `customerEmail !== null` |

- The `?&body=` form (question mark **then** ampersand) is the one spelling both iOS and Android accept for a prefilled SMS body.
- Prefilled text: `Hi {firstName}, this is {truckName} about order {orderNumber}.`
- These are `<a>` elements in a Server Component — no client JS, no Resend, no Twilio. On a laptop with no handler the OS does nothing, so the phone number and email are **also rendered as selectable text** next to each button.
- Resend is **not** used here. It exists for the vendor's new-order email; emailing a customer from the dashboard is Stream C.

---

## 2. The order-detail view (request 4)

**Decision: a full route, not a grown-up `ticket-sheet.tsx`.**

`app/(dashboard)/dashboard/(app)/orders/[orderId]/page.tsx`

Why a route over a bottom sheet:

- The action block has nested flows (pick an item → choose a reason → confirm). Nested confirmation inside an 85dvh bottom sheet at 375px is cramped and traps focus badly.
- A route gets the phone's back button for free, which is what "go into the order ticket and come back" means to a vendor holding a phone.
- It can be a **Server Component** (the repo's default) that reads via `requireTruckAccess()` + `getOrderDetail()`, with its own `<AutoRefresh seconds={10} />`. The sheet would have to be a client component fed props through the queue.
- A staff member can keep one problem order open in a second tab.

`components/dashboard/ticket-sheet.tsx` is **deleted**; its three jobs (call, receipt, cancel) all move into the route, better done.

In the queue, the `⋯` button on a ticket becomes a `<Link href={`/dashboard/orders/${order.id}`}>`. It is shown on **every** tone including `new` (today it is hidden on new, which means a vendor cannot inspect the one order they most need to inspect).

### Wireframe at 375px

16px side gutters, no horizontal scroll, every tap target ≥48px, zero drop shadows, no `font-display`.

```
╔═══════════════════════════════════════╗ 375px
║ ‹ Service                             ║ 48px, sticky, back Link
╠═══════════════════════════════════════╣
║▌ A07                      ◍ Cooking   ║ left rail = zone colour (4px)
║▌ Jess Moreno                          ║ 1.75rem number, 1rem name
║▌ Pickup 12:45 PM · 2 items            ║ muted, tabular-nums
╠═══════════════════════════════════════╣
║ ITEMS                                 ║ 0.8125rem uppercase muted
║ ───────────────────────────────────── ║
║ 1×  Birria Taco                $4.50  ║
║     Extra cheese, No onion            ║ muted, indented 24px
║ ───────────────────────────────────── ║
║ 2×  H̶o̶r̶c̶h̶a̶t̶a̶                   $7.00  ║ voided: struck + 60% opacity
║     Large                             ║
║     ▲ Removed (sold out)              ║ --cooking-ink on --cooking-tint
║       refund owed $7.00               ║
╠═══════════════════════════════════════╣
║ Subtotal                      $11.50  ║
║ Tax                            $0.95  ║
║ Tip                            $2.00  ║
║ Total                         $14.45  ║ semibold
║ ───────────────────────────────────── ║
║ Refund owed                   −$7.00  ║ only when refundedCents > 0
║ Net                            $7.45  ║ semibold
╠═══════════════════════════════════════╣
║ Placed                      12:08 PM  ║
║ Accepted                    12:11 PM  ║
║ Ready                              —  ║
║ Picked up                          —  ║
╠═══════════════════════════════════════╣
║ ┌───────────────────────────────────┐ ║
║ │           Mark ready              │ ║ 56px, zone-coloured, full width
║ └───────────────────────────────────┘ ║
║ ┌────────────────┐ ┌────────────────┐ ║
║ │  Call Jess     │ │   Text Jess    │ ║ 48px each, outline, gap 8px
║ └────────────────┘ └────────────────┘ ║ (167px each at 375px)
║ (555) 018-2240                        ║ selectable, muted
║ Email Jess · jess@example.com         ║ only if customerEmail
╠═══════════════════════════════════════╣
║ Issue with this order              ›  ║ <details>, closed by default
╟───────────────────────────────────────╢ (open:)
║  Remove an item                       ║
║  ○ 1× Birria Taco              $4.50  ║ radio, 48px rows
║  ○ 2× Horchata        already removed ║ disabled when voidedAt
║                                       ║
║  Why?                                 ║
║  ( Sold out ) ( Customer ) ( Mistake )║ 48px segmented, one required
║                                       ║
║  ☑ Record a $4.50 refund owed         ║ checkbox, on by default
║  ┌───────────────────────────────────┐║
║  │        Remove item                │║ 48px, --destructive outline
║  └───────────────────────────────────┘║
║  Nothing is charged or refunded yet.  ║ 0.8125rem muted
║  Settle at the window.                ║
╟───────────────────────────────────────╢
║  ┌───────────────────────────────────┐║
║  │        Cancel order               │║ 48px, --destructive
║  └───────────────────────────────────┘║ tap-twice confirm (as today)
║  Cancels every item and frees the     ║
║  12:45 PM pickup slot.                ║
╚═══════════════════════════════════════╝
```

Desktop (≥768px): the same column, `max-w-[40rem] mx-auto`, with Items/Totals in the left column and Timestamps/Actions in the right at `lg:`. Not required for v1.

Behaviour notes:

- The primary advance button is the same `advanceOrder` Server Action the queue calls, labelled from `ADVANCE_LABEL`. On success the route `revalidatePath`s and the vendor stays on the detail page. Hidden when `!isAdvanceable(status)`.
- The "Issue with this order" `<details>` is closed by default so the destructive controls are never one stray tap away.
- "Cancel order" keeps the existing tap-twice pattern from `ticket-sheet.tsx` (`confirming` state, cleared `onBlur`).
- Status pill colour comes from the same tokens as the zone the order is in.
- Timestamps render in `truck.timezone` via `formatTime()`; stored UTC.

---

## 3. Schema changes

All **additive**: five new columns, every one nullable or defaulted, plus one index. No enum change, no column drop, no backfill, no data migration. `OrderStatus.ACCEPTED` stays in the enum.

```prisma
model Order {
  // … existing fields unchanged …
  acceptedAt      DateTime? // set when the vendor taps Accept (PAID → PREPARING)
  autoCompletedAt DateTime? // set by the 30-minute READY sweep, not by a human tap
  refundedCents   Int       @default(0) // sum of voided line items; no money has moved yet

  @@unique([serviceId, orderNumber])
  @@index([truckId, status])
  @@index([status, placedAt]) // the unpaid-order sweep
  @@index([status, readyAt])  // NEW: the 30-minute auto-complete sweep
}

model OrderLineItem {
  // … existing fields unchanged; snapshots are never rewritten …
  voidedAt     DateTime? // the vendor removed this line after the fact
  voidedReason String?   // "SOLD_OUT" | "CUSTOMER_REQUEST" | "MISTAKE"
  voidedCents  Int       @default(0) // refund owed for this line, excl. tax
}
```

`advanceOrderStatus()` gains `acceptedAt`:

```ts
data: {
  status: to,
  ...(to === "PREPARING" && from === "PAID" && { acceptedAt: now }),
  ...(to === "READY" && { readyAt: now }),
  ...(to === "PICKED_UP" && { pickedUpAt: now }),
}
```

Migration: `npx prisma migrate dev --name order_detail_and_auto_complete`. **Stream A owns it and commits it** (CLAUDE.md: "whoever changes the schema commits the migration"). Both streams' columns land in that one migration so Stream B never touches `schema.prisma`.

### `lib/types.ts` (additive)

```ts
export type OrderLine = {
  id: string;
  name: string;
  quantity: number;
  modifiers: string[];       // names only; the snapshot's price deltas stay server-side in v1
  unitPriceCents: number;    // NEW
  lineTotalCents: number;
  voidedAt: string | null;   // NEW
  voidedReason: string | null; // NEW
  voidedCents: number;       // NEW
};

export type OrderView = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null; // NEW
  pickupAt: string;
  placedAt: string;             // NEW
  acceptedAt: string | null;    // NEW
  readyAt: string | null;       // NEW
  pickedUpAt: string | null;    // NEW
  autoCompletedAt: string | null; // NEW
  lines: OrderLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  refundedCents: number;        // NEW
};
```

Every addition is a new optional-in-practice field, so the storefront components that already consume `OrderView` keep compiling untouched. `toOrderView()` in `lib/tenant.ts` populates them; `orderInclude` needs no change (the new columns come along with `lineItems`).

---

## 4. Server Actions and tenant functions

### `lib/tenant.ts` additions (Stream A writes all of these; Stream B calls them)

```ts
/** One order for the vendor's detail route. Sweeps stale READY orders first. */
export async function getOrderDetail(truckId: string, orderId: string): Promise<OrderView | null>;

/** The current status, for making an advance idempotent against the sweep. */
export async function getOrderStatus(truckId: string, orderId: string): Promise<OrderStatus | null>;

/** READY → PICKED_UP for anything ready longer than AUTO_COMPLETE_AFTER_MINUTES. */
export async function sweepAutoCompleted(
  truckId: string,
  opts: { serviceId?: string; now: Date }
): Promise<number>;

/**
 * Mark one line item removed, optionally recording a refund owed. One
 * transaction: a conditional update gated on voidedAt: null, then bump
 * Order.refundedCents. Never rewrites a price snapshot.
 */
export async function voidOrderLineItem(
  truckId: string,
  orderId: string,
  lineItemId: string,
  opts: { reason: "SOLD_OUT" | "CUSTOMER_REQUEST" | "MISTAKE"; refund: boolean; now: Date }
): Promise<"voided" | "already" | "missing">;
```

`voidOrderLineItem` body shape:

```ts
return prisma.$transaction(async (tx) => {
  const line = await tx.orderLineItem.findFirst({
    where: {
      id: lineItemId,
      orderId,
      order: { truckId, status: { in: [...ACTIVE_STATUSES, "PICKED_UP"] } },
    },
    select: { lineTotalCents: true, voidedAt: true },
  });
  if (!line) return "missing";
  if (line.voidedAt) return "already";

  const cents = opts.refund ? line.lineTotalCents : 0; // integer cents, excl. tax
  const { count } = await tx.orderLineItem.updateMany({
    where: { id: lineItemId, orderId, voidedAt: null }, // the gate
    data: { voidedAt: opts.now, voidedReason: opts.reason, voidedCents: cents },
  });
  if (count !== 1) return "already";

  if (cents > 0) {
    await tx.order.updateMany({
      where: { id: orderId, truckId },
      data: { refundedCents: { increment: cents } },
    });
  }
  // TODO(Stream C): issue the partial Stripe refund for `cents` here, and
  // apportion tax + platform fee. Until then refundedCents is a record of
  // what the truck owes, settled at the window.
  return "voided";
});
```

Also modified in `lib/tenant.ts`:

- `getServiceOrders()` — call `sweepAutoCompleted(truckId, { serviceId, now: new Date() })` before the `findMany`.
- `advanceOrderStatus()` — set `acceptedAt` as above.
- `toOrderView()` — map the new columns.

### Changed Server Action — `app/(dashboard)/dashboard/actions.ts` (Stream A)

```ts
const advanceSchema = z.object({
  orderId: z.string().min(1).max(50),
  from: z.enum(["PAID", "ACCEPTED", "PREPARING", "READY"]),
}); // unchanged shape
```

Changed body only: treat "already at the target status" as success (see (e)).
`cancelOrderAction(orderId: string)` is **unchanged** — Stream B reuses it as-is.

### New Server Action — `app/(dashboard)/dashboard/(app)/orders/actions.ts` (Stream B, new file)

Mirrors the existing precedent of `app/(dashboard)/dashboard/(app)/settings/actions.ts`: a second actions file in its own route folder.

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTruckAccess, voidOrderLineItem } from "@/lib/tenant";
import type { ActionResult } from "@/app/(dashboard)/dashboard/actions"; // type-only import

const id = z.string().min(1).max(50);

const voidLineSchema = z.object({
  orderId: id,
  lineItemId: id,
  reason: z.enum(["SOLD_OUT", "CUSTOMER_REQUEST", "MISTAKE"]),
  refund: z.boolean(),
});

export async function voidLineItem(input: z.input<typeof voidLineSchema>): Promise<ActionResult> {
  const { truck } = await requireTruckAccess();           // truckId never from the browser
  const parsed = voidLineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That item can't be removed." };

  const { orderId, lineItemId, reason, refund } = parsed.data;
  const result = await voidOrderLineItem(truck.id, orderId, lineItemId, {
    reason,
    refund,
    now: new Date(),
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${truck.slug}`, "layout");

  if (result === "voided") return { ok: true };
  if (result === "already") return { ok: false, error: "That item was already removed." };
  return { ok: false, error: "That item can't be removed anymore." };
}
```

No other new actions. Contact is anchors; advance and cancel are imported from Stream A's file.

---

## 5. WORK SPLIT — two streams, strictly disjoint file ownership

No file appears in both lists. **Stream A lands first.**

### Stream A — the queue's look and state machine (requests 1, 2, 3)

**Owns exclusively:**

```
app/globals.css
prisma/schema.prisma
prisma/migrations/**                       (the one additive migration, both streams' columns)
lib/types.ts
lib/tenant.ts
lib/orders/status.ts
app/(dashboard)/dashboard/actions.ts
app/(dashboard)/dashboard/(app)/page.tsx
app/(dashboard)/dashboard/(app)/layout.tsx          (bg-signal badge, unchanged value)
components/dashboard/order-queue.tsx
components/dashboard/order-ticket.tsx
components/dashboard/service-bar.tsx
components/dashboard/service-screen.tsx
components/dashboard/use-new-orders.ts
components/storefront/order-status.tsx
app/(platform)/page.tsx                             token rename only
components/dashboard/menu-manager.tsx               token rename only (bg-ready → bg-ok)
components/dashboard/stock-board.tsx                token rename only
components/dashboard/settings/payments-status.tsx    token rename only
components/dashboard/settings/profile-form.tsx       token rename only
components/dashboard/settings/save-row.tsx           token rename only
components/dashboard/settings/locations-manager.tsx  token rename only
```

**Must NOT touch:** anything under `app/(dashboard)/dashboard/(app)/orders/`, `components/dashboard/order-detail*.tsx`, `components/dashboard/ticket-sheet.tsx` (it only **removes the import and the `onOpenDetails` prop plumbing** from `order-queue.tsx` / `order-ticket.tsx`, replacing the `⋯` button with a `<Link href={`/dashboard/orders/${order.id}`}>`; it leaves the file itself on disk for Stream B to delete).

**Deliverables:**

1. Palette: new tokens + `--ok` rename + the revised palette comment + `new-pulse` keyframe. The six token-rename files are a mechanical `bg-ready`/`text-ready` → `bg-ok`/`text-ok` pass with no visual change.
2. `status.ts`: `NEXT_STATUS`, `ADVANCE_LABEL`, `STATUS_LABEL`, `AUTO_COMPLETE_AFTER_MINUTES`.
3. Schema + migration: all five columns and the index, for **both** streams.
4. `lib/types.ts`: `OrderLine`, extended `OrderView`.
5. `lib/tenant.ts`: `getOrderDetail`, `getOrderStatus`, `sweepAutoCompleted`, `voidOrderLineItem`, plus `acceptedAt` in `advanceOrderStatus`, the sweep call in `getServiceOrders`, and the extended `toOrderView`. **These are written to the exact signatures in §4 so Stream B can code against them before they land.**
6. `actions.ts`: idempotent `advanceOrder`.
7. Queue UI: zone tints, the pulse on the New `<ul>`, the three recoloured buttons (Cooking stops using `bg-brand`), the `⋯` → `<Link>`, `Picked up (auto)` in the done list.
8. `order-status.tsx`: four customer steps + the auto-closed note.

### Stream B — the order-detail view and its actions (request 4)

**Owns exclusively:**

```
app/(dashboard)/dashboard/(app)/orders/[orderId]/page.tsx      NEW  (Server Component)
app/(dashboard)/dashboard/(app)/orders/[orderId]/not-found.tsx NEW
app/(dashboard)/dashboard/(app)/orders/actions.ts              NEW  (voidLineItem)
components/dashboard/order-detail.tsx                          NEW  (header, items, totals, timestamps)
components/dashboard/order-detail-actions.tsx                  NEW  (client: advance, contact links, issue block)
components/dashboard/ticket-sheet.tsx                          DELETE
```

**Must NOT touch:** `app/globals.css`, `prisma/**`, `lib/**` (read and import only), `app/(dashboard)/dashboard/actions.ts`, or any `components/dashboard/*` file not listed above — in particular not `order-queue.tsx`, `order-ticket.tsx`, `service-screen.tsx`.

**Deliverables:**

1. The route: `requireTruckAccess()` → `getOrderDetail(truck.id, orderId)` → `notFound()` if null → render + `<AutoRefresh seconds={10} />`.
2. The view per the §2 wireframe, using only Stream A's tokens (`bg-new`, `bg-cooking-tint`, `text-cooking-ink`, `bg-ready-tint-strong`, `text-ready-ink`, `--destructive`). No new colours, no `font-display`, no shadows, works at 375px.
3. `voidLineItem` action with the §4 Zod shape.
4. Contact: `tel:` / `sms:?&body=` / optional `mailto:`.
5. Cancel order: **imports and calls `cancelOrderAction` from Stream A's file.** Does not reimplement it.
6. Deletes `ticket-sheet.tsx` once Stream A has removed the import.

### Ordering dependency

**Stream A must merge first.** Stream B depends on, and cannot run until it has:

- the migration (`voidedAt`, `voidedCents`, `voidedReason`, `acceptedAt`, `autoCompletedAt`, `refundedCents`);
- `getOrderDetail`, `voidOrderLineItem` in `lib/tenant.ts`;
- the extended `OrderView` / `OrderLine` in `lib/types.ts`;
- the new colour tokens in `app/globals.css`.

Stream B can be **written** immediately against the signatures in §3 and §4 — they are fixed by this spec — but it should rebase onto A before it runs or merges. Stream A depends on nothing from Stream B; the one handshake is the `<Link href="/dashboard/orders/[orderId]">` that A adds before B's route exists (a dead link for the length of one PR, which is fine on a feature branch).

### Why shared files landed where they did

| File | Owner | How the other stream copes |
| --- | --- | --- |
| `prisma/schema.prisma` + migration | A | A lands **both** streams' columns in one migration, per CLAUDE.md's "whoever changes the schema commits the migration". B never opens the file. |
| `lib/tenant.ts` | A | CLAUDE.md forbids tenant queries anywhere else, so B cannot have its own data module. A writes the four functions B needs to this spec's exact signatures; B imports them. |
| `app/(dashboard)/dashboard/actions.ts` | A | B's one new action goes in its own `(app)/orders/actions.ts`, following the existing `(app)/settings/actions.ts` precedent. B imports `cancelOrderAction` and the `ActionResult` type from A's file without editing it. |
| `app/globals.css` | A | B uses only tokens A defines. If B finds it needs another token, it asks A rather than adding one. |
| `lib/orders/status.ts` | A | B imports `ADVANCE_LABEL`, `STATUS_LABEL`, `isAdvanceable`, `ACTIVE_STATUSES`. Read-only. |
| `components/dashboard/ticket-sheet.tsx` | B (deletes) | A removes the import in the same PR that adds the `<Link>`, leaving the file orphaned; B deletes it. Neither stream edits its contents. |

---

## 6. Decisions the user must make

1. **CLAUDE.md line 47.** It documents the old six-status chain. The draft replacement is in (d). We will not edit CLAUDE.md without being told to.
2. **`--ready` turns blue, and six unrelated places turn from green to a renamed `--ok` green.** The *values* don't change for those six (saved-confirmations, the stock pill, the menu toggle, the payments "Connected" badge), only the token name. Confirm you're happy that "order ready" is blue and "saved/available/connected" stays green.
3. **Refunds record intent, not money** — item-level void with a "refund owed, settle at the window" number, and a `// TODO(Stream C)` where the Stripe call goes. Alternative is to drop item-level refunds from v1 entirely. Recommendation: ship it.
4. **Refunds ignore tax in v1.** A voided `$7.00` line records `$7.00`, not `$7.00 + its share of tax`. Apportioning tax and the platform fee waits for Stripe.
5. **Only `READY → PICKED_UP` auto-advances.** New orders are never auto-accepted and food is never auto-marked ready. Confirm 30 minutes is the number (it's one constant, `AUTO_COMPLETE_AFTER_MINUTES`).
6. **Auto-close only fires while someone has the dashboard open.** With no cron, an order that goes READY at 20:00 and nobody reopens the dashboard until 09:00 closes at 09:00, stamped with that time. Acceptable for a class project; a real cron is Stream C.
7. **Order detail is a route, not a sheet**, and `ticket-sheet.tsx` is deleted. The `⋯` button becomes a navigation, available on New tickets too.
8. **`ACCEPTED` stays in the enum as legacy.** Nothing writes it; legacy rows advance straight to READY and display as "Cooking". Alternative is a destructive enum migration — not recommended.
9. **Contact customer is `tel:` / `sms:` / `mailto:` links only.** No Twilio, no customer-facing Resend email. Confirm that's the intended scope.
```
