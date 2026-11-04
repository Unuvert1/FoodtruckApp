"use client";

import { useState, useTransition } from "react";
import { payForOrder } from "@/app/(storefront)/[truckSlug]/order/[orderId]/actions";

type Props = {
  truckSlug: string;
  orderId: string;
  label: string;
  /** "secondary" for the small "pay again" link shown while a payment is being confirmed. */
  variant?: "primary" | "secondary";
};

/** Opens Stripe's payment page for an order that hasn't been paid yet. */
export function PayNow({ truckSlug, orderId, label, variant = "primary" }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pay() {
    setError(null);
    startTransition(async () => {
      const result = await payForOrder({ truckSlug, orderId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.assign(result.url);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={pay}
        disabled={pending}
        className={
          variant === "primary"
            ? "inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand px-6 text-base font-semibold text-brand-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto"
            : "inline-flex h-11 items-center rounded-xl bg-surface px-4 text-sm font-semibold ring-1 ring-border outline-none hover:ring-foreground/30 focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
        }
      >
        {pending ? "Opening payment…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
