import { PaymentsStatus } from "@/components/dashboard/settings/payments-status";
import { paymentsMode } from "@/lib/stripe";
import { requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Payments · Settings" };

export default async function PaymentsPage() {
  // Nothing tenant-scoped to read: Stripe is configured per server, not per
  // truck, until each truck connects its own account.
  await requireTruckAccess();

  return <PaymentsStatus mode={paymentsMode()} />;
}
