# Sprint 2 Jira Report — FoodtruckApp

**Jira Project:** Foodtruck Project SWE1 (`FPS`)
Link: https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3

**Sprint:** Sprint 2 (Sprint ID 1), Oct 1 – Oct 15, 2026

**Sprint Goal:** UI build-out for the vendor dashboard (menu editor, modifier groups, locations/services/calendar), frontend polish, and getting the app hosted on Vercel. No backend/payments work this sprint.

**Report date:** Oct 6, 2026 (sprint still active; numbers below are as of this date)

---

## Sprint Commitment vs Delivery

| Metric | Count |
|---|---|
| Issues committed at sprint start | 7 |
| Issues completed | 11 |
| Issues not completed | 3 |
| Issues added mid-sprint | 7 |

Seven issues (FPS-24 through FPS-30) were committed on Oct 1. Five more (FPS-31 through FPS-35) were added on Oct 5 and two more (FPS-36, FPS-37) on Oct 6, bringing the sprint to 14 issues. Eleven are Done. Three are not: FPS-29 (In Progress) and FPS-30 and FPS-37 (To Do).

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
| Unubileg (vendor-side UI + hosting) | 7 | 5 |
| Jovanni Maya (customer-facing UI) | 7 | 6 |

Unubileg owns the vendor-side tickets (FPS-25, 26, 27, 28, 36, 37) and the Vercel deployment (FPS-30), 27 story points in total. Jovanni owns the customer-facing storefront, checkout, and order-status work (FPS-24, 29, 31, 32, 33, 34, 35), 21 story points in total. The split was equal (21 points each) on Oct 5. Unubileg's total went up on Oct 6 when FPS-36 and FPS-37 (3 points each) were added.

---

## Estimation & Accuracy

| Metric | Value |
|---|---|
| Total story points committed | 26 (at sprint start) |
| Total story points completed | 39 |
| Completion % | 81% (39 of 48 points in the current sprint scope) |

Story points added mid-sprint: 22, so total sprint scope is now 48 points. Of the 26 points committed at the start, 20 are done (77%). The other 6 are FPS-29 (3) and FPS-30 (3). The other 19 completed points come from tickets added during the sprint.

---

## Workflow Discipline

- [x] Issues moved through workflow states (To Do → In Progress → Done)
- [x] Issues closed only after acceptance criteria met
- [ ] Sprint completed/closed in Jira

---

## Blockers & Scope Changes

- **Major blockers:** None so far. Customer-facing work is merged to `main` (pull request #7, merged Oct 6). The Lighthouse accessibility check for FPS-29 has not been run yet, so FPS-29 stays In Progress. Hosting on Vercel (FPS-30) has not started.
- **Scope changes:**
  - FPS-25 (menu editor UI) and FPS-27 (location CRUD UI) were reassigned from Jovanni to Unubileg because Unubileg is building the vendor side of the app this sprint. Jovanni moved to the customer-facing side, and FPS-29 was re-scoped from "storefront and dashboard" to customer-facing only.
  - Five tickets (FPS-31 to FPS-35, 16 points) were added on Oct 5 so both students carried equal story points (21 each) after the reassignment.
  - Unubileg re-scoped and renamed FPS-25 to FPS-28 on the vendor side and added FPS-36 (POS screen for counter sales) and FPS-37 (schedule screen UI, carried over) on Oct 6.
- **Why work spilled over:** Nothing has spilled out of the sprint yet. FPS-29, FPS-30, and FPS-37 are the open items going into the second week. FPS-24 was the one carry-over from Sprint 1 and is Done.

---

## Jira Evidence Links (no screenshots)

- **Sprint report:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/reports/sprint-retrospective?sprint=1
- **Backlog link:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/backlog
- **Board link (filtered to Sprint 2):** https://jovanniandunoteam.atlassian.net/issues/?jql=project%3DFPS%20AND%20sprint%3D1%20ORDER%20BY%20key%20ASC
