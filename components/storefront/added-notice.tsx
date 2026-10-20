"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { Menu } from "@/lib/types";
import { findItem } from "@/lib/cart";
import { useCart } from "@/components/storefront/cart-provider";

const SHOW_MS = 2500;

/**
 * A short "Added Birria tacos" note above the order bar, so adding an item never
 * feels like nothing happened. The region is always in the page (empty when
 * idle), which is what lets screen readers announce the text when it appears.
 */
export function AddedNotice({ menu }: { menu: Menu }) {
  const { lastAdded, count } = useCart();
  const [dismissedId, setDismissedId] = useState(0);

  useEffect(() => {
    if (!lastAdded) return;
    const timer = setTimeout(() => setDismissedId(lastAdded.id), SHOW_MS);
    return () => clearTimeout(timer);
  }, [lastAdded]);

  const item = lastAdded ? findItem(menu, lastAdded.menuItemId) : undefined;
  const visible = lastAdded !== null && item !== undefined && lastAdded.id !== dismissedId;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 px-4"
    >
      {visible && (
        <p
          key={lastAdded.id}
          className="mx-auto flex w-fit max-w-full items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
        >
          <Check aria-hidden className="size-4 shrink-0" strokeWidth={3} />
          <span className="truncate">
            Added {item.name}
            <span className="sr-only">. {count === 1 ? "1 item" : `${count} items`} in your order.</span>
          </span>
        </p>
      )}
    </div>
  );
}
