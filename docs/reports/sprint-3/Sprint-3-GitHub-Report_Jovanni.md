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
| 12 | Add Jovanni's Sprint 3 GitHub report and update the Sprint 3 Jira report | https://github.com/Unuvert1/FoodtruckApp/pull/12 | Jmaya100 | None recorded on GitHub (merged by Unuvert1, no review comments) | 2026-10-20 (9:16 pm CDT) |
| 11 | Customer polish, part 2: order shortcut, ready alert, checkout notices, not-open state | https://github.com/Unuvert1/FoodtruckApp/pull/11 | Jmaya100 | None recorded on GitHub (merged by Unuvert1, no review comments) | 2026-10-20 (9:17 pm CDT) |

**PR contents**

- **#9** — Customer storefront and checkout polish (9 files, +558 / −74 lines). Covers Jira tickets FPS-38, FPS-39, FPS-40, and FPS-41:
  - Checkout remembers the customer's name and phone on their own device and fills them in next time, with a Clear button (FPS-38).
  - Checkout opens with the earliest pickup time already selected, and tells the customer if the time they chose fills up while they check out (FPS-39).
  - One-tap add and a minus / plus stepper on menu items with no options, plus a short "Added" confirmation (FPS-40).
  - The section chips (Tacos, Sides, Drinks) now highlight the section the customer is looking at, and a chip they tap stays highlighted until they scroll (FPS-41).
  - Unit tests for the saved-details and pickup-time logic.
- **#11** — Customer polish, part 2 (17 files, +745 / −86 lines). Covers Jira tickets FPS-42, FPS-43, FPS-44, and FPS-46:
  - A "Your order A07 · View status" bar at the top of the storefront for a customer who already ordered, remembered on their device and removed once the order is picked up, cancelled, or 12 hours old (FPS-42).
  - A ready alert on the order status page: the tab title changes when the order is ready, and the customer can opt in to vibration and a notification (FPS-43).
  - Checkout names items that left the menu and takes them out of the order, and flags sold-out items before the customer submits, keeping them out of the total (FPS-44).
  - A clear "Opens Wednesday at 9:00 am" state, shown once above the menu and in place of a greyed-out Add button (FPS-46).
  - Unit tests for the new helpers. One line was added to `order-status.tsx`, a file my teammate also edited this sprint; his change was already in `main`.
- **#12** — Documentation: this report and the updated team Sprint 3 Jira report (2 files).

PR #7 (merged Oct 6) belongs to Sprint 2 and is in the Sprint 2 report, so it is not counted here.

## Commit Activity

| Metric | Value |
|---|---|
| Commits on `main` | 3 from me this sprint (PRs #9, #11 and #12, each squash-merged; the other new commits on `main` are by Unuvert1) |
| Commits across merged PRs | 4 (2 in PR #9, 1 in PR #11, 1 in PR #12) |
| Commits authored by me | 4 (built with AI assistance) |
| Total number of commits | 4 (squash-merged to 3 commits on `main`) |
| Date range | 2026-10-19 – 2026-10-20 (first commit – last commit; last PR merged to `main` 2026-10-20) |
| Direct pushes to `main` | None. All of my work reached `main` through a pull request. |

## My focus this sprint

The customer side of the app again: making ordering faster and clearer for someone on their phone, in the way Toast and DoorDash do it. My teammate took the vendor side (schedule, settings, POS) and Vercel hosting. Jira: nine customer-side tickets (FPS-38 to FPS-46, 20 story points); eight are done and merged (19 points).

Other work this sprint that does not show up as a pull request:

- Planned Sprint 3 and wrote the customer-side Jira tickets with acceptance criteria.
- Ran Lighthouse on the storefront (Accessibility 100, Performance 75). It was run against the local development server, so a re-run on a production build is still to do.
- Pulled my teammate's merged work before starting, so the code was up to date.

## Not done yet

- **FPS-45 (stop note)** is not done. My teammate's schedule work already shows the note on the storefront hero, but the checkout page does not show it yet, and the ticket asks for both. It carries over.
- I tested with unit tests and by running the real components in a headless browser. The ready alert has not been tried on a real phone, and some phones do not allow pop-up notifications from a web page.
