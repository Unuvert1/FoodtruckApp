import { NotificationsForm } from "@/components/dashboard/settings/notifications-form";
import { getTruckSettings, requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Notifications · Settings" };

export default async function NotificationsPage() {
  const { truck } = await requireTruckAccess();
  const settings = await getTruckSettings(truck.id);

  return (
    <NotificationsForm
      notificationEmail={settings.notificationEmail}
      notifyNewOrder={settings.notifyNewOrder}
      notifyCancellation={settings.notifyCancellation}
      notifyDailySummary={settings.notifyDailySummary}
    />
  );
}
