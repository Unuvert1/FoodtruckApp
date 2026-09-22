# FoodtruckApp

White-label pre-ordering for food trucks: each truck gets a branded storefront where customers pick a pickup time and pay ahead; vendors run menu, stock, and orders from a dashboard. Two devs, class project — favor conventional, readable code over clever code. Setup and roadmap: `README.md`.

**The central entity is the `Service`**: one truck, at one location, from one time to another. Menu, pickup slots, capacity, and orders hang off it. If a feature feels awkward to model, it probably belongs on a Service. Schema: `prisma/schema.prisma`.

## Where things stand

- **Checkout skips payment on purpose.** `checkout/actions.ts` calls `markOrderPaid` right after `createOrder`; that is not a bug. Stripe replaces it later (Stream C).
- **Stops (Services) exist only from `prisma/seed.ts`.** A newly created truck has none until scheduling is built.
- **Login can be bypassed in dev** with `DEV_AUTH_BYPASS=true` in `.env.local` (you're the demo truck's owner).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Postgres on Supabase · Prisma 7 · Clerk v7 (vendors only; customers check out as guests) · Resend · Vercel. Later: Stripe Connect + Checkout, Vercel Blob.

## Hard rules

Each prevents an expensive bug. If one looks wrong, raise it instead of working around it.

- **Money is integer cents** (`...Cents`), rates are basis points (`taxRateBps`, 250 = 2.5%). No floats — parse typed prices with `parseDollarsToCents`.
- **Tenant queries only through `lib/tenant.ts`**, and dashboard code gets `truckId` only from `requireTruckAccess()`, never from a form field or URL. Truck A seeing or changing truck B's data is the worst bug this app can have.
- **Never trust client prices.** The browser sends item IDs, option IDs, and quantities; `lib/pricing.ts` recomputes everything from the database.
- **All orders go through `lib/orders/createOrder.ts`** (a future SMS bot reuses it). Slot capacity is reserved with a conditional update (`bookedCount < capacity`) — read-then-write lets two customers win the last slot.
- **Timestamps are stored UTC** and shown in `Truck.timezone` via `lib/time.ts`. The truck and the customer are often in different zones.
- **Soft-delete menu items** via `archivedAt`; never hard-delete anything an order references. Order line items are price snapshots — never re-join them to the live menu.
- **When adding Stripe:** webhooks must be idempotent (insert `WebhookEvent.stripeEventId` before processing; `markOrderPaid` is already safe to repeat), and a sweep must release `PENDING_PAYMENT` orders after ~15 min so they don't hold slots.

## Conventions

- Server Components by default. Mutations are Server Actions, Zod-validated, returning `{ ok, error }` for problems the user can fix. Storefront: `app/(storefront)/[truckSlug]/checkout/actions.ts`. Vendor: `app/(dashboard)/dashboard/actions.ts`.
- Get the current user with `getUserId()` from `lib/dev-auth.ts`, never Clerk's `auth()` directly, so the dev bypass keeps working.
- Mobile-first (375px); the dashboard also targets tablets. Sold-out items render disabled, never hidden.
- Live screens poll with `<AutoRefresh seconds={n} />`, not websockets.
- Colors are tokens in `app/globals.css`: storefronts use the truck's `--brand`; the dashboard uses `--signal` (new orders) and `--ready`.
- Truck slugs share the URL space with app routes (`/demo-truck` vs `/dashboard`). Adding a top-level route? Add it to `RESERVED_SLUGS` in the dashboard actions.

## Gotchas

Our libraries are newer than most examples online:
- **Clerk v7**: `<SignedIn>`/`<SignedOut>` are removed (they crash) — use `<Show when="signed-in">`. `ClerkProvider` wraps only `(platform)` and `(dashboard)`; don't move it to the root layout, or every storefront loads Clerk.
- **Prisma 7**: import from `@/lib/generated/prisma/client`, not `@prisma/client`. The client is gitignored — after pulling a schema change, run `npm install` (or `npx prisma generate`). The CLI config is `prisma.config.ts`, which reads `.env.local`.
- **Supabase**: `DIRECT_URL` must be the *Session pooler* (port 5432), not "Direct connection" (IPv6-only). Passwords go in without the `[ ]`.
- **shadcn** here is the Base UI flavor: components take a `render` prop, not `asChild`.
- **Next 15**: `params` and `searchParams` are Promises — `await` them.
- **Server/client boundary**: `lib/tenant.ts`, `lib/db.ts`, and `lib/email.ts` are `server-only`; client components can't import them. And server code can't call functions exported from a `"use client"` file — put shared helpers in plain `lib/` modules.
- **Windows PowerShell 5.1** (our shell): no `&&` (use `;`); commit messages with quotes break with `-m`, so use `git commit -F file`; paths with `[brackets]` like `[truckSlug]` need `-LiteralPath`.

## Commands

```powershell
npm run dev / build / lint / test      # build before pushing anything substantial
npx prisma migrate dev                 # after editing schema.prisma
npx prisma db seed                     # reset demo truck data with fresh dates
npx prisma studio                      # browse the database
```

`npm test` covers pricing, money parsing, and order numbers (`lib/**/*.test.ts`). Add a test when you touch money.

## Git

- **Never push or merge to `main` without the user's permission.** Work on `feature/*` branches, merge via PR. No force-pushes.
- Whoever edits `schema.prisma` commits the migration; the other runs `npx prisma migrate dev` after pulling. Never edit a pushed migration — write a new one.
- Never commit `.env.local`.
