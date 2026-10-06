# Sprint 2 — GitHub Report — Jovanni

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 2 (Oct 1 – Oct 15, 2026)
- **GitHub username:** Jmaya100
- **Search used:** `is:pr is:merged author:Jmaya100 merged:2026-10-01..2026-10-15`
- **Report date:** Oct 6, 2026 (sprint still active; numbers are as of this date and get refreshed at sprint close)

## Pull Requests merged during the sprint

| # | Title | Link | Author | Reviewers | Merged |
|---|---|---|---|---|---|
| 7 | Feature/customer UI | https://github.com/Unuvert1/FoodtruckApp/pull/7 | Jmaya100 | TODO: add reviewer's username | 2026-10-06 |

**PR contents**

- **#7** — Customer-facing UI for the storefront, checkout, and order status (24 files, +872 / −233 lines). Covers Jira tickets FPS-29, FPS-31, FPS-32, FPS-33, FPS-34, and FPS-35:
  - Loading, error, and not-found screens, plus an empty-menu state, and an accessibility pass: labels, focus handling, and screen reader status messages (FPS-29).
  - Responsive tablet and desktop layouts for the storefront, checkout, and order status pages (FPS-31).
  - Menu item photos as a list thumbnail and an item sheet header, with a fallback when an image fails to load (FPS-32).
  - Menu search and a "hide sold out" filter, with a "nothing matches" state (FPS-33).
  - Order status "last updated" indicator, offline / overdue warning, and a manual Refresh button (FPS-34).
  - "Copy order link" and "Add pickup to calendar" (.ics file) on the order status page, with unit tests for the calendar file (FPS-35).

## Commit Activity

| Metric | Value |
|---|---|
| Commits on `main` | 1 so far this sprint (merged PRs are squashed to one commit each) |
| Commits across merged PRs | 6 (all in PR #7) |
| Commits authored by me | 6 (built with AI assistance) |
| First commit | 2026-10-05 |
| Last commit | 2026-10-05 (merged to `main` 2026-10-06) |

## My focus this sprint

The customer side of the app: what a person sees when they browse a food truck's menu, place an order, and wait for pickup. My teammate took the vendor dashboard and hosting. We split the work so that each of us carries 21 story points (see the Sprint 2 Jira report).

## Not merged yet

- The Lighthouse accessibility check for FPS-29 has not been run yet, so that ticket stays In Progress.
- The Sprint 2 Jira report (`Sprint-2-Jira-Report.md`) is written but not yet merged, so it is not listed above.
