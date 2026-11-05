# Sprint 4 Jira Report — FoodtruckApp

**Jira Project:** Foodtruck Project SWE1 (`FPS`)
Link: https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3

**Sprint:** Sprint 4 (Sprint ID 6), Nov 2 – Nov 16, 2026 — **created, not yet started in Jira**

**Sprint Goal:** The site is live on Vercel and tested there, and customers can pay
with Stripe (test mode). Sprint 5 is then only bug fixes and last touches.

**Report date:** Nov 4, 2026 — a snapshot taken early in the sprint. Numbers are as
of this date and get refreshed at sprint close.

> **Note on the board:** Sprint 3 was closed in Jira on Nov 2 (not Oct 20, as its
> report expected). Two empty sprints still named "Sprint 2" and "Sprint 3" remain
> on the board holding no issues — worth deleting before Sprint 4 is closed.
> Sprint 4 itself still needs to be started in Jira.

---

## Sprint Commitment vs Delivery

| Metric | Count |
|---|---|
| Issues in the sprint | 16 |
| Issues completed | 4 |
| Issues in progress | 5 |
| Issues not started | 7 |
| Issues added mid-sprint | 4 |

Twelve issues were planned when the sprint was set up: ten new tickets (FPS-56 to
FPS-61 and FPS-63 to FPS-66) plus two carried over from Sprint 3 (FPS-30, Vercel
hosting, and FPS-45, the stop note at checkout). FPS-62 was never used. The Stripe
tickets (FPS-63 to FPS-66) were added once it was clear that payments were the
largest feature still unbuilt.

Four issues were added on Nov 4 (FPS-67 to FPS-70). They are Unubileg's vendor-side
work, which was built on a branch before it had tickets: counter sales, "Today's
numbers", the daily cleanup job, and the payments page and dependency clean-up.

---

## Issue Breakdown by Type

| Type | To Do | In Progress | Done |
|---|---|---|---|
| Story | 0 | 2 | 4 |
| Task | 7 | 3 | 0 |
| Bug | 0 | 0 | 0 |

---

## Per-Student Work Allocation

| Student | Issues Assigned | Issues Completed |
|---|---|---|
| Unubileg (Vercel hosting, live database, login, Stripe keys, POS, dashboard, cron) | 9 | 0 |
| Jovanni Maya (customer checkout, payments, live-site testing) | 7 | 4 |

Work was split by surface again. Unubileg owns the hosting and the accounts it
needs (Vercel, Supabase, Clerk, Stripe dashboard): FPS-30, FPS-56, FPS-57, FPS-58
and FPS-66, plus the vendor-side code in FPS-67 to FPS-70. Jovanni owns the code and testing on the customer side: FPS-45,
FPS-63, FPS-64, FPS-65 (all done) and FPS-59, FPS-60, FPS-61 (waiting on the live
site).

FPS-63 to FPS-65 changed how an order is placed and paid, which the vendor side
also depends on. Unubileg merged the pull request (no review comments were left
on GitHub), so the unpaid-order handling still deserves a quick look from him. No
merge conflicts.

---

## Estimation & Accuracy

| Metric | Value |
|---|---|
| Total story points in the sprint | 31 |
| Story points completed | 9 |
| Completion % | 29% |

Per person, completed: Unubileg 0 of 18, Jovanni 9 of 13. This is an early-sprint
snapshot. Another 8 of Unubileg's points (FPS-67 to FPS-70) are built on a branch
but not merged, so they are In Progress and not counted as completed. The other
14 points are mostly hosting setup, which has to happen before the live-site
testing (FPS-59, FPS-60) and the README (FPS-61) can start.

---

## Workflow Discipline

- [x] Issues moved through workflow states (To Do → In Progress → Done)
- [x] Issues closed only after acceptance criteria met and the pull request merged
- [ ] Every completed issue has a comment recording what was built and what was not tested *(to add before sprint close)*
- [ ] Sprint started in Jira *(Nov 2 – Nov 16 planned)*
- [ ] Sprint completed/closed in Jira *(closes Nov 16)*

---

## Blockers & Scope Changes

- **Blocker — the Vercel address is not public yet.** A deployment exists, but its
  address redirects to Vercel's sign-in page because Deployment Protection is
  switched on. Customers, the instructor and anyone without a Vercel login cannot
  open it. It needs to be turned off for the production site, and the stable
  production address (not the one-off deployment address) should be used in the
  app settings, the Stripe webhook and the README. FPS-56 to FPS-58 are still To Do
  in Jira.

- **Risk — payments run without Stripe keys until FPS-66 is done.** The code is
  merged and tested with unit tests (18 new, 181 in total, all passing), but it has
  not been tried with a real Stripe test card. If the app is deployed without
  `STRIPE_SECRET_KEY`, orders are still marked paid automatically, so a live site
  would give away free orders until the keys are added. Setting the keys and the
  webhook address is the first step of FPS-66.

- **Scope change — payments added to the sprint.** The sprint started as "get the
  site on Vercel". The four Stripe tickets (9 points) were added so that Sprint 5 is
  left for bug fixes and last touches.

- **Scope left out on purpose.** Connecting each truck's own Stripe account and
  refunding a cancelled paid order are not in this sprint. For now all payments go
  to one test Stripe account, and a refund is done by hand in the Stripe dashboard.

- **Vendor-side work was built before it had tickets.** On Nov 4 Unubileg pushed
  the branch `feature/sprint-4-pos-sales` (7 commits, not merged). Tickets for it
  were added the same day (FPS-67 counter sales, FPS-68 "Today's numbers", FPS-69
  daily cleanup job, FPS-70 payments page and dependency clean-up) and put In
  Progress, so the board matches GitHub. They move to Done only after the branch is
  merged. POS sale recording and "today's numbers" were planned for Sprint 3 and not
  reached. The branch adds one database migration that runs on deploy, and the
  cleanup job needs a `CRON_SECRET` variable on Vercel.

- **Seeded demo data goes stale.** Demo stops are created relative to the day the
  seed is run, so after about two weeks the storefront shows no open stops. The
  live database needs re-seeding before any demo (FPS-57). The free Supabase
  project also pauses when idle, so it must be un-paused before a demo.

---

## Jira Evidence Links (no screenshots)

- **Backlog:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/backlog
- **Board, filtered to Sprint 4:** https://jovanniandunoteam.atlassian.net/issues/?jql=project%3DFPS%20AND%20sprint%3D6%20ORDER%20BY%20key%20ASC
- **Sprint report:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/reports/sprint-retrospective?sprint=6 *(available once the sprint is closed)*
