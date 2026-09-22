# FoodtruckApp

White-label pre-ordering for food trucks. Each truck gets a branded storefront; customers reserve a pickup window and pay ahead; vendors manage menu, stock, locations, and schedule from a dashboard. Two devs, class project — favor conventional, readable code over clever code.

**The central entity is the `Service`**: one truck, at one location, from one time to another. Menu availability, pickup slots, capacity, and orders all hang off it. If a feature feels awkward to model, it probably belongs on a Service and isn't there yet.

Setup, env vars, and roadmap live in `README.md`.

## Status

Working, on the real database: customer storefront → checkout → order status page; vendor dashboard (service screen with order queue + stock toggles, menu management, settings); new-order email to the vendor.

Not built yet — don't assume these exist:
- **Payments.** No Stripe: the checkout action calls `markOrderPaid` right after `createOrder`. Stripe Checkout, Connect onboarding, the webhook route, and the unpaid-order sweep are Stream C.
- **Scheduling stops.** Services and pickup slots come only from `prisma/seed.ts`; a new truck has none.
- Editing modifier groups, image uploads, customer receipt emails, subdomain / custom-domain routing.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Postgres (Supabase) · Prisma 7 · Clerk (vendor auth only) · Resend · Vercel. Planned: Stripe Connect Express + Checkout, Vercel Blob.

Customers have no accounts — guest checkout with name + phone.

Library notes (things that differ from older docs):
- **Prisma 7**: the client is generated into `lib/generated/prisma` (gitignored; `npm install` runs `prisma generate`) and connects through the `pg` driver adapter in `lib/db.ts`. The CLI reads `prisma.config.ts`, which loads `.env.local` and migrates over `DIRECT_URL` (Supabase *Session pooler*, port 5432 — the "Direct connection" host is IPv6-only).
- **Clerk v7 (Core 3)**: `<SignedIn>`/`<SignedOut>` are gone; use `<Show when="signed-in">`. `createRouteMatcher` is deprecated; access is checked in pages/actions, and `middleware.ts` just runs `clerkMiddleware()`. `ClerkProvider` wraps only `(platform)` and `(dashboard)`, so storefronts don't load Clerk.
- **shadcn** here is the Base UI flavor: components take a `render` prop, not `asChild`.

## Data model

Every tenant-scoped table carries `truckId`. Authoritative schema: `prisma/schema.prisma`.

```
Truck          slug, name, tagline, timezone, brandColor, brandColorForeground,
               logoUrl?, heroImageUrl?, taxRateBps, platformFeeBps,
               notificationEmail? (new-order emails), stripeAccountId?,
               stripeOnboarded, customDomain?
Membership     truckId, clerkUserId, role(OWNER|STAFF)
               — the tenancy boundary; Clerk only supplies user identity
Location       truckId, name, addressLine, city, lat, lng, notes
Service    ★   truckId, locationId, menuId, startsAt, endsAt,
               orderingOpensAt, orderingClosesAt, slotMinutes, ordersPerSlot,
               status(DRAFT|PUBLISHED|LIVE|ENDED|CANCELLED),
               orderCount — atomically incremented to hand out order numbers
PickupSlot     serviceId, startsAt, capacity, bookedCount
               — real rows, generated when a Service is published
Menu           truckId, name, isDefault → MenuSection(sortOrder) → MenuItem
MenuItem       truckId, sectionId, name, description, priceCents, imageUrl,
               isAvailable, archivedAt, sortOrder
ModifierGroup  menuItemId, name, minSelect, maxSelect, required
               → ModifierOption(name, priceDeltaCents, isAvailable)
Order          truckId, serviceId, pickupSlotId, orderNumber("A07"), customerName,
               customerPhone, customerEmail?, subtotal/tax/tip/platformFee/total Cents,
               status, stripeCheckoutSessionId, stripePaymentIntentId,
               placedAt, readyAt, pickedUpAt, source(WEB|SMS|API)
OrderLineItem  orderId, menuItemId?, nameSnapshot, unitPriceCents, quantity,
               modifiersSnapshot(Json), lineTotalCents
WebhookEvent   stripeEventId (unique), processedAt — webhook idempotency guard
```

Order status: `PENDING_PAYMENT → PAID → ACCEPTED → PREPARING → READY → PICKED_UP`, plus `CANCELLED` / `REFUNDED`. The kitchen's transitions and button labels live in `lib/orders/status.ts`.

## Hard rules

Each exists because violating it causes an expensive or dangerous bug. Don't work around them — if one looks wrong, raise it.

- **Money is integer cents.** Fields end in `Cents`. No floats for money, ever. Parse typed prices with `parseDollarsToCents`.
- **Rates are basis points.** `taxRateBps`, `platformFeeBps`. 250 bps = 2.5%.
- **Tenant queries only through `lib/tenant.ts`.** Never call `prisma.*` on a tenant table anywhere else. Truck A reading truck B's data is the worst bug this codebase can have.
- **Dashboard code takes `truckId` only from `requireTruckAccess()`**, never from a form field or URL. Every write in `lib/tenant.ts` filters by it (`updateMany({ where: { id, truckId } })`).
- **Never trust client-supplied prices, totals, or quantities.** The browser sends item IDs and quantities; `lib/pricing.ts` recomputes everything from database rows.
- **Timestamps stored UTC**, displayed in `Truck.timezone` via `lib/time.ts`. Never render a raw server-local date — the truck and the customer are often in different zones.
- **Soft-delete menu items** via `archivedAt` ("Remove" in the UI). Never hard-delete anything an order references.
- **Order line items are price snapshots.** Never join to the live menu to display or re-total a past order; a later price change would silently rewrite history.
- **All order creation goes through `lib/orders/createOrder.ts`.** One path, no exceptions — a future SMS/AI bot reuses it rather than duplicating logic. `Order.source` already covers `WEB|SMS|API`.
- **Reserve slot capacity with a conditional update** (`WHERE bookedCount < capacity`) inside a transaction. Read-then-write lets two customers both win the last slot.
- **Stripe webhooks must be idempotent** (once built). Insert `WebhookEvent.stripeEventId` *before* processing — Stripe retries deliveries. `markOrderPaid` is already safe to call twice.
- **Unpaid orders hold slots.** Once Stripe lands, a sweep must release `PENDING_PAYMENT` orders older than ~15 min, or capacity silently fills with ghosts.

## Conventions

- Server Components by default; `"use client"` only where interactivity actually requires it.
- Server Actions for mutations: storefront checkout in `app/(storefront)/[truckSlug]/checkout/actions.ts`, everything vendor-side in `app/(dashboard)/dashboard/actions.ts`. Actions return `{ ok, error }` instead of throwing for user-fixable problems. Route handlers only for webhooks and public JSON endpoints.
- Zod-validate every input at the Server Action / route handler boundary.
- Mobile-first, designed at 375px — nearly all real traffic is a phone on a sidewalk. The dashboard also targets a tablet (orders + stock side by side from `md`).
- Sold-out items render visible but **disabled**, never hidden. Hiding them makes customers think the menu changed.
- Live screens poll with `<AutoRefresh seconds={n} />` (dashboard 10 s, order status 15 s). No websockets.
- Use shadcn components from `components/ui/` rather than hand-rolling; they're checked in, so edit them directly when needed.
- Colors are tokens in `app/globals.css`. Storefronts use the truck's `--brand`; the platform and dashboard use `--signal` (new orders) and `--ready`.

## Layout

```
app/
  (platform)/                   home page, /sign-in, /sign-up
  (storefront)/[truckSlug]/     storefront, /checkout, /order/[orderId] (by id: numbers are guessable)
  (dashboard)/dashboard/        onboarding + (app)/: service screen, /menu, /settings
lib/
  tenant.ts                  ★ tenant resolution, access guard, and every tenant query
  pricing.ts                 ★ server-side totals (pure; createOrder passes menu rows in)
  orders/createOrder.ts      ★ the single order-creation path
  orders/markOrderPaid.ts      PAID + vendor email; the Stripe webhook will call it
  orders/status.ts             order status transitions and labels
  dev-auth.ts                  getUserId() + the dev login bypass
  db.ts                        the one Prisma client (imported only by tenant.ts and seed)
  email.ts                     Resend; prints to the terminal without RESEND_API_KEY
  money.ts / time.ts / service.ts / cart.ts   small pure helpers
components/ui/                 shadcn components
components/{storefront,dashboard,platform}/
prisma/schema.prisma, prisma/seed.ts, prisma/migrations/
middleware.ts                  clerkMiddleware(); later also subdomain → truck slug rewrite
```

The ★ files hold everything easy to get wrong. Read them before touching money or tenancy.

```ts
getTruckFromRequest(slug)  // storefront: slug → Truck
requireTruckAccess()       // dashboard: user → Membership → Truck; redirects to sign-in / onboarding
```

- **Get the user ID via `getUserId()` from `lib/dev-auth.ts`, never `auth()` directly.** With `DEV_AUTH_BYPASS=true` in `.env.local` it returns a fixed dev user who owns the demo truck, so the dashboard works without logging in. It's forced off when `NODE_ENV === "production"`.
- Truck slugs share the top-level URL space with app routes, so onboarding rejects `RESERVED_SLUGS` (in the dashboard actions). Add to it when adding a top-level route.
- Routing is path-based (`localhost:3000/demo-truck`).

## Commands

```powershell
npm run dev / build / lint / test      # build before pushing anything substantial
npx prisma migrate dev                 # after editing schema.prisma
npx prisma studio                      # browse the DB in a GUI
npx prisma db seed                     # rebuild demo truck data with fresh dates (keeps memberships)
```

`npm test` runs Vitest unit tests for pricing, money parsing, and order numbers (`lib/**/*.test.ts`). Add tests there when touching money.

## Git

- **Never push or merge to `main` without explicit permission from the user.** All work goes on a branch; `main` only changes through a PR both devs have agreed on. This includes force-pushes, which can wipe out the other person's work.
- Short-lived `feature/*` branches off `main`, merged via PR.
- Whoever edits `schema.prisma` commits the generated migration; the other runs `npx prisma migrate dev` after pulling.
- Never hand-edit a migration that's already been pushed — write a new one.
- `.env.local` is gitignored and must never be committed.
