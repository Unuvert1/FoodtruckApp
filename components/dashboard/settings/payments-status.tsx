import { Button } from "@/components/ui/button";
import { FieldRow } from "@/components/dashboard/settings/field-row";
import { Section } from "@/components/dashboard/settings/section";
import type { PaymentStatus } from "@/lib/types";

function statusOf({ accountId, onboarded }: PaymentStatus) {
  if (!accountId) return { label: "Not connected", className: "bg-muted text-muted-foreground" };
  if (!onboarded) return { label: "Setup incomplete", className: "bg-signal text-signal-foreground" };
  return { label: "Connected", className: "bg-ok text-white" };
}

export function PaymentsStatus({ status }: { status: PaymentStatus }) {
  const { label, className } = statusOf(status);

  return (
    <Section title="Payments" description="How customers pay you and how you get paid.">
      <FieldRow label="Stripe status">
        <span className={`mt-2.5 inline-flex h-7 items-center rounded-full px-3 text-xs font-bold ${className}`}>{label}</span>
      </FieldRow>
      <FieldRow label="Connect Stripe" hint="Orders are marked paid on creation until Stripe is wired up.">
        {/* TODO(stream C): start Stripe Connect onboarding here (create the account, redirect to the onboarding link). */}
        <Button type="button" disabled className="h-12 rounded-xl px-5 text-base font-semibold">
          Connect Stripe
        </Button>
      </FieldRow>
      <FieldRow label="Payouts">
        <p className="pt-3 text-sm text-muted-foreground">Your payout account and schedule are managed in Stripe, not here.</p>
      </FieldRow>
    </Section>
  );
}
