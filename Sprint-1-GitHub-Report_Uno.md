# Sprint 1 GitHub Report — Uno

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 1 (Sep 15 – Sep 22, 2026)
- **GitHub username:** Unuvert1
- **Search used:** `is:pr is:merged author:Unuvert1 merged:2026-09-15..2026-09-22`

## Pull Requests merged during the sprint

### 1. Require permission before pushing to main

- **Link:** https://github.com/Unuvert1/FoodtruckApp/pull/1
- **Author:** Unuvert1
- **Reviewers:** Unuvert1 (self-reviewed; branch protection required a PR)
- **Merge date:** 2026-09-22
- **Contents:** Added the rule to `CLAUDE.md` that nothing reaches `main` without a reviewed PR, and no force-pushes.

### 2. Feature/vendor dashboard

- **Link:** https://github.com/Unuvert1/FoodtruckApp/pull/2
- **Author:** Unuvert1
- **Reviewers:** none recorded
- **Merge date:** 2026-09-22
- **Commits in PR:** 11
- **Contents:** The whole application to date — customer storefront (menu, cart, checkout, order status), vendor dashboard (live order queue, stock toggles, menu management, settings), Prisma schema and migration against Supabase, seed data, tenancy guard, server-side pricing with unit tests, the single order-creation path with safe slot reservation, Clerk login with a development bypass, and vendor order emails.

## Commit Activity

| Metric | Value |
|---|---|
| Total commits | 12 |
| First commit | 2026-09-21 |
| Last commit | 2026-09-22 |

## Notes

- My focus this sprint: frontend sketches, the early proof of concept, and pushing the team's work to the repository.
- Both PRs were merged by me. PR #2 has no recorded reviewer because my teammate does not yet have repository access; that is fixed next sprint (see below).
- Work by Jovanni (project planning, stack selection, and architecture decisions) is included in these PRs but was committed from my account, so it does not show under his GitHub username.
- **Changes for Sprint 2:** Jovanni commits from his own account, we add each other as reviewers before merging, and we open one PR per feature instead of a single large branch.
