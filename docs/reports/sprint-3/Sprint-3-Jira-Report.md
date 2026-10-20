# Sprint 3 Jira Report — FoodtruckApp

**Jira Project:** Foodtruck Project SWE1 (`FPS`)
Link: https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3

**Sprint:** Sprint 3 (Sprint ID 4), Oct 8 – Oct 22, 2026 — **Active**

**Sprint Goal:** Finish the vendor side — scheduling, settings, and POS — and get
the app hosted.

**Report date:** Oct 20, 2026.

> **Note on the board:** Sprint 2 was closed on Oct 20 and Sprint 3 started the
> same day. Its dates were set to Oct 8 – Oct 22, which overlaps Sprint 2's
> Oct 1 – 15 window; the work in this report was done on Oct 19 and 20. There is
> also a stray empty sprint still named "Sprint 2" on the board, holding no
> issues — worth deleting or renaming before Sprint 3 is closed.

---

## Sprint Commitment vs Delivery

| Metric | Count |
|---|---|
| Issues in the sprint | 20 |
| Issues completed | 10 |
| Issues in progress | 5 |
| Issues not started | 5 |
| Issues added mid-sprint | 9 |

Nine issues were added during the sprint (FPS-47 to FPS-55). They are the vendor
work that had no ticket when it was built: the schedule write path, the settings
lock, saved spots, invites, the account section, notifications, the danger zone,
POS, and the customer-facing directions and attribution.

Two issues carried over from Sprint 2: FPS-37 (schedule screen) and FPS-30
(Vercel hosting). FPS-37 is done. FPS-30 is not.

---

## Issue Breakdown by Type

| Type | To Do | In Progress | Done |
|---|---|---|---|
| Story | 5 | 4 | 9 |
| Task | 0 | 1 | 1 |
| Bug | 0 | 0 | 0 |

---

## Per-Student Work Allocation

| Student | Issues Assigned | Issues Completed |
|---|---|---|
| Unubileg (vendor dashboard, settings, POS, schedule) | 11 | 10 |
| Jovanni Maya (customer storefront and checkout) | 9 | 0 |

Work was split by surface again, and this time there were no merge conflicts at
all — the two file lists did not overlap. Jovanni's previous branch was merged to
`main` before this sprint's work started, so there was nothing to rebase.

One overlap to resolve: FPS-45 ("show the stop note") is Jovanni's, but the stop
note was rendered on the storefront hero as part of wiring up the schedule. His
ticket was left untouched and the overlap is noted in FPS-55's comment.

Jovanni's nine issues are in progress or not started at the time of this report;
his sprint work is ongoing.

---

## Estimation & Accuracy

| Metric | Value |
|---|---|
| Total story points in the sprint | 54 |
| Story points completed | 31 |
| Completion % | 57% |

Per person, completed: Unubileg 31, Jovanni 0 so far.

The split is uneven this sprint — 34 points assigned to one side and 20 to the
other. The estimates were not adjusted to make them match, because the vendor side
genuinely carried more work: the schedule alone was two tickets and ten points,
and it had no existing code to build on.

---

## Workflow Discipline

- [x] Issues moved through workflow states (To Do → In Progress → Done)
- [x] Issues closed only after acceptance criteria met
- [x] Every completed issue has a comment recording what was built and what was not tested
- [x] Sprint started in Jira *(started Oct 20, running to Oct 22)*
- [ ] Sprint completed/closed in Jira

---

## Blockers & Scope Changes

- **Blocker — the Supabase project auto-paused again.** The free tier pauses after
  about a week idle, and the project had been idle since Sprint 2. Every
  database-backed page returned a 500 until it was restored, and the restore took
  a few minutes longer than the dashboard suggested. The same thing will happen
  before any demo if the project sits unused, which is worth knowing in advance
  rather than discovering on the day.

- **Blocker — seeded stops expire.** The demo data is generated relative to the
  day it is run, so after two weeks every stop was in the past and the storefront
  had nothing to show. This is a symptom of the thing this sprint fixed: there was
  no way for a vendor to add a stop, so the only stops that ever existed came from
  a script.

- **Scope change — a security fix was added mid-sprint.** FPS-48 was not planned.
  It came out of reading the settings code and finding that eight of ten actions
  never checked the caller's role.

- **Scope change — the settings work grew.** The sprint started with "finish some
  settings features" and became five tickets (FPS-48 to FPS-53) once we looked at
  what a settings area actually needs: invites, an account section, real
  notification controls, and a way to close a truck.

- **Why work is carrying over.** FPS-30 (Vercel) is prepared but not deployed; the
  deploy is a manual step after the branch is pushed. POS recording a sale and the
  "today's numbers" summary were both planned and not reached — the schedule and
  settings work took the sprint.

---

## Jira Evidence Links (no screenshots)

- **Backlog:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/backlog
- **Board, filtered to Sprint 3:** https://jovanniandunoteam.atlassian.net/issues/?jql=project%3DFPS%20AND%20sprint%3D4%20ORDER%20BY%20key%20ASC
- **Sprint report:** https://jovanniandunoteam.atlassian.net/jira/software/projects/FPS/boards/3/reports/sprint-retrospective?sprint=4 *(available once the sprint is closed)*
