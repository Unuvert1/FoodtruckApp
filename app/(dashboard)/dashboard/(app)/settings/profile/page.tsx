import { ProfileForm } from "@/components/dashboard/settings/profile-form";
import { getTruckSettings, requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Truck profile · Settings" };

export default async function ProfilePage() {
  const { truck } = await requireTruckAccess();
  const settings = await getTruckSettings(truck.id);
  const appHost = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/^https?:\/\//, "");

  return (
    <ProfileForm
      name={settings.name}
      tagline={settings.tagline}
      logoUrl={settings.logoUrl}
      slug={settings.slug}
      customDomain={settings.customDomain}
      appHost={appHost}
    />
  );
}
