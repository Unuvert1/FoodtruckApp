# Sprint 3 — GitHub Report — Jovanni

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 3 (Oct 6 – Oct 20, 2026, as in the Sprint 3 Jira report)
- **GitHub username:** Jmaya100
- **Search used:** `is:pr is:merged author:Jmaya100 merged:2026-10-06..2026-10-20`
- **Report date:** Oct 20, 2026 (sprint still active; numbers are as of this date and get refreshed at sprint close)

## Pull Requests merged during the sprint

| # | Title | Link | Author | Reviewers | Merged |
|---|---|---|---|---|---|
| 9 | Feature/customer polish | https://github.com/Unuvert1/FoodtruckApp/pull/9 | Jmaya100 | None recorded on GitHub (merged by Unuvert1, no review comments) | 2026-10-19 (11:38 pm CDT) |

**PR contents**

- **#9** — Customer storefront and checkout polish (9 files, +558 / −74 lines). Covers Jira tickets FPS-38, FPS-39, FPS-40, and FPS-41:
  - Checkout remembers the customer's name and phone on their own device and fills them in next time, with a Clear button (FPS-38).
  - Checkout opens with the earliest pickup time already selected, and tells the customer if the time they chose fills up while they check out (FPS-39).
  - One-tap add and a minus / plus stepper on menu items with no options, plus a short "Added" confirmation (FPS-40).
  - The section chips (Tacos, Sides, Drinks) now highlight the section the customer is looking at, and a chip they tap stays highlighted until they scroll (FPS-41).
  - Unit tests for the saved-details and pickup-time logic.

PR #7 (merged Oct 6) belongs to Sprint 2 and is in the Sprint 2 report, so it is not counted here.

## Commit Activity

| Metric | Value |
|---|---|
| Commits on `main` | 1 from me this sprint (PR #9, squash-merged; the other new commit on `main` is PR #10 by Unuvert1) |
| Commits across merged PRs | 2 (both in PR #9) |
| Commits authored by me | 2 (built with AI assistance) |
| Total number of commits | 2 (in PR #9; squash-merged to 1 commit on `main`) |
| Date range | 2026-10-19 – 2026-10-19 (first commit – last commit; merged to `main` 2026-10-19) |
| Direct pushes to `main` | None. All of my work reached `main` through a pull request. |

## My focus this sprint

The customer side of the app again: making ordering faster and clearer for someone on their phone, in the way Toast and DoorDash do it. My teammate took the vendor side (schedule, settings, POS) and Vercel hosting. Jira: nine customer-side tickets (FPS-38 to FPS-46, 20 story points); four are done and merged (9 points).

Other work this sprint that does not show up as a pull request:

- Planned Sprint 3 and wrote the customer-side Jira tickets with acceptance criteria.
- Ran Lighthouse on the storefront (Accessibility 100, Performance 75). It was run against the local development server, so a re-run on a production build is still to do.
- Pulled my teammate's merged work before starting, so the code was up to date.

## Not merged yet

- **PR #11, "Customer polish, part 2"** is open and waiting for review. It covers FPS-42 ("Your order" shortcut on the storefront), FPS-43 (ready alert on the order status page), FPS-44 (checkout names removed and sold-out items), and FPS-46 (a clear "not open yet" state). Those four tickets are In Progress in Jira, and are not counted as done until the PR is merged. It touches one line of `order-status.tsx`, a file my teammate also edited this sprint; his change is already in `main`.
- FPS-45 (stop note) is not started. The note already shows on the storefront from my teammate's schedule work, so it needs checking and closing.
- I tested with unit tests and by running the real components in a headless browser. The ready alert has not been tried on a real phone, and some phones do not allow pop-up notifications from a web page.
