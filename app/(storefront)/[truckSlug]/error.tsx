"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StateScreen, stateLinkClass } from "@/components/storefront/state-screen";

// Catches anything that throws while rendering a storefront page (a dropped
// database connection, say). Customers get a way to retry, not a blank screen.
export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StateScreen
      title="Something went wrong"
      actions={
        <>
          <Button onClick={reset} className="h-12 rounded-xl px-6 text-base font-semibold">
            Try again
          </Button>
          <Link href="/" className={stateLinkClass}>
            Back to FoodtruckApp
          </Link>
        </>
      }
    >
      <p role="alert">
        We couldn&apos;t load this page. Your order is saved on this device, so nothing is lost. Try again in a
        moment, or ask at the window.
      </p>
    </StateScreen>
  );
}
