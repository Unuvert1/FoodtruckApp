import type { Truck } from "@/lib/types";
import { GEO_PROVIDER } from "@/lib/geo";

export function StorefrontFooter({ truck }: { truck: Truck }) {
  return (
    <footer className="mx-auto max-w-2xl md:max-w-3xl lg:max-w-4xl px-4 pt-14 pb-6 text-sm text-muted-foreground">
      <p className="font-display text-lg font-semibold text-foreground">{truck.name}</p>
      <p className="mt-1 max-w-prose">{truck.tagline}</p>
      <p className="mt-6">
        Times shown in the truck&apos;s local time. Online ordering by FoodtruckApp.
      </p>
      {/* Crediting whoever supplied the addresses is a licence condition, not a nicety. */}
      <p className="mt-1">
        {GEO_PROVIDER.attribution.map((credit, i) => (
          <span key={credit.href}>
            {i > 0 && " · "}
            {credit.lead}{" "}
            <a
              href={credit.href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {credit.label}
            </a>
          </span>
        ))}
      </p>
    </footer>
  );
}
