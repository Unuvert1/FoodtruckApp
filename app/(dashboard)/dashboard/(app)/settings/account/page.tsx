import { AccountSection } from "@/components/dashboard/settings/account-section";
import { DEV_AUTH_BYPASS, getUserEmail } from "@/lib/dev-auth";
import { backfillMembershipEmail, requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Your account · Settings" };

// The one settings page staff can open: it is about the signed-in person, so it
// sits outside the owner-only (owner) group and touches nothing but their own membership.
export default async function AccountPage() {
  const { truck, role, userId } = await requireTruckAccess();
  const email = await getUserEmail();
  // Members from before emails were stored show up in the team list by id; this fixes them as they visit.
  if (email) await backfillMembershipEmail(truck.id, userId, email);

  return <AccountSection email={email} truckName={truck.name} role={role} devBypass={DEV_AUTH_BYPASS} />;
}
