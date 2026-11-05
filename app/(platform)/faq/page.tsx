import Link from "next/link";
import { SiteFooter } from "@/components/platform/site-footer";
import { SiteHeader } from "@/components/platform/site-header";

export const metadata = {
  title: "Questions: FoodtruckApp",
  description: "How stops, pickup times, payments and your team work — answered plainly.",
};

type Group = { heading: string; questions: [string, string][] };

const GROUPS: Group[] = [
  {
    heading: "Getting started",
    questions: [
      [
        "What do I need before I sign up?",
        "A name for your truck and a rough idea of your menu. Setup takes a few minutes: you pick your web address, add your dishes and prices, then put your first stop on the schedule.",
      ],
      [
        "Where does my ordering page live?",
        "At an address you choose when you sign up, so a customer sees your name rather than ours. Share the link, or print it as a QR code and stick it on the truck.",
      ],
      [
        "Do my customers need an account?",
        "No. They pick their food, choose a pickup time, leave a name and phone number, and pay. Nothing to download and nothing to sign up for.",
      ],
    ],
  },
  {
    heading: "Stops and pickup times",
    questions: [
      [
        "How do customers know where I am?",
        "You add a stop — a place, a date, and the hours you're there. Your page shows the next one as the headline, with directions, and lists the rest of the week underneath.",
      ],
      [
        "I park in the same places every week. Do I have to keep typing it in?",
        "No. Set it up once as a repeating stop — a spot, the days, the hours — and switch it on. The stops appear by themselves a fortnight ahead until you switch it off. You can still cancel any single day.",
      ],
      [
        "How do I stop a lunch rush all arriving at once?",
        "Pickup times are handed out in slots. You set how many orders you can make in each one, say six every fifteen minutes. When a slot fills up it disappears from the menu, so the queue spreads itself out.",
      ],
      [
        "What if I have to cancel a stop?",
        "Cancel it from the schedule and every order for that stop is cancelled with it, so nobody walks to a corner you aren't on. You'll see how many customers that affects before you confirm.",
      ],
    ],
  },
  {
    heading: "During service",
    questions: [
      [
        "What happens when I sell out of something?",
        "Tap the dish on your service screen and it greys out on your menu straight away. One thumb, mid-rush, no forms.",
      ],
      [
        "Can I take walk-ups on the same system?",
        "Yes. The till screen has your menu as tiles: ring up the order, take cash or card, and it lands in the same day's totals as the online ones.",
      ],
      [
        "Do I have to mark every order collected?",
        "Only if you want to. An order you've marked ready closes itself half an hour later, so a forgotten tap doesn't leave your screen cluttered the next morning.",
      ],
    ],
  },
  {
    heading: "Money and your team",
    questions: [
      [
        "What does it cost?",
        "Nothing monthly. We take 2.5% of each online order out of your payout, and nothing on sales you ring up at the window.",
      ],
      [
        "How do customers pay?",
        "By card, through Stripe, before they arrive. Card details never touch us or you.",
      ],
      [
        "Can my staff use it without changing my settings?",
        "Yes. Invite them by email and they can work the queue, the till and the sold-out toggles. Changing your prices, tax rate, web address or team stays with owners.",
      ],
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4">
        <section className="pt-10 pb-10 sm:pt-16">
          <h1 className="max-w-[12ch] font-display text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.92] font-extrabold tracking-[-0.01em]">
            Questions, answered.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
            If yours isn&apos;t here, the{" "}
            <Link href="/demo-truck" className="font-semibold text-foreground underline underline-offset-4">
              demo storefront
            </Link>{" "}
            is a real one you can order from.
          </p>
        </section>

        {GROUPS.map((group) => (
          <section key={group.heading} aria-labelledby={`${group.heading.replace(/\s+/g, "-").toLowerCase()}-heading`} className="pt-10">
            <h2
              id={`${group.heading.replace(/\s+/g, "-").toLowerCase()}-heading`}
              className="font-display text-3xl leading-tight font-bold sm:text-4xl"
            >
              {group.heading}
            </h2>
            <div className="mt-4 divide-y divide-border border-y border-border">
              {group.questions.map(([question, answer]) => (
                <details key={question} className="group">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-4 font-semibold outline-none select-none focus-visible:bg-muted/70">
                    {question}
                    <span aria-hidden className="shrink-0 text-xl leading-none text-muted-foreground group-open:hidden">
                      +
                    </span>
                    <span aria-hidden className="hidden shrink-0 text-xl leading-none text-muted-foreground group-open:block">
                      −
                    </span>
                  </summary>
                  <p className="max-w-[44rem] pb-5 leading-relaxed text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <section className="pt-16 pb-4">
          <h2 className="max-w-[18ch] font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
            Still deciding? Try it on one stop.
          </h2>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center rounded-xl bg-foreground px-6 text-base font-semibold text-background hover:bg-foreground/90"
            >
              Set up your truck
            </Link>
            <Link href="/pricing" className="text-base font-semibold underline underline-offset-4">
              See what it costs
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
