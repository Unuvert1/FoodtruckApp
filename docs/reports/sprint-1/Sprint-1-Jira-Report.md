# Sprint 1 Jira Report — FoodtruckApp

**Jira Project:** Foodtruck Project SWE1 (`FPS`)
Link: https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3

**Sprint:** Sprint 1 (Sprint ID 2), Sept 8 – Sept 22, 2026 — **Closed**

**Sprint Goal:** Ship the FoodtruckApp foundation, vendor dashboard core, customer storefront, and core order/payment plumbing.

---

## Sprint Commitment vs Delivery

| Metric | Count |
|---|---|
| Issues committed at sprint start | 24 |
| Issues completed | 23 |
| Issues not completed | 1 |
| Issues added mid-sprint | 0 |

The one incomplete issue, **FPS-24 (ERD diagram for the data model)**, was left In Progress because its pull request had not yet merged at the time the sprint was closed.

---

## Issue Breakdown by Type

| Type | To Do | In Progress | Done |
|---|---|---|---|
| Story | 0 | 0 | 13 |
| Task | 0 | 1 | 10 |
| Bug | 0 | 0 | 0 |

---

## Per-Student Work Allocation

| Student | Issues Assigned | Issues Completed |
|---|---|---|
| Unubileg (backend) | 11 | 11 |
| Jovanni Maya (frontend) | 13 | 12 |

Work was split by area of ownership: Unubileg on backend/foundation (schema, auth wiring, tenancy, pricing, order creation), Jovanni Maya on frontend (dashboard UI, storefront UI, checkout UI, order status).

---

## Estimation & Accuracy

| Metric | Value |
|---|---|
| Total story points committed | 68 |
| Total story points completed | 66 |
| Completion % | 97% |

---

## Workflow Discipline

- [x] Issues moved through workflow states (To Do → In Progress → Done)
- [x] Issues closed only after acceptance criteria met
- [x] Sprint completed/closed in Jira

---

## Blockers & Scope Changes

- **Major blockers:** Coordinating repository access between both developers (collaborator permissions) and each developer standing up their own local Supabase project/database took longer than expected at the start of the project.
- **Scope changes:** An ERD diagram (FPS-24) was added to the sprint mid-stream to satisfy the project writeup's documentation requirement — it was not part of the original Stream A/B/C plan.
- **Why work spilled over:** FPS-24 spilled over because its pull request was still open for review when the sprint closed; the diagram itself was finished, but not yet merged to `main`.

---

## Jira Evidence Links (no screenshots)

- **Sprint report:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/reports/sprint-retrospective?sprint=2 *(if this link 404s, see note below)*
- **Backlog link:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/backlog
- **Board link (filtered to Sprint 1):** https://jovanniandunoteam.atlassian.net/issues/?jql=project%3DFPS%20AND%20sprint%3D2%20ORDER%20BY%20key%20ASC
