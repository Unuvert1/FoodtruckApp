import type { Location, OrderView, Truck } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { formatDayLabel, formatTime } from "@/lib/time";
import { PayNow } from "@/components/storefront/pay-now";

type Props = {
  truck: Truck;
  order: OrderView;
  location: Location;
  /** True when the customer has just come back from Stripe: the payment is probably on its way. */
  confirming: boolean;
};

/**
 * What an order looks like until it is paid. The truck can't see it yet, so this
 * page never says "sent": it either asks the customer to pay, or (right after
 * paying) says it is waiting for Stripe's confirmation, which usually takes seconds.
 */
export function PaymentPending({ truck, order, location, confirming }: Props) {
  const tz = truck.timezone;
  const lines = order.lines.filter((l) => !l.voidedAt);

  return (
    <main className="mx-auto max-w-2xl pb-16 md:max-w-3xl">
      <p role="status" className="sr-only">
        {confirming ? "Confirming your payment." : "Your order is waiting for payment."}
      </p>
      <section className="bg-brand px-4 pt-8 pb-8 text-brand-foreground sm:rounded-b-3xl">
        <p className="font-display text-xl font-bold tracking-wide">{truck.name}</p>
        {confirming ? (
          <>
            <h1 className="mt-8 font-display text-4xl leading-tight font-extrabold">Confirming your payment…</h1>
            <p className="mt-3 text-base opacity-90">
              Thanks, {order.customerName}. This usually takes a few seconds, and this page updates by itself. There&apos;s nothing else to do.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-8 font-display text-4xl leading-tight font-extrabold">Pay to send your order</h1>
            <p className="mt-3 text-base opacity-90">
              {order.customerName}, order {order.orderNumber} is saved but not paid yet. The truck only sees it once you&apos;ve paid, and we hold your pickup time for about 30 minutes.
            </p>
          </>
        )}
      </section>

      <section className="px-4 pt-8">
        <h2 className="font-display text-[1.5rem] leading-tight font-bold">Your order</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl bg-surface px-4">
          {lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-4 py-3">
              <div>
                <p className="font-medium">
                  {l.quantity > 1 ? `${l.quantity} × ` : ""}
                  {l.name}
                </p>
                {l.modifiers.length > 0 && <p className="text-sm text-muted-foreground">{l.modifiers.join(", ")}</p>}
              </div>
              <p className="tabular-nums">{formatCents(l.lineTotalCents)}</p>
            </li>
          ))}
          {order.taxCents > 0 && (
            <li className="flex justify-between py-3 text-sm text-muted-foreground">
              <span>Tax</span>
              <span className="tabular-nums">{formatCents(order.taxCents)}</span>
            </li>
          )}
          {order.tipCents > 0 && (
            <li className="flex justify-between py-3 text-sm text-muted-foreground">
              <span>Tip</span>
              <span className="tabular-nums">{formatCents(order.tipCents)}</span>
            </li>
          )}
          <li className="flex justify-between py-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCents(order.totalCents)}</span>
          </li>
        </ul>
        {order.pickupAt && (
          <p className="mt-3 text-sm text-muted-foreground">
            Pickup {formatDayLabel(order.pickupAt, tz)} at {formatTime(order.pickupAt, tz)}, {location.name}.
          </p>
        )}
      </section>

      <section className="px-4 pt-6">
        {confirming ? (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Closed the payment page before paying?</p>
            <PayNow truckSlug={truck.slug} orderId={order.id} label="Pay now" variant="secondary" />
          </div>
        ) : (
          <PayNow truckSlug={truck.slug} orderId={order.id} label={`Pay ${formatCents(order.totalCents)}`} />
        )}
      </section>
    </main>
  );
}
