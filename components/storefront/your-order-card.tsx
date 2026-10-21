"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { browserStorage } from "@/lib/saved-customer";
import { clearRecentOrder, readRecentOrder, type RecentOrder } from "@/lib/recent-order";

/**
 * A slim "Your order A07 · View status" bar at the top of the storefront, for a customer
 * who already ordered here and may have lost the link. Read after mount, so the server and
 * browser render the same thing first; renders nothing when there's no recent order.
 */
export function YourOrderCard({ truckSlug }: { truckSlug: string }) {
  const [order, setOrder] = useState<RecentOrder | null>(null);

  useEffect(() => {
    setOrder(readRecentOrder(browserStorage(), truckSlug));
  }, [truckSlug]);

  if (!order) return null;

  return (
    <aside aria-label="Your order" className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-2xl items-center md:max-w-3xl lg:max-w-4xl">
        <Link
          href={`/${truckSlug}/order/${order.orderId}`}
          className="flex min-h-12 flex-1 items-center gap-2 px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
        >
          <span className="font-semibold">
            Your order <span className="tabular-nums">{order.orderNumber}</span>
          </span>
          <span className="ml-auto flex items-center gap-0.5 text-sm font-semibold text-brand">
            View status
            <ChevronRight aria-hidden className="size-4" />
          </span>
        </Link>
        <button
          type="button"
          aria-label="Hide your order"
          onClick={() => {
            clearRecentOrder(browserStorage(), truckSlug, order.orderId);
            setOrder(null);
          }}
          className="flex size-12 shrink-0 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </aside>
  );
}
