# Sprint 3 — GitHub Report — Uno

- **Repository:** https://github.com/Unuvert1/FoodtruckApp
- **Sprint:** Sprint 3
- **GitHub username:** Unuvert1
- **Report date:** Oct 20, 2026
- **Branch:** `feature/sprint-3`

## What I worked on

The vendor side again, but this sprint was less about how it looks and more about
things the app genuinely could not do.

**The Schedule screen.** This was the point of the sprint. Until now a vendor
could not create a stop at all — the seed script was the only thing in the whole
codebase that wrote one, so the schedule could only be changed by a developer
running a command. Since everything in this app hangs off a stop, that is also
why the site went quiet when we came back after two weeks: the seeded stops had
expired and there was nothing left to show.

So I built the write path first — creating, editing, publishing and cancelling a
stop — and then the screen on top of it. Adding a stop is one form, not a wizard,
and every field starts filled in from the last stop, because a truck that trades
the same hours every week should not have to retype them. The piece I care most
about is Repeat: it opens the form a week later with everything already there, so
keeping a weekly route up to date is three taps and no typing.

The hard part was not the form. It was what happens when a vendor edits a stop
that customers have already ordered from. If someone shortens a stop past a slot
that has orders in it, the save is refused outright and the message names the
time: "Two orders are already booked for 6:15 pm." Cancelling a stop now also
cancels those customers' orders and gives their pickup slots back. Before this,
nothing did — a customer would have sat watching a countdown to a pickup that was
never going to happen.

**A security hole in Settings.** Eight of the ten settings actions never checked
whether the person was an owner. Only the two team ones did. The navigation hid
links from staff, but hiding a link is not a permission — a staff member could
still change the storefront address, which breaks every link and QR code we have
handed out, or change the sales tax charged to real customers. All ten are locked
now, and so are the five schedule actions, which turned out to write the same
rows through a different door.

**Settings, filled in.** Team invites by email, with an accept link that expires
and cannot be reused — previously there was simply no way to add anyone to a
truck. A "Your account" section, which is the one thing staff can see. Per-event
notification toggles with a button that sends a real test email, so a vendor finds
out their address is wrong now rather than during a lunch rush. And a danger zone
that closes a truck without deleting anything.

**Saved spots.** These used to need a pasted Google Maps link to get coordinates.
That was a stand-in from before we had a geocoder. It now uses the same address
autocomplete as the Schedule screen, sharing one component between both.

**POS.** The grid was a fixed number of columns no matter how many dishes were in
the category, so four dishes left most of the screen empty. Density now follows
the number of dishes. One thing I checked rather than changed: it was already
showing every dish from every section, so that part needed no work.

## Commit activity

| Metric | Value |
|---|---|
| Commits on `feature/sprint-3` | 6 |
| Files changed | 63 |
| Lines added / removed | +3,724 / −318 |
| New files | 19 |
| Database migrations | 1 |
| Tests | 137 passing, up from 101 |

Built with AI assistance.

## Working alongside Jovanni

No conflicts this sprint. He worked on the customer storefront and I worked on the
vendor dashboard, and the file lists did not overlap at all. His `feature/customer-polish`
branch merged into `main` as PR #9 before I started, so I branched from that
rather than rebasing afterwards.

One thing to sort out between us: I rendered the stop note on the storefront hero
while wiring up the schedule, and that is FPS-45, which is his ticket. I left his
ticket alone and flagged it rather than claiming it.

## Not merged yet

- `feature/sprint-3` is open and not yet merged to `main`.
- POS still records nothing. Tapping Charge completes the flow on screen but no
  sale is saved. The database columns for it went in with this sprint's migration,
  so the remaining work is the code, not the schema.
- The "today's numbers" summary was planned and not built.
- Vercel hosting is prepared but not deployed.
- Cancellation and daily-summary emails have switches but do not send yet, and
  the form says so rather than implying otherwise.

## What has not been tested

Worth stating plainly rather than leaving for someone to discover:

- The real sign-in path has never run. The development login bypass has been on
  all sprint, so Clerk sign-in, sign-out and the invite round trip are unexercised.
- No email has actually been sent. The invite email and the test-email button are
  written but no mail provider key is configured here.
- The phone layout of the new screens has not been looked at, only written
  mobile-first.

## Jira tickets

Done: FPS-37 (schedule screen), FPS-47 (schedule write path), FPS-48 (settings
lock), FPS-49 (saved spots), FPS-50 (team invites), FPS-51 (your account),
FPS-52 (notifications), FPS-53 (danger zone), FPS-54 (POS), FPS-55 (directions and
attribution). 31 story points.

In progress: FPS-30 (Vercel hosting), 3 points — prepared, not deployed.
