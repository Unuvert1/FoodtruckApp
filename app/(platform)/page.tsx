import Link from "next/link";
import { SiteFooter } from "@/components/platform/site-footer";
import { SiteHeader } from "@/components/platform/site-header";
import { StopBoard } from "@/components/platform/stop-board";

export const metadata = {
  title: "FoodtruckApp: preorders for food trucks",
  description: "Your customers see where you're parked, order ahead, and pick a pickup time.",
};

const FEATURES = [
  {
    title: "Pickup times that can't overbook",
    body: "Set how many orders you can make every 15 minutes. When a time fills up it disappears from the menu, so the rush arrives spread out instead of all at once.",
  },
  {
    title: "Sold out in one tap",
    body: "Out of carnitas? Tap it on the service screen and it's greyed out on your menu right away, mid-rush, with one thumb.",
  },
  {
    title: "Every order on one screen, plus an email",
    body: "New orders land in the queue on your tablet or phone, grouped by pickup time. You get an email for each one too.",
  },
];

const STEPS = [
  { title: "Add your menu", body: "Dishes, prices and the choices that go with them. Photos if you have them." },
  { title: "Put a stop on the schedule", body: "Where you'll be and when. Set it to repeat and your week fills itself in." },
  { title: "Share your link", body: "Print it as a QR code for the truck. Orders land on your service screen." },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main>
        {/* Type on the left, the product's actual idea on the right. */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-14 pb-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pt-20 lg:pb-24">
          <div>
            <p className="flex items-center gap-2.5 text-sm font-semibold text-muted-foreground">
              <span aria-hidden className="h-px w-8 bg-signal" />
              Preordering for food trucks
            </p>

            <h1 className="mt-5 max-w-[11ch] font-display text-[clamp(3.25rem,9.5vw,6rem)] leading-[0.88] font-extrabold tracking-[-0.015em]">
              A kitchen that moves.
            </h1>

            <p className="mt-6 max-w-[33ch] text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Your customers see where you&apos;re parked today, order ahead, and pick a time. You work the line from
              one screen instead of a crowd at the window.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/sign-up"
                className="inline-flex h-13 items-center rounded-full bg-foreground px-7 text-base font-semibold text-background outline-none hover:bg-foreground/90 focus-visible:ring-4 focus-visible:ring-foreground/25"
              >
                Set up your truck
              </Link>
              <Link
                href="/demo-truck"
                className="rounded-sm text-base font-semibold underline decoration-signal decoration-2 underline-offset-[6px] outline-none hover:decoration-foreground focus-visible:ring-4 focus-visible:ring-foreground/25"
              >
                See a demo storefront
              </Link>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">No monthly fee. 2.5% when you sell. Free at the window.</p>
          </div>

          <StopBoard />
        </section>

        {/* The claim the board makes, said once in words. */}
        <section className="mx-auto max-w-6xl px-5">
          <p className="max-w-[52ch] border-t border-border pt-7 text-xl leading-relaxed sm:text-2xl">
            Restaurant software assumes one address and fixed hours.{" "}
            <span className="text-muted-foreground">
              Here every stop gets its own ordering window, pickup times and order queue.
            </span>
          </p>
        </section>

        <section aria-labelledby="features-heading" className="mx-auto max-w-6xl px-5 pt-20">
          <h2 id="features-heading" className="sr-only">
            What it does
          </h2>
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <span aria-hidden className="block h-1 w-10 rounded-full bg-signal" />
                <h3 className="mt-4 font-display text-[1.625rem] leading-[1.1] font-bold tracking-[-0.01em]">
                  {f.title}
                </h3>
                <p className="mt-2.5 leading-relaxed text-muted-foreground">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Genuinely a sequence, so it is numbered. */}
        <section aria-labelledby="steps-heading" className="mx-auto max-w-6xl px-5 pt-20">
          <h2 id="steps-heading" className="font-display text-[clamp(2rem,4.5vw,3rem)] leading-[0.95] font-extrabold tracking-[-0.015em]">
            Trading by the weekend
          </h2>
          <ol className="mt-8 divide-y divide-border border-y border-border">
            {STEPS.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-5 py-6 sm:grid-cols-[3rem_1fr_1.6fr] sm:gap-x-10">
                <span className="font-display text-3xl leading-none font-extrabold text-signal sm:text-4xl">
                  {i + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="col-start-2 mt-1.5 max-w-[40ch] leading-relaxed text-muted-foreground sm:col-start-3 sm:mt-0">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 pt-20">
          <div className="rounded-[1.75rem] bg-foreground px-6 py-12 text-background sm:px-12 sm:py-16">
            <h2 className="max-w-[15ch] font-display text-[clamp(2.25rem,6vw,4rem)] leading-[0.92] font-extrabold tracking-[-0.015em]">
              Put your truck on the map this week.
            </h2>
            <p className="mt-5 max-w-[42ch] leading-relaxed text-background/70">
              Setting up takes a few minutes and costs nothing. You only pay when a customer orders.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/sign-up"
                className="inline-flex h-13 items-center rounded-full bg-signal px-7 text-base font-semibold text-signal-foreground outline-none hover:bg-signal/90 focus-visible:ring-4 focus-visible:ring-signal/40"
              >
                Set up your truck
              </Link>
              <Link
                href="/pricing"
                className="rounded-sm text-base font-semibold text-background underline underline-offset-[6px] outline-none hover:text-signal focus-visible:ring-4 focus-visible:ring-background/30"
              >
                See what it costs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
