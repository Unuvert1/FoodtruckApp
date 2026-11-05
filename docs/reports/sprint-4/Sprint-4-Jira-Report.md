# Sprint 4 Jira Report — FoodtruckApp

**Jira Project:** Foodtruck Project SWE1 (`FPS`)
Link: https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3

**Sprint:** Sprint 4 (Sprint ID 6), Nov 2 – Nov 16, 2026 — **started in Jira on the evening of Nov 4**

**Sprint Goal:** The site is live on Vercel and tested there, and customers can pay
with Stripe (test mode). Sprint 5 is then only bug fixes and last touches.

**Live site:** https://foodtruck-app-one.vercel.app

**Report date:** Nov 4, 2026 (late evening) — numbers are as of this date, with the
sprint still running until Nov 16. They get refreshed at sprint close.

---

## Sprint Commitment vs Delivery

| Metric | Count |
|---|---|
| Issues in the sprint | 24 |
| Issues completed | 22 |
| Issues in progress | 0 |
| Issues not started | 2 (FPS-58, FPS-61) |
| Issues added mid-sprint | 12 (FPS-67 to FPS-78) |

Twelve issues were planned when the sprint was set up: ten new tickets (FPS-56 to
FPS-61 and FPS-63 to FPS-66) plus two carried over from Sprint 3 (FPS-30, Vercel
hosting, and FPS-45, the stop note at checkout). FPS-62 was never used. The Stripe
tickets (FPS-63 to FPS-66) were added once it was clear that payments were the
largest feature still unbuilt.

Twelve issues were added on Nov 4, all of them vendor-side work by Unubileg that was
built on a branch before it had tickets: counter sales, "Today's numbers", the daily
cleanup job and the payments page clean-up (FPS-67 to FPS-70), then the repeating
stops on the Schedule screen, the Orders screen, the cancellation and daily-summary
emails, the setup checklist, the marketing site, the new home page hero and two bug
fixes (FPS-71 to FPS-78).

---

## Issue Breakdown by Type

| Type | To Do | In Progress | Done |
|---|---|---|---|
| Story | 0 | 0 | 11 |
| Task | 2 | 0 | 9 |
| Bug | 0 | 0 | 2 |

---

## Per-Student Work Allocation

| Student | Issues Assigned | Issues Completed |
|---|---|---|
| Unubileg (Vercel hosting, live database, login, Stripe keys, POS, dashboard, schedule, emails, marketing site, cron) | 17 | 16 |
| Jovanni Maya (customer checkout, payments, live-site testing, README) | 7 | 6 |

Work was split by surface again. Unubileg owns the hosting and the accounts it
needs (Vercel, Supabase, Clerk, Stripe dashboard) and the vendor-side code.
Jovanni owns the code and testing on the customer side: FPS-45, FPS-63, FPS-64,
FPS-65 (payments and the stop note), FPS-59 (live-site smoke test) and FPS-60
(Lighthouse) are done, and FPS-61 (README) is written and waiting on its pull
request.

FPS-63 to FPS-65 changed how an order is placed and paid, which the vendor side
also depends on. Unubileg merged that pull request (no review comments were left
on GitHub). No merge conflicts when his branch merged afterwards.

---

## Estimation & Accuracy

| Metric | Value |
|---|---|
| Total story points in the sprint | 51 |
| Story points completed | 48 |
| Completion % | 94% |

Per person, completed: Unubileg 36 of 38, Jovanni 12 of 13. The three points left
are FPS-58 (Clerk sign-in on the live site, 2 points, Unubileg) and FPS-61 (the
README, 1 point, Jovanni). Twenty of the 51 points came from the eight tickets
added late (FPS-71 to FPS-78), and 8 more from FPS-67 to FPS-70, so 28 points of
work were not in the plan when the sprint began.

---

## Live-Site Testing (FPS-59 and FPS-60)

Tested on Nov 4 against https://foodtruck-app-one.vercel.app.

### Smoke test of the customer flow (FPS-59)

| Step | Result | Notes |
|---|---|---|
| Home page opens for anyone, no Vercel login | Pass | After Deployment Protection was switched off |
| Demo truck storefront and menu | Pass | Sold-out items are greyed out |
| Item options and add to cart | Pass | |
| Checkout: pickup time, tip, tax, name and phone | Pass | The name is remembered on the device |
| Place an order before the Stripe keys were added | **Fail, then fixed** | Order skipped Stripe and went straight to "Order sent", so orders were free. Fixed once the keys and webhook were added (FPS-66) |
| Place an order after the keys were added | Pass | Customer is sent to Stripe's payment page |
| Leave Stripe's page without paying | Pass | Order page shows "Pay to send your order" with a Pay button |
| Pay with the Stripe test card, on a phone | Pass | Order page changes to "Order sent" with an order number |
| No sideways scrolling at phone width | Pass | |
| Follow an order to "ready" on the live vendor dashboard | **Not tested** | Needs vendor sign-in on the live site (FPS-58 is still To Do) |
| Ready alert and "not open" banner on the live site | **Not tested** | |

### Lighthouse on the live site (FPS-60)

Chrome DevTools, mobile, Incognito window.

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Home (/) | 99 | 100 | 100 | 100 |
| Storefront with menu (/demo-truck) | 100 | 97 | 96 | 100 |
| Order status (/demo-truck/order/...) | 100 | 96 | 96 | 100 |

Sprint 3 numbers, from the local dev server: Accessibility 100, Performance 75.
Performance is up 25 points or more on the live site. Accessibility is unchanged on
the home page and 3 to 4 points lower on the storefront and order status pages. No
score is under 90, so no follow-up ticket was opened. The failing checks have not been
read yet; they are worth a look in Sprint 5.

---

## Workflow Discipline

- [x] Issues moved through workflow states (To Do → In Progress → Done)
- [x] Issues closed only after acceptance criteria met and the pull request merged (see the note on late tickets below)
- [ ] Every completed issue has a comment recording what was built and what was not tested *(only FPS-59 and FPS-60 have one so far; to add before sprint close)*
- [x] Sprint started in Jira (evening of Nov 4, planned Nov 2 – Nov 16)
- [ ] Sprint completed/closed in Jira *(closes Nov 16)*

---

## Blockers & Scope Changes

**Resolved this sprint**

- **The Vercel address was not public.** The first deployment redirected to Vercel's
  sign-in page because Deployment Protection was on. It was turned off, and the
  stable address is https://foodtruck-app-one.vercel.app.
- **Payments ran without Stripe keys.** The first live order skipped Stripe and was
  marked paid for free, as the code is designed to do when no key is set. After the
  Stripe test keys and the webhook address were added and the site was redeployed,
  the webhook address answered "Invalid signature" instead of "Stripe isn't
  configured", and an order went through Stripe's page and was marked paid after
  paying with the test card.

**Still open**

- **FPS-58: vendor sign-in on the live site has not been verified.** The Clerk
  setup is still To Do, so the vendor dashboard has not been tested on the live
  address.
- **The live demo data still looks stale.** After FPS-57 was closed, the demo truck
  still showed the same "Northfield Farmers Market, 9:00 am – 11:59 pm" stop on
  every day, plus the test orders placed while testing. The stop note from FPS-45
  did not show on the live checkout page; it is not yet confirmed whether that stop
  has a note set. The live database should be re-seeded before any final demo, and
  the test orders removed.
- **The daily cleanup job needs `CRON_SECRET`.** FPS-69 is Done, but whether
  `CRON_SECRET` is set on Vercel has not been checked. Without it the job's address
  stays closed.
- **FPS-59 is marked Done, but two of its checks were not run** (following an order
  to "ready" on the live dashboard, and the ready alert), because they need vendor
  sign-in. They are listed as Not tested above.
- **Free Supabase project.** It pauses when idle, so it must be un-paused before a
  demo.

**Scope changes**

- **Payments added to the sprint.** The sprint started as "get the site on Vercel".
  The four Stripe tickets (9 points) were added so that Sprint 5 is left for bug
  fixes and last touches.
- **Scope left out on purpose.** Connecting each truck's own Stripe account and
  refunding a cancelled paid order are not in this sprint. For now all payments go
  to one test Stripe account, and a refund is done by hand in the Stripe dashboard.
- **Vendor-side work was built before it had tickets.** Unubileg's branch
  (`feature/sprint-4-pos-sales`, 16 commits) was merged on Nov 4 as one pull
  request. Its twelve tickets (FPS-67 to FPS-78) were created after the work was
  built, and they were closed together on the evening of Nov 4, so Jira's timeline
  does not show when each piece of work was actually done. The branch added three
  database migrations, which run on deploy.

---

## Jira Evidence Links (no screenshots)

- **Backlog:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/backlog
- **Board, filtered to Sprint 4:** https://jovanniandunoteam.atlassian.net/issues/?jql=project%3DFPS%20AND%20sprint%3D6%20ORDER%20BY%20key%20ASC
- **Sprint report:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/reports/sprint-retrospective?sprint=6 *(available once the sprint is closed)*
