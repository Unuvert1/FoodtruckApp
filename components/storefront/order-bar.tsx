"use client";

import Link from "next/link";
import type { Menu } from "@/lib/types";
import { resolveLine } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { useCart } from "@/components/storefront/cart-provider";

/** Pinned to the bottom of the screen, where a thumb already is, once there's something in the order. */
export function OrderBar({ menu, checkoutHref }: { menu: Menu; checkoutHref: string }) {
  const { lines, count } = useCart();
  if (count === 0) return null;

  const subtotal = lines.reduce((sum, line) => sum + (resolveLine(menu, line)?.lineTotalCents ?? 0), 0);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] motion-safe:animate-in motion-safe:slide-in-from-bottom-6 motion-safe:fade-in motion-safe:duration-200">
      <Link
        href={checkoutHref}
        className="mx-auto flex h-14 max-w-2xl items-center gap-3 rounded-2xl bg-brand px-5 text-brand-foreground shadow-[0_8px_24px_-8px_rgb(29_39_51/0.45)] outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-foreground text-sm font-bold text-brand tabular-nums">
          {count}
        </span>
        <span className="flex-1 text-base font-semibold">View order</span>
        <span className="text-base font-semibold tabular-nums">{formatCents(subtotal)}</span>
      </Link>
    </div>
  );
}
