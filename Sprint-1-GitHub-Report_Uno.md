# Sprint 1 — GitHub Report — Uno

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 1 (Sep 15 – Sep 23, 2026)
- **GitHub username:** Unuvert1
- **Search used:** `is:pr is:merged author:Unuvert1 merged:2026-09-15..2026-09-23`

## Pull Requests merged during the sprint

| # | Title | Link | Author | Reviewers | Merged |
|---|---|---|---|---|---|
| 1 | Require permission before pushing to main | https://github.com/Unuvert1/FoodtruckApp/pull/1 | Unuvert1 | Unuvert1 | 2026-09-22 |
| 2 | Feature/vendor dashboard | https://github.com/Unuvert1/FoodtruckApp/pull/2 | Unuvert1 | — | 2026-09-22 |
| 3 | Add ERD diagram for writeup | https://github.com/Unuvert1/FoodtruckApp/pull/3 | Unuvert1 (commit by Jmaya100) | — | 2026-09-23 |
| 5 | Sprint 1 GitHub reports | https://github.com/Unuvert1/FoodtruckApp/pull/5 | Unuvert1 | — | 2026-09-23 |

**PR contents**

- **#1** — Branch protection rule: `main` changes only through a reviewed PR, no force-pushes.
- **#2** — The application: customer storefront (menu, cart, checkout, order status) and vendor dashboard (live order queue, one-tap stock toggles, menu management, settings), on a Supabase Postgres database via Prisma, with Clerk login, server-side pricing, safe pickup-slot reservation, and vendor order emails. 11 commits.
- **#3** — `docs/erd.md`: entity-relationship diagram generated from `prisma/schema.prisma`.
- **#5** — Sprint 1 GitHub reports and the team's PR workflow in the README.

## Commit Activity

| Metric | Value |
|---|---|
| Commits on `main` | 6 (merged PRs are squashed to one commit each) |
| Commits across merged PRs | 15 |
| First commit | 2026-09-21 |
| Last commit | 2026-09-23 |

## My focus this sprint

Frontend sketches and the early proof of concept, then the storefront and vendor dashboard implementation, database setup, and integrating the team's work into `main`.
