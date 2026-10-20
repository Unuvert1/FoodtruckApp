import { redirect } from "next/navigation";
import { requireTruckAccess } from "@/lib/tenant";

// Every section in this group changes the business, so it is owner-only.
// Staff land on the one section that is theirs. (Each action re-checks the
// role: a layout is a gate for pages, not a permission.)
export default async function OwnerSettingsLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireTruckAccess();
  if (role !== "OWNER") redirect("/dashboard/settings/account");
  return children;
}
