import { TaxesForm } from "@/components/dashboard/settings/taxes-form";
import { getTruckSettings, requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Taxes & fees · Settings" };

export default async function TaxesPage() {
  const { truck } = await requireTruckAccess();
  const { taxRateBps, platformFeeBps } = await getTruckSettings(truck.id);

  return <TaxesForm taxRateBps={taxRateBps} platformFeeBps={platformFeeBps} />;
}
