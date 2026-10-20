import { LocationsManager } from "@/components/dashboard/settings/locations-manager";
import { getLocations, requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Locations · Settings" };

export default async function LocationsPage() {
  const { truck } = await requireTruckAccess();
  const locations = await getLocations(truck.id, { includeArchived: true });

  return <LocationsManager locations={locations} />;
}
