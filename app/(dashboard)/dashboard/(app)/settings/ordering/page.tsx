import { OrderingForm } from "@/components/dashboard/settings/ordering-form";
import { getOrderingDefaults, requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Ordering · Settings" };

export default async function OrderingPage() {
  const { truck } = await requireTruckAccess();
  const defaults = await getOrderingDefaults(truck.id);
  const timezones = Intl.supportedValuesOf("timeZone");
  // A zone saved before this list existed must still show as selected.
  if (!timezones.includes(defaults.timezone)) timezones.unshift(defaults.timezone);

  return <OrderingForm defaults={defaults} timezones={timezones} />;
}
