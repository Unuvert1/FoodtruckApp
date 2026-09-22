import { notFound } from "next/navigation";
import type { Location } from "@/lib/types";
import { getBookableSlots, getLocation, getMenu, getTruckBySlug, getUpcomingServices } from "@/lib/mock-data";
import { cartStorageKey } from "@/lib/cart";
import { orderingWindow, pickDefaultService } from "@/lib/service";
import { formatWhen } from "@/lib/time";
import { CartProvider } from "@/components/storefront/cart-provider";
import { MenuList } from "@/components/storefront/menu-list";
import { OrderBar } from "@/components/storefront/order-bar";
import { ServiceHero } from "@/components/storefront/service-hero";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { UpcomingServices } from "@/components/storefront/upcoming-services";

// Depends on the current time (what's open, which slots remain), so never prerender.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ truckSlug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export default async function StorefrontPage({ params, searchParams }: Props) {
  const { truckSlug } = await params;
  const { service: serviceParam } = await searchParams;

  const truck = getTruckBySlug(truckSlug);
  if (!truck) notFound();

  const now = new Date();
  const services = getUpcomingServices(truck.id, now);
  const selected = services.find((s) => s.id === serviceParam) ?? pickDefaultService(services, now);

  if (!selected) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">{truck.name}</h1>
        <p className="mt-3 text-muted-foreground">
          No upcoming stops are scheduled yet. Check back soon to see where the truck will be next.
        </p>
      </main>
    );
  }

  const locations: Record<string, Location> = {};
  for (const s of services) {
    const location = getLocation(s.locationId);
    if (location) locations[s.locationId] = location;
  }
  const menu = getMenu(selected.menuId);
  if (!menu) notFound();

  const window = orderingWindow(selected, now);
  const closedReason =
    window === "not-yet"
      ? `Preorders for this stop open ${formatWhen(selected.orderingOpensAt, truck.timezone, now)}.`
      : window === "closed"
        ? "Online ordering has closed for this stop."
        : null;

  return (
    <CartProvider storageKey={cartStorageKey(truck.slug, selected.id)}>
      <main className="pb-28">
        <ServiceHero
          truck={truck}
          service={selected}
          location={locations[selected.locationId]}
          firstSlot={getBookableSlots(selected, now)[0]}
          now={now}
        />
        <UpcomingServices
          truck={truck}
          services={services}
          locations={locations}
          selectedId={selected.id}
          now={now}
        />
        <MenuList menu={menu} canOrder={window === "open"} closedReason={closedReason} />
        <StorefrontFooter truck={truck} />
      </main>
      <OrderBar menu={menu} checkoutHref={`/${truck.slug}/checkout?service=${selected.id}`} />
    </CartProvider>
  );
}
