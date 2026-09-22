import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderForCustomer, getTruckFromRequest } from "@/lib/tenant";
import { AutoRefresh } from "@/components/auto-refresh";
import { OrderStatus } from "@/components/storefront/order-status";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ truckSlug: string; orderId: string }>;
};

export default async function OrderPage({ params }: Props) {
  const { truckSlug, orderId } = await params;
  const truck = await getTruckFromRequest(truckSlug);
  if (!truck) notFound();

  const found = await getOrderForCustomer(truck.id, orderId);
  if (!found) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">We can&apos;t find that order</h1>
        <p className="mt-3 text-muted-foreground">
          Check the link, or ask at the window. They can look it up by your name.
        </p>
        <Link href={`/${truck.slug}`} className="mt-6 inline-block font-semibold text-brand underline underline-offset-4">
          Back to {truck.name}
        </Link>
      </main>
    );
  }

  const done = found.order.status === "PICKED_UP" || found.order.status === "CANCELLED";

  return (
    <>
      <OrderStatus truck={truck} order={found.order} location={found.location} />
      {!done && <AutoRefresh seconds={15} />}
    </>
  );
}
