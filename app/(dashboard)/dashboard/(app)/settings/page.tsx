import { redirect } from "next/navigation";
import { requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { role } = await requireTruckAccess();
  redirect(role === "OWNER" ? "/dashboard/settings/profile" : "/dashboard/settings/account");
}
