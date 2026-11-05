# Sprint 4 — GitHub Report — Jovanni

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 4 (Nov 2 – Nov 16, 2026, as in the Sprint 4 Jira report)
- **GitHub username:** Jmaya100
- **Search used:** `is:pr is:merged author:Jmaya100 merged:2026-11-02..2026-11-16`
- **Report date:** Nov 4, 2026 (sprint still running; numbers are as of this date and get refreshed at sprint close)

## Pull Requests merged during the sprint

| # | Title | Link | Author | Reviewers | Merged |
|---|---|---|---|---|---|
| 14 | Feature/stripe payments | https://github.com/Unuvert1/FoodtruckApp/pull/14 | Jmaya100 | None recorded on GitHub (merged by Unuvert1, no review comments) | 2026-11-04 (3:44 pm CST) |
| 15 | Show the stop note on the checkout page (FPS-45) | https://github.com/Unuvert1/FoodtruckApp/pull/15 | Jmaya100 | None recorded on GitHub (merged by Unuvert1, no review comments) | 2026-11-04 (3:44 pm CST) |

**PR contents**

- **#14** — Customers now pay through Stripe (test mode) instead of orders being marked paid automatically (18 files, +764 / −14 lines). Covers Jira tickets FPS-63, FPS-64, and FPS-65, one commit each:
  - **FPS-63:** "Place order" sends the customer to Stripe's payment page, showing their items, tax and tip. All amounts are read from the order saved on the server, never from the browser. The order stays unpaid until Stripe confirms.
  - **FPS-64:** a Stripe webhook (`/api/webhooks/stripe`) marks the order paid. It rejects a missing or wrong signature, ignores an event it has already handled, and accepts a payment only if the Stripe session and the amount match the order. A checkout that expires cancels the unpaid order and gives the pickup time back.
  - **FPS-65:** an unpaid order shows a "Pay to send your order" screen with a Pay button. Right after paying, the page says "Confirming your payment…" and refreshes every few seconds until the webhook arrives. Unpaid orders are not remembered on the customer's device, and the ready alert only applies to paid orders.
  - If no Stripe key is set (local development), orders are still marked paid straight away, as before, so nobody needs a Stripe account to run the app.
  - 18 new unit tests (line items, webhook signature, paid, duplicate, wrong amount, expired). The full suite is now 181 tests, all passing.
- **#15** — The vendor's note for a stop (for example "cash only today") now also shows on the checkout page, not only on the storefront (1 file, +7 lines). Covers FPS-45.

## Commit Activity

| Metric | Value |
|---|---|
| Commits on `main` | 2 from me this sprint (PR #14 and PR #15, both squash-merged) |
| Commits across merged PRs | 4 (3 in PR #14, 1 in PR #15) |
| Commits authored by me | 4 (built with AI assistance) |
| Total number of commits | 4 (squash-merged to 2 commits on `main`) |
| Date range | 2026-11-02 – 2026-11-04 (first commit Nov 2, 9:45 pm CST; merged to `main` Nov 4) |
| Direct pushes to `main` | None. All of my work reached `main` through a pull request. |

## My focus this sprint

Getting the app ready to go live and taking real payments on the customer side. My teammate took the Vercel hosting steps (project, environment variables, database, login) and the vendor side. Jira: seven customer-side tickets (FPS-45, 59, 60, 61, 63, 64, 65; 13 story points). Four are done and merged (9 points); the other three need the live site first.

Other work this sprint that does not show up as a pull request:

- Planned Sprint 4 with my teammate: set the goal, wrote the tickets with acceptance criteria (FPS-56 to FPS-61 and FPS-63 to FPS-66), and wrote him a summary of what he owns.
- Checked the repository before deploying. No code changes were needed: the build already applies database migrations first, the development login bypass cannot switch on in a deployed build, and the demo-truck button stays hidden unless a setting is added.
- Moved the four finished Jira tickets to Done once their pull requests merged.
- Checked my teammate's Vercel link. It currently redirects to Vercel's sign-in page (Deployment Protection is switched on), so the public cannot open it yet. I asked him to turn that off for the production site.

## Not merged yet / not mine

- My teammate pushed a branch, `feature/sprint-4-pos-sales`, on Nov 4 (7 commits, not merged): counter sales, "Today's numbers" on the Service screen, a daily cleanup job, and a Next.js version bump. It is his work and is not counted here. It merges cleanly with `main` as far as I could check.
- FPS-59 (live smoke test), FPS-60 (Lighthouse on the live site) and FPS-61 (README deploy section) are not started. They need a public Vercel address first.
- I tested the Stripe work with unit tests and by rendering the new payment screens, but I have not yet paid with a real Stripe test card. That test needs the Stripe test keys (FPS-66) and, for the live site, the webhook address.
- Refunds are not built. A paid order that is later cancelled needs a manual refund in the Stripe dashboard for now. The webhook writes a log line when that happens.
