import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookableSlots, getServiceWithLocation, getStorefrontMenu, getTruckFromRequest } from "@/lib/tenant";
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

  const truck = await getTruckFromRequest(truckSlug);
  if (!truck) notFound();

  const now = new Date();
  const found = serviceId ? await getServiceWithLocation(truck.id, serviceId) : null;
  const menu = found ? await getStorefrontMenu(truck.id, found.service.menuId) : null;

  if (!found || !menu || orderingWindow(found.service, now) !== "open") {
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

  const slots = await getBookableSlots(truck.id, found.service.id, now);

  return (
    <CartProvider storageKey={cartStorageKey(truck.slug, found.service.id)}>
      <CheckoutForm truck={truck} service={found.service} location={found.location} menu={menu} slots={slots} />
    </CartProvider>
  );
}
