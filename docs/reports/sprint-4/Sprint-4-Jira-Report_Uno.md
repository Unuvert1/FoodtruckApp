# Sprint 4 Jira Report (Uno) — FoodtruckApp

**Jira Project:** Foodtruck Project SWE1 (`FPS`)
Link: https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3

**Sprint:** Sprint 4 (Sprint ID 6), Nov 5 – Nov 16, 2026 — **Active**

**Sprint Goal:** The site is live on Vercel and tested there, and customers can
pay with Stripe (test mode). Sprint 5 is only bug fixes and last touches.

**Report date:** Nov 5, 2026.

> **Note on the board:** the sprint was started late, after a good deal of its
> work was already written, so twelve issues (FPS-67 to FPS-78) were added to
> describe work that existed before it had a ticket. They are marked as such in
> their own descriptions rather than being presented as planned.

---

## Sprint Commitment vs Delivery

| Metric | Count |
|---|---|
| Issues in the sprint | 24 |
| Issues completed | 18 |
| Issues in progress | 2 |
| Issues not started | 4 |
| Issues added mid-sprint | 12 |

The sprint was planned as eleven issues (FPS-56 to FPS-66): get the app onto
Vercel, get Stripe working, and finish the POS. Twelve more were added as the
work turned out larger than the plan — repeating stops, the orders screen, the
notification emails, the setup checklist, the marketing site, the home page, and
two bugs found while testing.

Two issues carried over from Sprint 3: FPS-30 (Vercel hosting) and FPS-45 (the
stop note at checkout). FPS-45 is done. FPS-30 is in progress — the site is
deployed and publicly reachable, but the ticket also covers verifying it there,
which is not finished.

---

## Issue Breakdown by Type

| Type | To Do | In Progress | Done |
|---|---|---|---|
| Story | 0 | 0 | 11 |
| Task | 4 | 2 | 5 |
| Bug | 0 | 0 | 2 |

Every story in the sprint is done. What is outstanding is all Task work, and all
of it is verification on the live site rather than building: Clerk sign-in,
a customer-flow smoke test, Lighthouse, and the README link.

---

## Per-Student Work Allocation

| Student | Issues Assigned | Issues Completed |
|---|---|---|
| Unubileg (vendor dashboard, POS, schedule, marketing site, deployment) | 17 | 14 |
| Jovanni Maya (customer storefront, checkout, payments) | 7 | 4 |

Split by surface again, and again with no merge conflicts — Jovanni worked on
checkout, the Stripe webhook and the order status page, and the vendor dashboard
and marketing site did not touch those files. His payment work (FPS-63, FPS-64,
FPS-65) merged to `main` as PR #14 and the stop note as PR #15, both before this
report.

Jovanni's three outstanding issues (FPS-59, FPS-60, FPS-61) all depend on the
live site being current. They were blocked for most of the sprint because the
deployment was running old code.

---

## Estimation & Accuracy

| Metric | Value |
|---|---|
| Total story points in the sprint | 51 |
| Story points completed | 41 |
| Completion % | 80% |

Per person, completed: Unubileg 32 of 38, Jovanni 9 of 13.

The split is uneven again, 38 points against 13, and this time it is not because
the estimates were wrong. Jovanni's Stripe work was the sprint goal and it landed
early; the vendor side then kept growing because each thing we looked at revealed
something missing behind it. Finding the POS saved nothing led to the day's
figures, which led to an orders screen, which led to noticing the notification
switches did nothing.

The one estimate that was clearly low is FPS-71 (repeating stops) at 5 points. It
needed a new model, a migration, a generator, timezone-safe recurrence and a new
form — closer to 8.

---

## Workflow Discipline

- [x] Issues moved through workflow states (To Do → In Progress → Done)
- [x] Issues closed only after acceptance criteria met
- [x] Every issue records what was built, and what was not tested, in its description
- [x] Sprint started in Jira *(Nov 5 – Nov 16)*
- [ ] Sprint completed/closed in Jira *(closes Nov 16)*

The weak point this sprint is that twelve issues were written after their work
existed. The board is accurate now, but it documented the work rather than
directing it.

---

## Blockers & Scope Changes

- **Blocker — Deployment Protection hid the live site.** Vercel enables it by
  default, so every preview URL asked for a Vercel login. Jovanni has no access to
  the Vercel project (Hobby plans have no team members), which blocked FPS-59,
  FPS-60 and FPS-61 for most of the sprint. Resolved by turning Vercel
  Authentication off.

- **Blocker — the deployed site ran old code all sprint.** Production was serving
  a build from before the Stripe environment variables were added, so orders fell
  back to being marked paid on creation and Stripe was never called. Confirmed by
  checking the database: four orders, all with no Stripe session or payment
  intent, and zero webhook events recorded. The code was correct; the deployment
  was stale.

- **Blocker — one deployment was redeployed from the wrong commit.** A redeploy
  was run against an old deployment three commits behind `main`, which looked
  successful and changed nothing.

- **Scope change — the POS turned out to be a mock.** Sprint 3's migration added
  the columns for counter sales but no code ever wrote one, so every cash sale
  disappeared on refresh. FPS-67 was the fix.

- **Scope change — "Repeat next week" was replaced.** Sprint 3 shipped a per-row
  repeat action. In use it was a weekly chore, so FPS-71 replaced it with a rule
  that is switched on once.

- **Scope change — a marketing site.** Nothing on the site answered what the app
  costs or how it works. FPS-75 and FPS-76 added pricing, questions, writing and
  a legal page, and rebuilt the home page.

- **Scope change — two settings switches did nothing.** Cancellations and daily
  summary were saved but never sent. FPS-73 made both real.

- **Why work is carrying over.** FPS-58, FPS-59, FPS-60 and FPS-61 are all
  verification on the live site, and all were blocked until the deployment was
  current. FPS-66 is partly done: Stripe test keys exist, the webhook endpoint is
  being registered. FPS-30 stays in progress until the site has been checked
  rather than merely deployed.

---

## Jira Evidence Links (no screenshots)

- **Backlog:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/backlog
- **Board, filtered to Sprint 4:** https://jovanniandunoteam.atlassian.net/issues/?jql=project%3DFPS%20AND%20sprint%3D6%20ORDER%20BY%20key%20ASC
- **Sprint report:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/reports/sprint-retrospective?sprint=6 *(available once the sprint is closed)*
- **Live site:** https://foodtruck-app-one.vercel.app
