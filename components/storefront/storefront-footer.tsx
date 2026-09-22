import type { Truck } from "@/lib/types";

export function StorefrontFooter({ truck }: { truck: Truck }) {
  return (
    <footer className="mx-auto max-w-2xl px-4 pt-14 pb-6 text-sm text-muted-foreground">
      <p className="font-display text-lg font-semibold text-foreground">{truck.name}</p>
      <p className="mt-1 max-w-prose">{truck.tagline}</p>
      <p className="mt-6">
        Times shown in the truck&apos;s local time. Online ordering by FoodtruckApp.
      </p>
    </footer>
  );
}
