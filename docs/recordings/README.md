# Recordings

Screen recordings of the app, one per sprint. They are the quickest way to see
what a sprint actually produced without cloning and running anything.

| Sprint | File | Recorded by |
|---|---|---|
| Sprint 4 | [Sprint4-Unubileg-Recording.mp4](Sprint4-Unubileg-Recording.mp4) | Unubileg |
| Sprint 3 | [Sprint3-Unubileg-Recording.mp4](Sprint3-Unubileg-Recording.mp4) | Unubileg |

## Sprint 4

The marketing site, the customer storefront, and the vendor side with the two
things Sprint 3 left unfinished now working.

The parts worth watching: the Schedule screen's repeating stops, where switching
one rule on fills the calendar a fortnight ahead and switching it off clears what
nobody has booked; and the POS, where a cash sale now survives a refresh and
appears in the day's figures. Before this sprint it vanished.

Also shown: the new Orders screen, which can find a past order by number, name or
phone — the first time the app could answer "where is A07 from Saturday".

Recorded against the production database, so the stops and the earlier counter
sales in it are real rows. Payments are not shown: Stripe is configured on the
deployed site but not in local development, so orders there are marked paid
without being charged.

## Sprint 3

A walkthrough of the vendor side: the customer storefront, the service queue, the
new Schedule screen, POS, and the settings area.

The Schedule screen is the thing worth watching — before this sprint a vendor had
no way to add a stop at all, and every stop in the app came from a seed script.

Two things the recording does not show, because they are not built: POS completes
a sale on screen but saves nothing, and the app is not yet deployed.

## Adding one

Drop the file in this folder, add a row to the table, and write a couple of lines
on what it shows. Keep files under 100 MB — that is GitHub's hard limit for a
normal file, and anything over 50 MB gets a warning. If a recording is bigger than
that, re-export it smaller rather than adding it with Git LFS, which brings its own
storage quota.
