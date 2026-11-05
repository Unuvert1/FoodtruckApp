import Link from "next/link";
import { SiteFooter } from "@/components/platform/site-footer";
import { SiteHeader } from "@/components/platform/site-header";

export const metadata = {
  title: "Terms and privacy: FoodtruckApp",
  description: "What this project is, what it stores, and why there is no legal text here yet.",
};

const STORED = [
  ["Your truck", "Its name, web address, timezone, menu, prices, photos, spots and stops."],
  ["Your account", "Handled by Clerk. We keep your user id and the email address notifications go to."],
  ["Orders", "The customer's name, phone number, what they ordered and what it cost, kept as a snapshot."],
  ["Payments", "Handled by Stripe. Card numbers never reach our servers or yours."],
];

export default function LegalPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4">
        <section className="pt-10 pb-8 sm:pt-16">
          <h1 className="max-w-[16ch] font-display text-[clamp(2.5rem,8vw,4.75rem)] leading-[0.94] font-extrabold tracking-[-0.01em]">
            Terms and privacy
          </h1>
        </section>

        <div className="max-w-[38rem] border-t border-border pt-8">
          <p className="text-[1.0625rem] leading-[1.7]">
            There is no terms of service or privacy policy here, and we are not going to paste in something that
            looks like one. Those are legal documents, and neither of us is a lawyer. FoodtruckApp is a university
            project built by two developers, not a company you can enter a contract with.
          </p>
          <p className="mt-5 text-[1.0625rem] leading-[1.7]">
            What we can tell you honestly is what the software does with data, because we wrote all of it.
          </p>

          <h2 className="mt-10 font-display text-[1.75rem] leading-tight font-bold sm:text-[2rem]">What it stores</h2>
          <dl className="mt-5 divide-y divide-border border-y border-border">
            {STORED.map(([title, body]) => (
              <div key={title} className="grid gap-1 py-4">
                <dt className="font-semibold">{title}</dt>
                <dd className="leading-relaxed text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-10 font-display text-[1.75rem] leading-tight font-bold sm:text-[2rem]">
            What it doesn&apos;t do
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-[1.7]">
            There is no advertising, no tracking pixels, and nothing is sold or shared with anyone. One truck&apos;s
            data is never readable by another: every record belongs to a truck, and every query is scoped to the
            truck you are signed in to.
          </p>

          <h2 className="mt-10 font-display text-[1.75rem] leading-tight font-bold sm:text-[2rem]">
            Before you use it for real
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-[1.7]">
            Treat it as a working prototype. If you run a real truck on it, keep your own record of your sales, and
            do not rely on it for anything you would be unable to reconstruct.
          </p>

          <p className="mt-8 text-[0.9375rem]">
            <Link href="/faq" className="font-semibold underline underline-offset-4">
              Back to the questions
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
