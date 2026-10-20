import { StorefrontForm } from "@/components/dashboard/settings/storefront-form";
import { getTruckSettings, requireTruckAccess } from "@/lib/tenant";

export const metadata = { title: "Storefront · Settings" };

export default async function StorefrontPage() {
  const { truck } = await requireTruckAccess();
  const s = await getTruckSettings(truck.id);

  return (
    <StorefrontForm
      brandColor={s.brandColor}
      brandColorForeground={s.brandColorForeground}
      heroImageUrl={s.heroImageUrl}
      name={s.name}
      tagline={s.tagline}
      logoUrl={s.logoUrl}
      slug={s.slug}
    />
  );
}
