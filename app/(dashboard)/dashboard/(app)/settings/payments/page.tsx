import { PaymentsStatus } from "@/components/dashboard/settings/payments-status";
import { getPaymentStatus, requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Payments · Settings" };

export default async function PaymentsPage() {
  const { truck } = await requireTruckAccess();

  return <PaymentsStatus status={await getPaymentStatus(truck.id)} />;
}
