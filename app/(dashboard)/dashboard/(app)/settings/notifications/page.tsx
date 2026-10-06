import { NotificationsForm } from "@/components/dashboard/settings/notifications-form";
import { requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Notifications · Settings" };

export default async function NotificationsPage() {
  const { notificationEmail } = await requireTruckAccess();

  return <NotificationsForm notificationEmail={notificationEmail} />;
}
