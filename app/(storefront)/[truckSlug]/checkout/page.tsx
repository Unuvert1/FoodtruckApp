import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookableSlots, getLocation, getMenu, getTruckBySlug, getUpcomingServices } from "@/lib/mock-data";
import { cartStorageKey } from "@/lib/cart";
import { orderingWindow } from "@/lib/service";
import { CartProvider } from "@/components/storefront/cart-provider";
import { CheckoutForm } from "@/components/storefront/checkout-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ truckSlug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { truckSlug } = await params;
  const { service: serviceId } = await searchParams;

  const truck = getTruckBySlug(truckSlug);
  if (!truck) notFound();

  const now = new Date();
  const service = getUpcomingServices(truck.id, now).find((s) => s.id === serviceId);
  const location = service && getLocation(service.locationId);
  const menu = service && getMenu(service.menuId);

  if (!service || !location || !menu || orderingWindow(service, now) !== "open") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">Ordering isn&apos;t open for this stop</h1>
        <p className="mt-3 text-muted-foreground">
          It may have closed, or the link is out of date. Pick another stop to order from.
        </p>
        <Link href={`/${truck.slug}`} className="mt-6 inline-block font-semibold text-brand underline underline-offset-4">
          See upcoming stops
        </Link>
      </main>
    );
  }

  return (
    <CartProvider storageKey={cartStorageKey(truck.slug, service.id)}>
      <CheckoutForm truck={truck} service={service} location={location} menu={menu} slots={getBookableSlots(service, now)} />
    </CartProvider>
  );
}
