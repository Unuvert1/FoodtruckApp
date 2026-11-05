import Link from "next/link";
import { SiteFooter } from "@/components/platform/site-footer";
import { SiteHeader } from "@/components/platform/site-header";

export const metadata = {
  title: "Pricing: FoodtruckApp",
  description: "Free to set up. 2.5% of each online order. Sales you ring up at the window are free.",
};

const INCLUDED = [
  ["Your own ordering page", "A storefront at your own address, in your colours, with your menu and photos."],
  ["Stops and pickup times", "Schedule where you'll be, set how many orders you can make per slot, and let it repeat every week."],
  ["The service screen", "Every order on one screen as it comes in, grouped by pickup time, with a sold-out toggle per dish."],
  ["A till for the window", "Ring up walk-ups on the same menu. Those sales land in the same day's numbers."],
  ["Your team", "Invite staff by email. They work the queue; only owners change settings or money."],
];

const COMMON = [
  ["Is there a monthly fee?", "No. You pay nothing to set up and nothing to keep the page running."],
  ["What about cash at the window?", "Free. The fee only applies to orders customers place online."],
  ["Can I leave?", "Yes, whenever. Your menu and stops are yours; there is no contract or notice period."],
];

export default function PricingPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5">
        <section className="pt-10 pb-12 sm:pt-16">
          <h1 className="max-w-[16ch] font-display text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.92] font-extrabold tracking-[-0.01em]">
            You only pay when you sell.
          </h1>
          <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-muted-foreground">
            There is no monthly bill and no setup fee. We take a share of each order a customer places online, and
            nothing at all on the ones you ring up yourself.
          </p>
        </section>

        {/* The one bold moment on this page: the number, not a grid of plans. */}
        <section aria-labelledby="rate-heading" className="overflow-hidden rounded-3xl bg-foreground text-background">
          <div className="grid gap-8 px-5 py-9 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-12 sm:px-10 sm:py-12">
            <p className="font-display text-[clamp(5rem,20vw,9rem)] leading-[0.82] font-extrabold tracking-[-0.03em] text-signal">
              2.5<span className="text-[0.45em] align-super">%</span>
            </p>
            <div>
              <h2 id="rate-heading" className="font-display text-3xl leading-tight font-bold sm:text-4xl">
                of each online order
              </h2>
              <p className="mt-3 max-w-[30rem] leading-relaxed text-background/75">
                Taken out of your payout, not added to what the customer pays. On a $14 burrito that is 35 cents.
              </p>
              <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-background/20 pt-5 text-[0.9375rem] sm:grid-cols-2">
                <div className="flex justify-between gap-4 sm:block">
                  <dt className="text-background/70">Monthly fee</dt>
                  <dd className="font-semibold sm:mt-0.5">None</dd>
                </div>
                <div className="flex justify-between gap-4 sm:block">
                  <dt className="text-background/70">Counter sales</dt>
                  <dd className="font-semibold sm:mt-0.5">Free</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <p className="mt-4 max-w-[44rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
          Being straight with you: we are not collecting this yet. Card payments currently settle to our own Stripe
          account, and connecting each truck&apos;s account for direct payouts is the next thing we are building.
          Until that lands, you are not charged anything.
        </p>

        <section aria-labelledby="included-heading" className="pt-16">
          <h2 id="included-heading" className="font-display text-3xl leading-tight font-bold sm:text-4xl">
            What you get for it
          </h2>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {INCLUDED.map(([title, body]) => (
              <li key={title} className="grid gap-1.5 py-5 sm:grid-cols-[1fr_1.5fr] sm:gap-10">
                <h3 className="font-semibold">{title}</h3>
                <p className="max-w-[36rem] leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="common-heading" className="pt-16">
          <h2 id="common-heading" className="font-display text-3xl leading-tight font-bold sm:text-4xl">
            Asked often
          </h2>
          <dl className="mt-6 divide-y divide-border border-y border-border">
            {COMMON.map(([q, a]) => (
              <div key={q} className="grid gap-1.5 py-5 sm:grid-cols-[1fr_1.5fr] sm:gap-10">
                <dt className="font-semibold">{q}</dt>
                <dd className="max-w-[36rem] leading-relaxed text-muted-foreground">{a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-[0.9375rem]">
            <Link href="/faq" className="font-semibold underline underline-offset-4">
              Read the rest of the questions
            </Link>
          </p>
        </section>

        <section className="pt-16 pb-4">
          <h2 className="max-w-[18ch] font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
            Put your truck on the map this week.
          </h2>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
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
      </main>

      <SiteFooter />
    </div>
  );
}
