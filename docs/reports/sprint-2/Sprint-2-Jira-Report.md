# Sprint 2 Jira Report — FoodtruckApp

**Jira Project:** Foodtruck Project SWE1 (`FPS`)
Link: https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3

**Sprint:** Sprint 2 (Sprint ID 1), Oct 1 – Oct 15, 2026 — **Active**

**Sprint Goal:** UI build-out for the vendor dashboard, frontend polish, and getting the app hosted on Vercel. No backend/payments work this sprint.

**Report date:** Oct 6, 2026. The sprint is still open, so these numbers are as of this date and get refreshed at sprint close.

---

## Sprint Commitment vs Delivery

| Metric | Count |
|---|---|
| Issues in the sprint | 14 |
| Issues completed | 11 |
| Issues in progress | 1 |
| Issues not started | 2 |
| Issues added mid-sprint | 8 |

Eight issues were added after the sprint opened. Six were Jovanni's customer-side
tickets (FPS-31 to FPS-35) once the frontend scope was broken down properly, and
two were vendor-side work that had no ticket when it was built (FPS-36, FPS-37).

Four of the original vendor tickets were rewritten mid-sprint. The sprint was
planned as "UI only, backend deferred", but the vendor work ended up needing its
backend to be usable at all — a menu photo is not a feature until it uploads and
displays. The tickets now describe what was actually built.

---

## Issue Breakdown by Type

| Type | To Do | In Progress | Done |
|---|---|---|---|
| Story | 1 | 0 | 9 |
| Task | 1 | 1 | 2 |
| Bug | 0 | 0 | 0 |

---

## Per-Student Work Allocation

| Student | Issues Assigned | Issues Completed |
|---|---|---|
| Unubileg (vendor dashboard, POS, backend) | 7 | 5 |
| Jovanni Maya (customer storefront, frontend polish) | 7 | 6 |

Work was split by surface: Unubileg on the vendor dashboard (menu, service queue,
order detail, settings, POS, schedule groundwork), Jovanni on the customer side
(storefront, checkout, order status, accessibility, responsive layouts).

The one overlap was menu photos — both of us built the customer-side display
independently in the same week. Jovanni's version was already merged to `main`,
so it was kept and the duplicate was dropped during the rebase. Unubileg's vendor
upload pipeline feeds it.

---

## Estimation & Accuracy

| Metric | Value |
|---|---|
| Total story points in the sprint | 48 |
| Story points completed | 39 |
| Completion % | 81% |

Per person, completed: Unubileg 21, Jovanni 18.

---

## Workflow Discipline

- [x] Issues moved through workflow states (To Do → In Progress → Done)
- [x] Issues closed only after acceptance criteria met
- [ ] Sprint completed/closed in Jira *(sprint still active until Oct 15)*

---

## Blockers & Scope Changes

- **Blocker — the Supabase project auto-paused.** The free tier pauses a project
  after 7 days idle, which it had been between sprints. Every database-backed
  page returned a 500 until the project was restored. Cost about an hour before
  the cause was identified.

- **Blocker — no geocoding provider fit.** Address autocomplete for stops stalled
  on provider choice: Google requires a billing account and its terms cap
  coordinate caching at 30 days, and Mapbox forbids storing geocodes outright.
  Both conflict with keeping a saved-spots list. Resolved by going with a keyless
  provider behind a swappable module (FPS-28).

- **Scope change — tickets rewritten to match the work.** FPS-25 through FPS-28
  were written as UI-only shells with backend deferred. In practice the vendor
  features were not demonstrable without their data layer, so the scope moved and
  the tickets were updated to describe what shipped.

- **Scope change — POS was not planned.** FPS-36 was added mid-sprint after the
  counter-sales screen was requested and built.

- **Why work is carrying over.** FPS-30 (Vercel hosting) has not been started.
  FPS-37 (Schedule screen) is carried over because its groundwork (FPS-28) took
  the sprint; nothing blocks it now. FPS-29 is In Progress pending a Lighthouse
  accessibility check.

---

## Jira Evidence Links (no screenshots)

- **Backlog:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/backlog
- **Board, filtered to Sprint 2:** https://jovanniandunoteam.atlassian.net/issues/?jql=project%3DFPS%20AND%20sprint%3D1%20ORDER%20BY%20key%20ASC
- **Sprint report:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/reports/sprint-retrospective?sprint=1 *(available once the sprint is closed)*
