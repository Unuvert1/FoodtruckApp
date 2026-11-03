import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderForCustomer, getTruckFromRequest } from "@/lib/tenant";
import { AutoRefresh } from "@/components/auto-refresh";
import { OrderStatus } from "@/components/storefront/order-status";
import { PaymentPending } from "@/components/storefront/payment-pending";
import { RememberOrder } from "@/components/storefront/remember-order";

export const dynamic = "force-dynamic";

const POLL_SECONDS = 15;
const POLL_SECONDS_UNCONFIRMED = 8;
const POLL_SECONDS_PAYMENT = 4; // just back from Stripe: the webhook is usually seconds away

type Props = {
  params: Promise<{ truckSlug: string; orderId: string }>;
  searchParams: Promise<{ paid?: string }>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const { truckSlug, orderId } = await params;
  const { paid } = await searchParams;
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

  // Not paid yet: the truck can't see this order, so it gets its own screen, and nothing is remembered on this device.
  if (found.order.status === "PENDING_PAYMENT") {
    const confirming = paid === "1";
    return (
      <>
        <PaymentPending truck={truck} order={found.order} location={found.location} confirming={confirming} />
        <AutoRefresh seconds={confirming ? POLL_SECONDS_PAYMENT : POLL_SECONDS} />
      </>
    );
  }

  const done = found.order.status === "PICKED_UP" || found.order.status === "CANCELLED";

  const pollSeconds = found.order.status === "PAID" ? POLL_SECONDS_UNCONFIRMED : POLL_SECONDS;

  return (
    <>
      <RememberOrder
        truckSlug={truck.slug}
        orderId={found.order.id}
        orderNumber={found.order.orderNumber}
        status={found.order.status}
        placedAt={found.order.placedAt}
      />
      <OrderStatus
        truck={truck}
        order={found.order}
        location={found.location}
        refresh={done ? undefined : { renderedAt: new Date().toISOString(), seconds: pollSeconds }}
      />
      {!done && <AutoRefresh seconds={pollSeconds} />}
    </>
  );
}
