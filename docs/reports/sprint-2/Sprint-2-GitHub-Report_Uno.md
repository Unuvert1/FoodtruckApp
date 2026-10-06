# Sprint 2 — GitHub Report — Uno

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 2 (Oct 1 – Oct 15, 2026)
- **GitHub username:** Unuvert1
- **Report date:** Oct 6, 2026 (sprint still active; numbers are as of this date)

## What I worked on

The vendor side. Sprint 1 left the dashboard working but plain, so this sprint
was about making it something you could actually use during a service.

**Dish photos.** Vendors can now add a photo to a menu item, and it shows up on
the customer menu. Photos are shrunk in the browser before upload and stored in
the database, so it works the same locally and once we deploy, without signing
up for an image host.

**Menu editing.** Tapping a row opens the editor instead of hunting for an Edit
button, and marking something sold out is now a switch on the row itself. It
used to be a checkbox buried inside the edit panel, which is no good mid-rush.

**The Service screen.** This was the biggest piece. It was one long list grouped
by pickup time and it felt cluttered, so it is now three zones — New, Cooking,
Ready — based on what each order needs you to do. New orders are green and
pulse, and the Service tab pulses from anywhere in the dashboard so you notice
an order coming in while you are on another tab.

**Order status.** Found a real bug here: accepting an order changed nothing on
the customer's screen, because "paid" and "accepted" were the same step. The
customer now sees four separate steps, and the page checks for updates faster
while they are waiting. Also removed the extra "Start" tap — Accept goes
straight to cooking now — and orders left on Ready close themselves after 30
minutes.

**Order detail.** A page per order with the items listed out, totals,
timestamps, call/text buttons, and a way to remove an item with a reason.
Refunds are recorded but not actually charged, since payments are not built.

**Settings.** Went from one thin page to eight sections that all save: truck
profile, branding, locations, ordering defaults, tax, payments status,
notifications, and team.

**POS.** A till screen for walk-up orders, with the check on the left and
coloured dish buttons on the right. It is UI only this sprint — nothing is
saved yet.

**Schedule.** The backend is in (address lookup, pickup slot generation), but
the screen itself is still a placeholder.

## Commit activity

| Metric | Value |
|---|---|
| Commits on `feature/sprint-2` | 12 |
| Files changed | 107 |
| Lines added / removed | +5,616 / −487 |
| Database migrations | 4 |
| First commit | 2026-10-05 |
| Last commit | 2026-10-06 |

Built with AI assistance.

## Merging with Jovanni's work

His PR #7 merged first, then I rebased my branch on top of it. Seven files had
been changed by both of us — we had both independently added menu photos to the
customer side. His version stayed and mine was dropped, since his was already on
`main` and the customer side is his area. My vendor-side upload pipeline feeds
into it.

## Not merged yet

- My branch (`feature/sprint-2`) is still open and not yet merged to `main`.
- The Schedule screen is a placeholder.
- POS sales are not saved anywhere yet.
- Carried to next sprint: FPS-30 (Vercel hosting) and FPS-37 (Schedule screen).

## Jira tickets

Done: FPS-25 (dish photos + menu rework), FPS-26 (service screen + customer
order status), FPS-27 (settings and locations), FPS-28 (schedule groundwork),
FPS-36 (POS). 21 story points.

Carried over: FPS-30 (Vercel), FPS-37 (Schedule screen). 6 story points.
