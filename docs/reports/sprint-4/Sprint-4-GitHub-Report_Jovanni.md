# Sprint 4 — GitHub Report — Jovanni

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 4 (Nov 2 – Nov 16, 2026, as in the Sprint 4 Jira report)
- **GitHub username:** Jmaya100
- **Search used:** `is:pr is:merged author:Jmaya100 merged:2026-11-02..2026-11-16`
- **Live site:** https://foodtruck-app-one.vercel.app
- **Report date:** Nov 4, 2026 (late evening; sprint still running, numbers are as of this date and get refreshed at sprint close)

## Pull Requests merged during the sprint

| # | Title | Link | Author | Reviewers | Merged |
|---|---|---|---|---|---|
| 14 | Feature/stripe payments | https://github.com/Unuvert1/FoodtruckApp/pull/14 | Jmaya100 | None recorded on GitHub (merged by Unuvert1, no review comments) | 2026-11-04 (3:44 pm CST) |
| 15 | Show the stop note on the checkout page (FPS-45) | https://github.com/Unuvert1/FoodtruckApp/pull/15 | Jmaya100 | None recorded on GitHub (merged by Unuvert1, no review comments) | 2026-11-04 (3:44 pm CST) |
| 16 | Add Sprint 4 Jira and GitHub reports | https://github.com/Unuvert1/FoodtruckApp/pull/16 | Jmaya100 | Not checked | 2026-11-04 |

**PR contents**

- **#14** — Customers now pay through Stripe (test mode) instead of orders being marked paid automatically (18 files, +764 / −14 lines). Covers Jira tickets FPS-63, FPS-64, and FPS-65, one commit each:
  - **FPS-63:** "Place order" sends the customer to Stripe's payment page, showing their items, tax and tip. All amounts are read from the order saved on the server, never from the browser. The order stays unpaid until Stripe confirms.
  - **FPS-64:** a Stripe webhook (`/api/webhooks/stripe`) marks the order paid. It rejects a missing or wrong signature, ignores an event it has already handled, and accepts a payment only if the Stripe session and the amount match the order. A checkout that expires cancels the unpaid order and gives the pickup time back.
  - **FPS-65:** an unpaid order shows a "Pay to send your order" screen with a Pay button. Right after paying, the page says "Confirming your payment…" and refreshes every few seconds until the webhook arrives. Unpaid orders are not remembered on the customer's device, and the ready alert only applies to paid orders.
  - If no Stripe key is set (local development), orders are still marked paid straight away, as before, so nobody needs a Stripe account to run the app.
  - 18 new unit tests (line items, webhook signature, paid, duplicate, wrong amount, expired). The full suite is now 181 tests, all passing.
- **#15** — The vendor's note for a stop (for example "cash only today") now also shows on the checkout page, not only on the storefront (1 file, +7 lines). Covers FPS-45.
- **#16** — The first versions of the two Sprint 4 reports (documentation only).

## Pending

One more pull request is open from the branch `docs/readme-vercel`, and it is not merged yet at the time of this report. It holds three things: the README update for FPS-61 (live link at the top, payments described as working in test mode, a new "Deploying to Vercel" section with an environment variable table), my Sprint 4 screen recording (`docs/recordings/Sprint4-Jovanni-Recording.mp4`) with its row in the recordings README, and the refresh of these two reports.

## Commit Activity

| Metric | Value |
|---|---|
| Commits on `main` | 3 from me this sprint (PRs #14, #15 and #16, all squash-merged) |
| Commits across merged PRs | 6 (3 in PR #14, 1 in PR #15, 2 in PR #16) |
| Commits authored by me | 6 merged, plus 3 on the pending branch (built with AI assistance) |
| Total number of commits | 6 merged (squash-merged to 3 commits on `main`) |
| Date range | 2026-11-02 – 2026-11-04 (first commit Nov 2, 9:45 pm CST; merged to `main` Nov 4) |
| Direct pushes to `main` | None. All of my work reached `main` through a pull request. |

## My focus this sprint

Getting the app live and taking payments on the customer side. My teammate took the Vercel hosting steps (project, environment variables, database, login, Stripe account and keys) and the vendor side. Jira: seven customer-side tickets (FPS-45, 59, 60, 61, 63, 64, 65; 13 story points). Six are done (12 points); FPS-61 (the README) is written and waits on the pending pull request.

Other work this sprint that does not show up as a merged pull request:

- Planned Sprint 4 with my teammate: set the goal, wrote the tickets with acceptance criteria (FPS-56 to FPS-61 and FPS-63 to FPS-66), and wrote him a summary of what he owns.
- Checked the repository before deploying. No code changes were needed: the build already applies database migrations first, the development login bypass cannot switch on in a deployed build, and the demo-truck button stays hidden unless a setting is added.
- Found that the first Vercel address redirected to Vercel's sign-in page (Deployment Protection), and had my teammate turn it off. The stable address is https://foodtruck-app-one.vercel.app.
- Smoke-tested the customer flow on the live site (FPS-59). The first test order skipped Stripe because the keys were not set yet, which gave free orders. I told my teammate what to add (Stripe secret key, webhook address and signing secret), then checked that the webhook address answered "Invalid signature" instead of "Stripe isn't configured", and that checkout now goes to Stripe's payment page. A payment with Stripe's test card on a phone ended on "Order sent".
- Ran Lighthouse on three live pages (FPS-60): Performance 99 to 100, Accessibility 96 to 100, Best Practices 96 to 100, SEO 100. Sprint 3 on the dev server was Performance 75 and Accessibility 100.
- Recorded the Sprint 4 demo of the payment flow on the live site and moved the finished Jira tickets to Done, with a results comment on FPS-59 and FPS-60.

## Not merged yet / not mine

- My teammate's branch, `feature/sprint-4-pos-sales` (16 commits), was merged on Nov 4 as PR #17: counter sales, "Today's numbers", the schedule rules, the Orders screen, emails, the marketing site and a daily cleanup job. It is his work and is not counted here. He also added a Sprint 4 recording in PR #18.
- FPS-61 (README) is waiting on the pending pull request above.
- Two checks in FPS-59 were not run on the live site: following an order to "ready" on the vendor dashboard, and the ready alert. They need vendor sign-in on the live site, which is FPS-58 (not done yet).
- The live demo data still looks stale (every day shows the same stop, and my test orders are still there). The stop note from FPS-45 did not show on the live checkout page; I have not confirmed whether that stop has a note set. A re-seed of the live database is needed before a final demo.
- Refunds are not built. A paid order that is later cancelled needs a manual refund in the Stripe dashboard for now. The webhook writes a log line when that happens.
