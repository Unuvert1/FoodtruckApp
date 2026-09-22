# FoodtruckApp

White-label pre-ordering for food trucks: each truck gets a branded storefront where customers pick a pickup time and pay ahead; vendors run menu, stock, and orders from a dashboard. Two devs, class project — favor conventional, readable code over clever code. Setup and roadmap: `README.md`.

**The central entity is the `Service`**: one truck, at one location, from one time to another. Menu, pickup slots, capacity, and orders hang off it. Schema: `prisma/schema.prisma`.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui (Base UI flavor: `render` prop, not `asChild`) · Postgres on Supabase · Prisma 7 · Clerk v7 (vendors only; customers check out as guests) · Resend · Vercel. Stripe comes later.

## Hard rules

- **Money is integer cents**, rates are basis points (`taxRateBps`). No floats.
- **Tenant queries only through `lib/tenant.ts`.** Dashboard code gets `truckId` only from `requireTruckAccess()`, never from input.
- **Never trust client prices.** The browser sends IDs and quantities; `lib/pricing.ts` recomputes.
- **All orders go through `lib/orders/createOrder.ts`.** Slot capacity is reserved with a conditional update, never read-then-write.
- **Timestamps are UTC**, shown in `Truck.timezone` via `lib/time.ts`.
- **Soft-delete menu items** (`archivedAt`); order line items are price snapshots, never re-joined to the live menu.
- **Stripe webhooks must be idempotent** (`WebhookEvent`), and unpaid orders need a sweep so they don't hold slots.

## Conventions

- Server Components by default; Server Actions for mutations, Zod-validated.
- Mobile-first (375px). Sold-out items show disabled, never hidden.
- Get the user via `getUserId()` (`lib/dev-auth.ts`), not Clerk's `auth()`, so `DEV_AUTH_BYPASS` keeps working in dev.

## Commands

```powershell
npm run dev / build / lint / test
npx prisma migrate dev     # after editing schema.prisma
npx prisma db seed         # reset demo truck data
```

## Git

- **Never push or merge to `main` without the user's permission.** Work on `feature/*` branches, merge via PR.
- Whoever edits `schema.prisma` commits the migration; never edit a pushed migration.
- Never commit `.env.local`.
