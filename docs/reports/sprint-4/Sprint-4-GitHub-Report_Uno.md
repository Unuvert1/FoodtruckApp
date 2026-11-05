# Sprint 4 — GitHub Report — Uno

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 4
- **GitHub username:** Unuvert1
- **Report date:** Nov 5, 2026
- **Branch:** `feature/sprint-4-pos-sales`
- **Live site:** https://foodtruck-app-one.vercel.app

## What I worked on

The vendor side again, and this sprint had a theme I did not plan: nearly
everything I touched turned out to be a thing that looked finished and was not.

**The POS was a mock.** Sprint 3 shipped the whole till screen — tiles, the
check, undo, modifiers, cash and change — and its migration added the database
columns for a counter sale. What never got written was the code that saves one.
`COUNTER` appeared exactly once in the entire repository, in a comment in the
schema. Every cash sale a vendor rang up vanished on refresh.

Counter sales now go through `createOrder`, the same single path web orders use,
rather than a second creation function — that rule is what keeps a future SMS or
API order cheap to add. A counter sale skips the ordering window and the slot
reservation, because there is no stop and nobody is waiting for a pickup time,
prices through the same code, and is written already picked up, because the food
is in the customer's hands before it is recorded. Numbers come out `C-1`, `C-2`
from an atomic counter on the truck. They have to: the unique constraint that
stops two orders sharing a number stops applying once there is no stop, since
Postgres treats nulls as distinct.

The part I care about is what happens when saving fails. The check only clears
once the server has the sale, and a second tap while saving cannot charge twice.
Losing a rung-up check at a busy window is the worst thing that screen could do.

**"Repeat next week" was a chore I had built on purpose.** Last sprint I was
pleased with it — three taps, no typing. Watching it in use, it is three taps
*every week, forever*, and most trucks trade the same hours in the same places
anyway. That is a standing arrangement, not a weekly decision.

So it is a rule now: a spot, some weekdays, some hours, and a switch. Real stops
still get written a fortnight ahead, because orders and pickup slots hang off
one, but nobody types them. The detail that took longest is that a rule stores
the wall-clock time and the weekday rather than an instant — store "Tuesdays at
11am" as a timestamp and repeat it every seven days, and your 11am becomes 10am
the week the clocks change, and customers find out before you do.

Running the generator twice has to be harmless, because it runs from the daily
cron *and* every time the Schedule screen opens. A unique pair of rule and date
is what makes the second run do nothing — which also means cancelling one Tuesday
leaves it cancelled, and an edit to one day stands. The generator never
second-guesses a human.

**Two settings switches that did nothing.** Notifications offered cancellations
and a daily summary. Both were stored, displayed and saved, and sent no email.
The form admitted it in its hint text, which is honest, but a settings page
making promises is still worse than not offering them. Both send now — a stop
cancellation reports how many orders went with it, which matters because staff
can cancel too, and the summary goes out for the day that has just ended in the
truck's own timezone, with a guard so running the cron twice cannot send it twice.

**No way to find an order.** The only order list in the app was the queue for
whichever stop was selected. A customer ringing up about order A07 from Saturday
could not be answered. There is an Orders screen now: search by number, name or
phone, filter by date and by online versus at-the-window. The search lives in the
URL so it can be reloaded and sent to whoever else is working.

**A dashboard with nothing on it.** A vendor who just signed up lands on an empty
Service screen. There is a three-step checklist now — a dish, a stop, a first
order — where each step is checked against the database rather than ticked off,
so it cannot disagree with reality, and it stops rendering once all three are true.

**The marketing site.** The product worked and the thing selling it was one page
with a one-line footer. Added pricing, questions, writing and a legal page, then
rebuilt the home page around the stop board. Pricing states the 2.5% that is
already in the schema and says plainly that we are not collecting it yet; the
legal page says there is no terms of service rather than pasting something that
looks like one. No testimonials and no logo wall — made-up social proof does not
belong in work that gets graded.

## Commit activity

| Metric | Value |
|---|---|
| Commits on `feature/sprint-4-pos-sales` | 11 |
| Files changed | 53 |
| Lines added / removed | +3,982 / −490 |
| New files | 25 |
| Database migrations | 3 |
| Tests | 204 passing, up from 181 |

Built with AI assistance.

## Working alongside Jovanni

No conflicts again. He took payments — Stripe Checkout, the webhook, the order
status states — and merged them to `main` as PR #14, with the stop note following
as PR #15. I branched from `main` after both, so there was nothing to rebase.

His Stripe work is good and the fallback in it is the reason the live site kept
working all sprint without keys: with no `STRIPE_SECRET_KEY` the app marks orders
paid on creation instead of failing. That is also what hid from us that payments
were not running in production.

The one thing we overlapped on is deployment. Vercel's free plan has no team
members, so he cannot open the project at all, and three of his tickets depend on
the live site. That is a tooling limit rather than a coordination failure, but it
cost him most of the sprint.

## Bugs found while testing

- **Signing up could 500.** `createTruck` checked whether a web address was taken
  and then created the truck. Two people claiming the same one in the same second
  both get past the check, and the loser hits the unique constraint — a raw error
  page on the first screen a new vendor ever sees.
- **The day's takings were invisible without a stop.** A counter sale belongs to
  no stop, but the Service screen returned its empty state before reading the
  figures. I found this by ringing up a sale and seeing nothing: it had saved
  correctly and there was no screen that would show it.

## Not merged yet

- `feature/sprint-4-pos-sales` is open and not yet merged to `main`.
- The live site is running code from before this branch, so none of the above is
  visible there yet.
- Real Stripe refunds are still not wired. Four TODOs mark where they go, and
  `Order.refundedCents` records what a truck owes rather than moving money.

## What has not been tested

- **Payments have never actually run.** Confirmed rather than assumed: four
  orders on the live site, all with no Stripe session and no payment intent, and
  zero webhook events recorded. The deployment serving traffic predates the
  Stripe environment variables, so every order took the no-Stripe fallback.
- **The real sign-in path still has not run.** The development bypass has been on
  all sprint, so Clerk sign-in and the invite round trip remain unexercised.
- **No email has been sent.** Both new senders are written and neither has
  delivered anything, because no mail provider key is configured.
- **The daily summary needs its migration applied** before it will run at all.
- Phone layout of the orders screen and the marketing pages has not been checked
  on a real device.

## Jira tickets

Done: FPS-56 (Vercel project), FPS-57 (live database), FPS-67 (counter sales),
FPS-68 (today's numbers), FPS-69 (cron), FPS-70 (payments page and dependencies),
FPS-71 (repeating stops), FPS-72 (orders screen), FPS-73 (notification emails),
FPS-74 (setup checklist), FPS-75 (marketing site), FPS-76 (home page), FPS-77 and
FPS-78 (the two bugs above). 32 story points.

In progress: FPS-30 (Vercel hosting) and FPS-66 (Stripe keys and webhook).
Not started: FPS-58 (Clerk on the live site).
