# FoodtruckApp

White-label pre-ordering for food trucks. Each truck gets a branded storefront where customers order ahead and pick a pickup time; vendors manage menu, stock, and incoming orders from a dashboard. Two devs, class project — favor conventional, readable code.

**Core idea: the `Service`** — one truck, at one location, from one time to another. Menu availability, pickup slots, capacity, and orders all hang off a Service.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Postgres (Supabase) · Prisma 7 · Clerk (vendors only; customers are guests) · Resend · Vercel · Stripe Connect (planned)

## Architecture

```
app/
  (platform)/                 home page, sign-in / sign-up
  (storefront)/[truckSlug]/   customer storefront, checkout, order status
  (dashboard)/dashboard/      vendor: service screen (orders + stock), menu, settings
lib/
  tenant.ts                   tenant resolution, access guard, all tenant queries
  pricing.ts                  server-side price/total calculation
  orders/createOrder.ts       the single order-creation path
  orders/markOrderPaid.ts     PAID + vendor email (Stripe webhook will call it)
  db.ts                       Prisma client
  dev-auth.ts                 current user (Clerk, or a dev bypass)
prisma/                       schema, migrations, seed (demo truck)
```

- **Multi-tenant:** every tenant table has `truckId`. A `Membership` links a Clerk user to a truck. Storefronts resolve the truck from the URL slug; the dashboard from `requireTruckAccess()`.
- **Order flow:** cart (client) → checkout Server Action → `createOrder` (reprice, reserve slot, save) → `markOrderPaid` → vendor queue.
- **Payments:** not built yet; orders are marked paid on creation until Stripe replaces that step.
- **Live updates:** polling, not websockets.

## Data model

```
Truck ─┬─ Membership (clerkUserId, role)
       ├─ Location
       ├─ Menu → MenuSection → MenuItem → ModifierGroup → ModifierOption
       └─ Service (location, menu, times, slot size/capacity)
            ├─ PickupSlot (capacity, bookedCount)
            └─ Order → OrderLineItem (price snapshots)
```

Order status: `PENDING_PAYMENT → PAID → ACCEPTED → PREPARING → READY → PICKED_UP` (+ `CANCELLED`, `REFUNDED`).

## Hard rules

- Money is integer cents; rates are basis points. No floats.
- Tenant queries only through `lib/tenant.ts`; dashboard `truckId` only from `requireTruckAccess()`.
- Never trust client prices — the server recomputes in `lib/pricing.ts`.
- All orders go through `createOrder`; reserve slots with a conditional update, never read-then-write.
- Store UTC, display in `Truck.timezone`.
- Soft-delete menu items (`archivedAt`); order line items are snapshots, never re-joined to the live menu.
- Stripe webhooks (when added) must be idempotent.
- Don't edit this file unless the user explicitly asks.

## Commands

```
npm run dev / build / lint / test
npx prisma migrate dev     # after editing schema.prisma
npx prisma db seed         # reset demo data
```

## Git

- Never push or merge to `main` without the user's permission. Feature branches + PRs.
- Whoever changes the schema commits the migration. Never commit `.env.local`.
