import { FieldRow } from "@/components/dashboard/settings/field-row";
import { Section } from "@/components/dashboard/settings/section";
import type { PaymentsMode } from "@/lib/types";

const BADGE = {
  live: { label: "On", className: "bg-ok text-white" },
  test: { label: "On · test mode", className: "bg-signal text-signal-foreground" },
  off: { label: "Off", className: "bg-muted text-muted-foreground" },
} satisfies Record<PaymentsMode, { label: string; className: string }>;

const EXPLAINER: Record<PaymentsMode, string> = {
  live: "Customers pay by card at checkout. Real money moves.",
  test: "Customers pay by card at checkout, against Stripe's test keys. Use card 4242 4242 4242 4242 — no real money moves.",
  off: "No Stripe keys are set on this server, so orders are marked paid the moment they are placed and nobody is charged.",
};

export function PaymentsStatus({ mode }: { mode: PaymentsMode }) {
  const badge = BADGE[mode];

  return (
    <Section title="Payments" description="How customers pay you.">
      <FieldRow label="Card payments" hint={EXPLAINER[mode]}>
        <span className={`mt-2.5 inline-flex h-7 items-center rounded-full px-3 text-xs font-bold ${badge.className}`}>
          {badge.label}
        </span>
      </FieldRow>
      <FieldRow label="How it works">
        <p className="pt-3 text-sm text-muted-foreground">
          Checkout sends the customer to Stripe. An order only becomes paid when Stripe tells us so, not when the
          customer&apos;s browser comes back — so a closed tab or a flaky connection can&apos;t lose a sale. An
          abandoned checkout releases its pickup slot automatically.
        </p>
      </FieldRow>
      <FieldRow label="Counter sales">
        <p className="pt-3 text-sm text-muted-foreground">
          Cash and card taken at the window go through the POS and are recorded as paid there. Stripe is not involved.
        </p>
      </FieldRow>
      <FieldRow label="Payouts">
        <p className="pt-3 text-sm text-muted-foreground">
          Card payments currently settle to the platform&apos;s Stripe account. Connecting each truck&apos;s own
          account for direct payouts is a later step.
        </p>
      </FieldRow>
    </Section>
  );
}
