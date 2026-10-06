import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getOrderDetail, requireTruckAccess } from "@/lib/tenant";
import { AutoRefresh } from "@/components/auto-refresh";
import { OrderDetail } from "@/components/dashboard/order-detail";
import { OrderDetailActions } from "@/components/dashboard/order-detail-actions";
import { formatTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order" };

type Props = { params: Promise<{ orderId: string }> };

export default async function OrderPage({ params }: Props) {
  const { truck } = await requireTruckAccess();
  const { orderId } = await params;
  const order = await getOrderDetail(truck.id, orderId);
  if (!order) notFound();

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="mx-auto max-w-[40rem]">
          <Link
            href="/dashboard"
            className="flex h-12 items-center gap-1 px-3 font-semibold outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
          >
            <ChevronLeft aria-hidden className="size-5" />
            Service
          </Link>
        </div>
      </div>
      <main className="mx-auto max-w-[40rem] pb-16">
        <OrderDetail order={order} timezone={truck.timezone} />
        <OrderDetailActions
          order={order}
          truckName={truck.name}
          pickupLabel={formatTime(order.pickupAt, truck.timezone)}
        />
      </main>
      <AutoRefresh seconds={10} />
    </>
  );
}
