import { notFound } from "next/navigation";
import { getTruckBySlug } from "@/lib/mock-data";
import { OrderStatus } from "@/components/storefront/order-status";

type Props = {
  params: Promise<{ truckSlug: string; orderNumber: string }>;
};

export default async function OrderPage({ params }: Props) {
  const { truckSlug, orderNumber } = await params;
  const truck = getTruckBySlug(truckSlug);
  if (!truck) notFound();

  return <OrderStatus truck={truck} orderNumber={decodeURIComponent(orderNumber)} />;
}
