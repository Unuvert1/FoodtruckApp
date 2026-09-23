# Sprint 1 — GitHub Report — Uno

_(GitHub/PR activity report. The Jira report for this sprint is a separate file: `Sprint-1-Jira-Report.md`.)_

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 1 (Sep 15 – Sep 22, 2026)
- **GitHub username:** Unuvert1
- **Search used:** `is:pr is:merged author:Unuvert1 merged:2026-09-15..2026-09-23`

## Pull Requests merged during the sprint

### PR #1 — Require permission before pushing to main

- **Link:** https://github.com/Unuvert1/FoodtruckApp/pull/1
- **Author:** Unuvert1
- **Reviewers:** Unuvert1 (self-reviewed; branch protection required a PR)
- **Merge date:** 2026-09-22
- **Contents:** Added the rule that nothing reaches `main` without a reviewed PR, and no force-pushes.

### PR #2 — Feature/vendor dashboard

- **Link:** https://github.com/Unuvert1/FoodtruckApp/pull/2
- **Author:** Unuvert1
- **Reviewers:** none recorded
- **Merge date:** 2026-09-22
- **Commits in PR:** 11
- **Contents:** The application to date — customer storefront (menu, cart, checkout, order status), vendor dashboard (live order queue, one-tap stock toggles, menu management, settings), Prisma schema and first migration against Supabase, seed data, tenancy guard, server-side pricing with unit tests, the single order-creation path with safe pickup-slot reservation, Clerk login with a development bypass, and vendor order emails.

### PR #3 — Add ERD diagram for writeup

- **Link:** https://github.com/Unuvert1/FoodtruckApp/pull/3
- **Author (account used):** Unuvert1
- **Written by:** Jovanni Maya (`Jmaya100`) — commit `a8beba8`
- **Reviewers:** none recorded
- **Merge date:** 2026-09-22 (03:18 UTC on Sep 23)
- **Contents:** `docs/erd.md`, a Mermaid entity-relationship diagram generated from `prisma/schema.prisma`, showing Truck → Membership / Location / Menu / Service, Service → PickupSlot → Order, and Order → OrderLineItem price snapshots.
- **Note:** I opened this PR on Jovanni's behalf and squash-merged it, which reassigned the squashed commit's author to me. The original authorship is visible on the PR's Commits tab. Fixed going forward: he has repository access and opens his own PRs (see PR #4).

## Commit Activity

| Metric | Value |
|---|---|
| Commits on `main` | 4 (each merged PR is squashed into one commit) |
| Commits written across the merged PRs | 13 |
| First commit | 2026-09-21 |
| Last commit | 2026-09-22 |

## Notes

- My focus this sprint: frontend sketches, the early proof of concept, and integrating and pushing the team's work.
- **Weak spot this sprint:** PR #2 and #3 have no recorded reviewer, and PR #1 was self-reviewed, because my teammate did not have repository access until the end of the sprint.
- **Changes for Sprint 2:** each of us opens our own PRs, we approve each other before merging, one PR per feature instead of one large branch, and `Co-authored-by:` on shared commits. The workflow is written down in the README's Contributing section.
