# FoodtruckApp

**White-label pre-ordering platform for food trucks.** Each truck gets its own branded ordering site. Customers reserve a pickup window and pay ahead; vendors manage their menu, stock, locations, and schedule from a dashboard.

> **Status:** in development. The customer storefront, vendor dashboard, login, and order emails work against a real database. Payments (Stripe) aren't wired up yet, so orders are marked paid without charging.

---

## The problem

Restaurant software assumes a fixed street address and fixed weekly hours. Food trucks are the opposite: a brewery on Thursday evening, an office park Friday lunch, a festival all Saturday. Square, Toast, and Clover all make the operator rewrite their location and hours by hand every single day, so most trucks fall back to a long line and an Instagram post.

That line is the real cost. A truck does 80–200 orders in a ~90-minute lunch rush, and the queue is the bottleneck — roughly 20% of walk-ups leave when the wait hits ten minutes. Pre-ordering recovers that revenue directly.

**Our approach:** the central entity is the **Service** — *one truck, at one location, from one time to another*. Menu availability, pickup slots, capacity, and orders all hang off it. That single modeling decision is what makes the software actually fit how the business works.

---

## Features

**Vendor side**
- Menu builder with sections, photos, and modifier groups ("pick a salsa", "add cheese +$1")
- One-tap in/out-of-stock toggle, designed to be used mid-service on a phone
- Locations and schedule management, with "duplicate last week" for recurring gigs
- Live order queue with tap-to-advance status
- Branding controls — logo, colors, hero image

**Customer side**
- Branded storefront per truck, with "where we are next" above the fold
- Menu browsing with sold-out items clearly marked
- Pickup time-slot selection with per-slot capacity limits
- Card checkout with tipping — no account required
- Order status page

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Database | Postgres (Supabase), Prisma |
| Auth | Clerk (vendors only — customers check out as guests) |
| Payments | Stripe Connect Express + Stripe Checkout |
| Storage / Email | Vercel Blob, Resend |
| Hosting | Vercel |

Four external accounts total — Vercel, Supabase, Clerk, Stripe — all on free tiers.

<details>
<summary><strong>What we deliberately rejected, and why</strong></summary>

- **A headless CMS for the menu** (Sanity/Contentful). Menu items are *transactional* data — price, stock, modifiers — and must be the source of truth at checkout. A CMS can't atomically mark an item sold out or enforce tenant boundaries, so you'd maintain two sources of truth and a whole family of bugs. The menu editor is ours, against our own tables.
- **Clerk Organizations.** Would split the tenant boundary across Clerk *and* our Postgres — two places to debug a permissions bug. A plain `Membership` table keeps it in one.
- **Supabase RLS.** All DB access goes through our own server, so tenant isolation lives in one code helper. RLS policies are easy to get subtly wrong and painful to debug.
- **A separate backend service.** Next.js route handlers + Server Actions are plenty at this scale; a second service is just deployment overhead.
- **Websockets for the order queue.** Polling is simpler, survives flaky truck wifi, and is indistinguishable to the user here.
- **Walk-up POS / card readers.** Square gives that away free — not a fight worth picking.

</details>

---

## Getting started

Requires **Node.js 20+**, a Supabase project, and Clerk + Stripe accounts (all free tiers).

```bash
git clone https://github.com/Unuvert1/FoodtruckApp.git
cd FoodtruckApp
npm install
cp .env.example .env.local     # PowerShell: Copy-Item .env.example .env.local
```

Fill in `.env.local` (at minimum `DATABASE_URL` and `DIRECT_URL`; Clerk runs in keyless mode without keys in development), then:

```bash
npx prisma migrate dev
npx prisma db seed
npm run dev
```

To manage the demo truck: sign up at http://localhost:3000/sign-up, then choose **Manage the demo truck** on the setup screen. Re-run `npx prisma db seed` whenever you want fresh demo dates and orders.

In a second terminal, so Stripe can reach your local webhook:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

- Platform home page → http://localhost:3000
- Seeded storefront → http://localhost:3000/demo-truck
- Vendor dashboard → http://localhost:3000/dashboard

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

### Environment variables

```
DATABASE_URL=                          # Supabase → Connect → Transaction pooler (port 6543)
DIRECT_URL=                            # Supabase → Connect → Session pooler (port 5432), for migrations
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
RESEND_API_KEY=                        # optional; without it, emails print to the terminal
EMAIL_FROM=                            # optional; defaults to Resend's test sender
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOW_DEMO_TRUCK_JOIN=                 # "true" to offer the demo truck outside development
STRIPE_SECRET_KEY=                     # test mode: sk_test_... (Stream C)
STRIPE_WEBHOOK_SECRET=                 # printed by `stripe listen` (Stream C)
BLOB_READ_WRITE_TOKEN=
```

`.env.example` has the same list with notes on where to find each value.

`.env.local` is gitignored and must never be committed. Each developer uses their own Stripe test keys so webhook events don't cross.

---

## Commands

```bash
npm run dev              # dev server
npm run build            # run before pushing anything substantial
npm run lint
npm test                 # Vitest
npx prisma migrate dev   # create + apply a migration after editing schema.prisma
npx prisma studio        # browse the database in a GUI
npx prisma db seed       # reset demo data
```

---

## Project structure

```
app/
  (storefront)/[truckSlug]/   customer-facing, branded per truck
  (dashboard)/dashboard/      vendor-facing
  api/webhooks/stripe/
lib/
  tenant.ts                   tenant resolution + access guard
  pricing.ts                  server-side total calculation
  orders/createOrder.ts       the single order-creation path
components/ui/                shadcn components
prisma/
  schema.prisma
  seed.ts
middleware.ts                 subdomain → truck slug rewrite
```

Those three `lib/` files hold everything that's easy to get wrong. Read them before touching money or tenancy.

---

## Roadmap

Parallel streams, not sequential phases — pick things up whenever there's time. **Stream 0 blocks everything**; after that A and B run simultaneously (different directories, so almost no merge conflicts).

<details>
<summary><strong>Stream 0 — Foundation</strong> · blocks everything, do it together in one sitting</summary>

- [x] Next.js + TS + Tailwind + shadcn scaffold
- [x] `prisma/schema.prisma` + first migration against Supabase
- [x] Clerk wired far enough to log in and read a `clerkUserId`
- [x] `lib/tenant.ts` guard helpers
- [x] `prisma/seed.ts` — demo truck, menu, a week of services
- [x] `.env.example`

Agree on the schema **together**. It's the contract between both streams and the one thing that's genuinely painful to change later.
</details>

<details>
<summary><strong>Stream A — Vendor side</strong> · parallel with B</summary>

- [x] Signup creates a `Truck` + `OWNER` `Membership`; dashboard shell and nav
- [ ] Menu editor: sections, items, reordering, image upload (sections + items done; reordering and images to do)
- [ ] Modifier groups and options
- [x] **Big one-tap in/out-of-stock toggle**, optimistic UI — a vendor hits this mid-service with greasy hands on a phone
- [x] Archive (soft-delete) items
- [x] New-order email to the vendor (Resend)
- [ ] Location CRUD
- [ ] Service creation: location, date, start/end, slot length, orders-per-slot
- [ ] Week calendar + **"duplicate last week"** — trucks run repeating schedules, and re-entering them by hand is the tedium that loses us the customer
- [ ] Publishing a Service generates its `PickupSlot` rows
- [ ] Branding settings → CSS custom properties
</details>

<details>
<summary><strong>Stream B — Customer storefront</strong> · parallel with A</summary>

- [x] Branded landing page with **"where we are next"** above the fold
- [x] Upcoming services list, current one highlighted
- [x] Menu browse — sold-out items visibly disabled, not hidden
- [x] Cart with modifiers (client state, always re-validated server-side)
- [x] Pickup slot picker showing only slots with remaining capacity
- [x] Mobile-first throughout

Build against seeded data so you're never blocked on Stream A.
</details>

<details>
<summary><strong>Stream C — Payments</strong> · needs A's services + B's cart</summary>

- [ ] Stripe Connect Express onboarding via Account Links; block publishing until `stripeOnboarded`
- [x] `lib/pricing.ts` — recompute every total server-side
- [x] Create `Order` as `PENDING_PAYMENT` **and** reserve the slot in one transaction
- [ ] Checkout Session — destination charge to the truck, `application_fee_amount` for our cut
- [ ] Webhook `checkout.session.completed` → `PAID`, deduped on `stripeEventId`
- [ ] Sweep releasing slots held by `PENDING_PAYMENT` orders older than ~15 min
- [x] Tip selection at checkout — trucks depend on tips
- [x] Flat `taxRateBps` per truck (real multi-jurisdiction tax is out of scope; Stripe Tax later)
</details>

<details>
<summary><strong>Stream D — Order flow</strong> · needs C &nbsp;|&nbsp; <strong>Stream E — Polish</strong> · anytime</summary>

**D:** ~~vendor order queue grouped by slot with tap-to-advance~~ (done) · ~~polling auto-refresh~~ (done) · ~~customer status page~~ (done, at `/[truckSlug]/order/[orderId]`) · emailed receipt to the customer via Resend

**E:** empty/loading/error states · custom domain support · vendor analytics (orders + revenue per service) · accessibility and Lighthouse pass · ERD diagram for the writeup
</details>

**Suggested split:** one person takes Stream A, the other Stream B, then pair on C since payments is where bugs are expensive.

### Later — the chatbot spin-off

Not built now, but three decisions keep it cheap: all order creation goes through `lib/orders/createOrder.ts` so a bot calls the *same* function; `Order.source` already has `SMS|API`; and truck menu + upcoming services get exposed as read-only JSON, which is exactly the context an LLM needs as tool input.

---

## Known risks

The things that will actually bite. Mitigations are enforced as rules in [`CLAUDE.md`](./CLAUDE.md).

| Risk | Mitigation |
|---|---|
| **Timezones** | Store UTC, store `Truck.timezone`, render truck-local. Highest-probability bug in the project. |
| **Slot overbooking** | Conditional update (`WHERE bookedCount < capacity`) in a transaction. Never read-then-write. |
| **Duplicate webhooks** | Stripe retries. Insert unique `stripeEventId` *before* processing. |
| **Client-forged prices** | Recompute all totals server-side. The classic way e-commerce projects get exploited. |
| **Cross-tenant leakage** | Single chokepoint in `lib/tenant.ts`. |
| **Money rounding** | Integer cents everywhere. `0.1 + 0.2 !== 0.3`. |
| **Abandoned checkouts** | Unpaid orders hold slots — the 15-min sweep releases them. |

---

## Documentation

**[`CLAUDE.md`](./CLAUDE.md)** — data model, architecture, and hard rules. Loaded automatically by [Claude Code](https://claude.com/claude-code) every session, so both developers get identical context without re-explaining.

<details>
<summary><strong>Glossary</strong> — terms used above that aren't obvious</summary>

- **Service** — one instance of a truck being open: location + start/end time. The central entity of the whole app.
- **86 / to 86 an item** — restaurant slang for "we're out of it." What the in/out-of-stock toggle does.
- **Modifier** — a per-item choice, e.g. "pick a salsa" or "add cheese +$1".
- **Stripe Connect** — Stripe's system for platforms that pay out to third parties. Money reaches the truck's bank account while we take a cut.
- **Express account** — the Connect flavor where Stripe hosts vendor onboarding and identity verification so we don't build it.
- **Destination charge** — a payment that settles into the truck's connected account, with `application_fee_amount` split to us.
- **bps (basis points)** — 1/100th of a percent. 250 bps = 2.5%. Keeps rates as integers.
- **Tenant** — one truck's isolated slice of data. "Multi-tenant" means all trucks share one database, separated by `truckId`.
- **Slot** — a bookable pickup time bucket within a Service, capped so the kitchen doesn't get swamped.

</details>

---

## Contributing

**The loop, every time:**

1. `git checkout main && git pull`
2. `git checkout -b feature/your-thing` — one branch per feature, kept small
3. Commit, push, then **open the pull request yourself**. Whoever wrote the code opens the PR: with squash merging, GitHub credits the squashed commit to whoever opened it, so opening each other's PRs erases the real author.
4. The other person reviews and approves
5. **Squash and merge**, then delete the branch

**Rules:**

- Nothing reaches `main` without a reviewed PR, and never force-push `main` or a branch someone else is working on.
- Use **Rebase and merge** in the one case where you open a PR containing someone else's commits — it keeps the original author.
- When you genuinely pair on a commit, credit both:
  ```
  Co-authored-by: Name <email@rangers.uwp.edu>
  ```
- Set your Git identity once per machine so your commits link to your GitHub account:
  ```
  git config user.name "Your Name"
  git config user.email "your-github-email"
  ```
- Whoever edits `schema.prisma` commits the generated migration; the other runs `npx prisma migrate dev` after pulling. Agree who owns the schema for a feature — parallel migrations are the one thing that really hurts.
- Never hand-edit a migration that's already been pushed — write a new one.
- We share one Supabase database in development. `npx prisma db seed` wipes and rebuilds the demo truck's data, so say so in chat before running it.

---

## Team

Built by two developers as a class project.
