import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { Wordmark } from "@/components/platform/wordmark";

export const metadata = {
  title: "FoodtruckApp: preorders for food trucks",
  description: "Your customers see where you're parked, order ahead, and pick a pickup time.",
};

// A sample week for the stop board: the product's core idea, shown instead of described.
const WEEK = [
  { day: "Tue", place: "Riverside Brewing Co.", hours: "5–9 pm", state: "Taking orders" },
  { day: "Wed", place: "Halsted Office Park", hours: "11 am–2 pm", state: "Preorders open" },
  { day: "Fri", place: "Lakeview Night Market", hours: "5–10 pm", state: "Opens Thu 9 am" },
  { day: "Sat", place: "Northfield Farmers Market", hours: "9 am–1 pm", state: "Opens Fri 5 pm" },
];

const FEATURES = [
  {
    title: "Pickup times that can't overbook",
    body: "Set how many orders you can make every 15 minutes. When a time fills up, it disappears from the menu, so the rush arrives spread out instead of all at once.",
  },
  {
    title: "Sold out in one tap",
    body: "Out of carnitas? Tap it on the service screen and it's greyed out on your menu right away, mid-rush, with one thumb.",
  },
  {
    title: "Every order on one screen, plus an email",
    body: "New orders show up in the queue on your tablet or phone, grouped by pickup time. You also get an email for each one.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Wordmark />
        <nav className="flex items-center gap-2">
          <Show when="signed-out">
            <Link href="/sign-in" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-muted">
              Log in
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-muted">
              Open dashboard
            </Link>
          </Show>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 pt-10 pb-12 sm:pt-16">
          <h1 className="max-w-[14ch] font-display text-[clamp(3rem,11vw,6.5rem)] leading-[0.9] font-extrabold tracking-[-0.01em]">
            Preorders for a kitchen that moves.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
            Your customers see where you&apos;re parked today, order ahead, and pick a pickup time. You work the
            line from one screen instead of a crowd at the window.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center rounded-xl bg-foreground px-6 text-base font-semibold text-background hover:bg-foreground/90"
            >
              Set up your truck
            </Link>
            <Link href="/demo-truck" className="text-base font-semibold underline underline-offset-4">
              See a demo storefront
            </Link>
          </div>
        </section>

        {/* The stop board: one truck's week, each stop with its own ordering window. */}
        <section aria-labelledby="board-heading" className="mx-auto max-w-5xl px-4">
          <div className="overflow-hidden rounded-3xl bg-foreground text-background">
            <div className="flex items-baseline justify-between gap-4 px-5 pt-5 pb-3 sm:px-8 sm:pt-7">
              <h2 id="board-heading" className="font-display text-2xl font-bold sm:text-3xl">
                This week&apos;s stops
              </h2>
              <p className="text-sm text-background/60">Comal Taqueria</p>
            </div>
            <ul className="divide-y divide-background/15">
              {WEEK.map((stop) => (
                <li key={stop.day} className="grid grid-cols-[3.25rem_1fr] items-baseline gap-x-3 px-5 py-4 sm:grid-cols-[4.5rem_1fr_auto] sm:px-8">
                  <span className="font-display text-2xl font-bold text-signal sm:text-3xl">{stop.day}</span>
                  <span>
                    <span className="block font-display text-[1.625rem] leading-none font-semibold sm:text-4xl">
                      {stop.place}
                    </span>
                    <span className="mt-1.5 block text-sm text-background/70 tabular-nums sm:text-base">{stop.hours}</span>
                  </span>
                  <span className="col-start-2 mt-2 text-sm font-semibold text-signal sm:col-start-3 sm:mt-0 sm:text-base">
                    {stop.state}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 max-w-[40rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
            Restaurant software assumes one address and fixed hours. Here every stop gets its own ordering
            window, pickup times, and order queue.
          </p>
        </section>

        <section aria-label="Features" className="mx-auto max-w-5xl px-4 pt-16 pb-20">
          <ul className="divide-y divide-border border-y border-border">
            {FEATURES.map((f) => (
              <li key={f.title} className="grid gap-2 py-6 sm:grid-cols-[1fr_1.4fr] sm:gap-10">
                <h3 className="font-display text-2xl leading-tight font-bold">{f.title}</h3>
                <p className="max-w-[36rem] leading-relaxed text-muted-foreground">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-sm text-muted-foreground">
        <p>FoodtruckApp is a class project by two developers.</p>
      </footer>
    </div>
  );
}
