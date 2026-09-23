# Sprint 1 — GitHub Report — Jovanni

_(GitHub/PR activity report. The Jira report for this sprint is a separate file: `Sprint-1-Jira-Report.md`.)_

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 1 (Sep 15 – Sep 22, 2026)
- **GitHub username:** Jmaya100
- **Search used:** `is:pr is:merged author:Jmaya100 merged:2026-09-15..2026-09-23`

## Pull Requests merged during the sprint

### PR #3 — Add ERD diagram for writeup

- **Link:** https://github.com/Unuvert1/FoodtruckApp/pull/3
- **Written by:** Jovanni Maya (`Jmaya100`) — commit `a8beba8`, visible on the PR's Commits tab
- **Account that opened and merged the PR:** Unuvert1
- **Reviewers:** none recorded
- **Merge date:** 2026-09-22 (03:18 UTC on Sep 23)
- **Contents:** `docs/erd.md` — a Mermaid entity-relationship diagram generated from `prisma/schema.prisma`: Truck → Membership / Location / Menu / Service, Menu → MenuSection → MenuItem → ModifierGroup → ModifierOption, Service → PickupSlot → Order, and Order → OrderLineItem as price snapshots. It documents the `Service` as the central entity everything else hangs off.
- **Note:** I did not have repository access yet, so my teammate opened this PR for me. Squash merging credits the squashed commit to whoever opens the PR, so `main` shows his name on it; the PR's Commits tab still shows mine.

## Work contributed through PRs opened by my teammate

- **PR #2 — Feature/vendor dashboard** (https://github.com/Unuvert1/FoodtruckApp/pull/2, merged 2026-09-22): project planning and scope, the stack decision (Next.js, Postgres/Supabase with Prisma, Clerk, Resend, Stripe later), and the data-model direction that the ERD documents.

## Open at time of writing

- **PR #4 — Add Sprint 1 Jira report** (https://github.com/Unuvert1/FoodtruckApp/pull/4), opened by `Jmaya100` — my first PR from my own account. It must be merged to count toward this sprint.

## Commit Activity

| Metric | Value |
|---|---|
| Total commits on `main` | 13 |
| Commits authored by me (`Jmaya100`) | 1 (`a8beba8`, squashed into `main` under my teammate's name) |
| First commit | 2026-09-21 |
| Last commit | 2026-09-22 |

## Notes

- My sprint work: the project idea and planning, the stack choice, how we would build it, and the ERD.
- **Changes for Sprint 2:** I now have repository access and open my own PRs (PR #4 is the first), we review each other before merging, and shared work is marked with `Co-authored-by:` so attribution shows in GitHub.
