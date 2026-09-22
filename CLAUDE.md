# FoodtruckApp

White-label pre-ordering for food trucks. Each truck gets a branded storefront; customers reserve a pickup window and pay ahead; vendors manage menu, stock, locations, and schedule from a dashboard. Two devs, class project — favor conventional, readable code over clever code.

**The central entity is the `Service`**: one truck, at one location, from one time to another. Menu availability, pickup slots, capacity, and orders all hang off it. If a feature feels awkward to model, it probably belongs on a Service and isn't there yet.

Status: pre-development, no app code yet. Setup, env vars, and roadmap live in `README.md`.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · Postgres (Supabase) · Prisma · Clerk (vendor auth only) · Stripe Connect Express + Checkout · Vercel Blob · Resend · Vercel

Customers have no accounts — guest checkout with name + phone.

## Data model

Every tenant-scoped table carries `truckId`. Authoritative schema: `prisma/schema.prisma`.

```
Truck          slug, name, timezone, branding(logo/color/hero), stripeAccountId,
               stripeOnboarded, taxRateBps, platformFeeBps, customDomain?
Membership     truckId, clerkUserId, role(OWNER|STAFF)
               — the tenancy boundary; Clerk only supplies user identity
Location       truckId, name, addressLine, city, lat, lng, notes
Service    ★   truckId, locationId, menuId, startsAt, endsAt,
               orderingOpensAt, orderingClosesAt, slotMinutes, ordersPerSlot,
               status(DRAFT|PUBLISHED|LIVE|ENDED|CANCELLED)
PickupSlot     serviceId, startsAt, capacity, bookedCount
               — real rows, generated when a Service is published
Menu           truckId, name, isDefault → MenuSection(sortOrder) → MenuItem
MenuItem       truckId, sectionId, name, description, priceCents, imageUrl,
               isAvailable, archivedAt, sortOrder
ModifierGroup  menuItemId, name, minSelect, maxSelect, required
               → ModifierOption(name, priceDeltaCents, isAvailable)
Order          truckId, serviceId, pickupSlotId, orderNumber("A47"), customerName,
               customerPhone, customerEmail?, subtotal/tax/tip/platformFee/total Cents,
               status, stripeCheckoutSessionId, stripePaymentIntentId,
               placedAt, readyAt, pickedUpAt, source(WEB|SMS|API)
OrderLineItem  orderId, menuItemId?, nameSnapshot, unitPriceCents, quantity,
               modifiersSnapshot(Json), lineTotalCents
WebhookEvent   stripeEventId (unique), processedAt — webhook idempotency guard
```

Order status: `PENDING_PAYMENT → PAID → ACCEPTED → PREPARING → READY → PICKED_UP`, plus `CANCELLED` / `REFUNDED`.

## Hard rules

Each exists because violating it causes an expensive or dangerous bug. Don't work around them — if one looks wrong, raise it.

- **Money is integer cents.** Fields end in `Cents`. No floats for money, ever.
- **Rates are basis points.** `taxRateBps`, `platformFeeBps`. 250 bps = 2.5%.
- **Tenant queries only through `lib/tenant.ts`.** Never call `prisma.*` on a tenant table anywhere else. Truck A reading truck B's data is the worst bug this codebase can have.
- **Never trust client-supplied prices, totals, or quantities.** The browser sends item IDs and quantities; recompute everything in `lib/pricing.ts` from the database.
- **Timestamps stored UTC**, displayed in `Truck.timezone`. Never render a raw server-local date — the truck and the customer are often in different zones.
- **Soft-delete menu items** via `archivedAt`. Never hard-delete anything an order references.
- **Order line items are price snapshots.** Never join to the live menu to display or re-total a past order; a later price change would silently rewrite history.
- **All order creation goes through `lib/orders/createOrder.ts`.** One path, no exceptions — a future SMS/AI bot reuses it rather than duplicating logic. `Order.source` already covers `WEB|SMS|API`.
- **Reserve slot capacity with a conditional update** (`WHERE bookedCount < capacity`) inside a transaction. Read-then-write lets two customers both win the last slot.
- **Stripe webhooks must be idempotent.** Insert `WebhookEvent.stripeEventId` *before* processing — Stripe retries deliveries.
- **Unpaid orders hold slots.** A sweep releases `PENDING_PAYMENT` orders older than ~15 min, or capacity silently fills with ghosts.

## Conventions

- Server Components by default; `"use client"` only where interactivity actually requires it.
- Server Actions for mutations. Route handlers only for webhooks and public JSON endpoints.
- Zod-validate every input at the Server Action / route handler boundary.
- Mobile-first, designed at 375px — nearly all real traffic is a phone on a sidewalk.
- Sold-out items render visible but **disabled**, never hidden. Hiding them makes customers think the menu changed.
- Use shadcn components from `components/ui/` rather than hand-rolling; they're checked in, so edit them directly when needed.

## Layout

```
app/
  (storefront)/[truckSlug]/     customer-facing, branded per truck
  (dashboard)/dashboard/        vendor-facing, main app domain
  api/webhooks/stripe/
lib/
  tenant.ts                  ★ tenant resolution + access guard
  pricing.ts                 ★ server-side total calculation
  orders/createOrder.ts      ★ the single order-creation path
  stripe.ts                    Stripe client + Connect helpers
components/ui/                 shadcn components
prisma/schema.prisma, prisma/seed.ts
middleware.ts                  subdomain / custom domain → truck slug rewrite
```

The ★ files hold everything easy to get wrong. Read them before touching money or tenancy.

```ts
getTruckFromRequest()   // storefront: slug or custom domain → Truck
requireTruckAccess()    // dashboard: Clerk session → Membership → Truck, throws on mismatch
```

Routing is path-based in dev (`localhost:3000/demo-truck`), subdomain-based in production via `middleware.ts`.

## Commands

```powershell
npm run dev / build / lint / test      # build before pushing anything substantial
npx prisma migrate dev                 # after editing schema.prisma
npx prisma studio                      # browse the DB in a GUI
npx prisma db seed                     # reset demo data
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.

## Git

- **Never push or merge to `main` without explicit permission from the user.** All work goes on a branch; `main` only changes through a PR both devs have agreed on. This includes force-pushes, which can wipe out the other person's work.
- Short-lived `feature/*` branches off `main`, merged via PR.
- Whoever edits `schema.prisma` commits the generated migration; the other runs `npx prisma migrate dev` after pulling.
- Never hand-edit a migration that's already been pushed — write a new one.
- `.env.local` is gitignored and must never be committed.
