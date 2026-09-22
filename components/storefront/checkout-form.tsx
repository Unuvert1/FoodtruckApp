"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import type { Location, Menu, PickupSlot, Service, Truck } from "@/lib/types";
import { resolveLine, type ResolvedLine } from "@/lib/cart";
import { applyBps, formatCents, orderTotals } from "@/lib/money";
import { formatDayLabel, formatTime } from "@/lib/time";
import { saveDemoOrder } from "@/lib/demo-order";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/storefront/cart-provider";

type Props = {
  truck: Truck;
  service: Service;
  location: Location;
  menu: Menu;
  slots: PickupSlot[];
};

const TIP_CHOICES_BPS = [0, 1500, 1800, 2000];

type Errors = Partial<Record<"slot" | "name" | "phone", string>>;

export function CheckoutForm({ truck, service, location, menu, slots }: Props) {
  const router = useRouter();
  const { lines, ready, setQuantity, clear } = useCart();
  const tz = truck.timezone;

  const [slotId, setSlotId] = useState<string | null>(null);
  const [tipBps, setTipBps] = useState(1500);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [placed, setPlaced] = useState(false); // avoids flashing "empty" between clear() and navigation

  const resolved = lines.map((l) => resolveLine(menu, l)).filter((l): l is ResolvedLine => l !== null);
  const subtotal = resolved.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const totals = orderTotals(subtotal, truck.taxRateBps, applyBps(subtotal, tipBps));
  const menuHref = `/${truck.slug}?service=${service.id}`;

  function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!slotId) next.slot = "Choose a pickup time.";
    if (!name.trim()) next.name = "Enter the name we should call out.";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a phone number with area code.";
    setErrors(next);
    const firstError = Object.keys(next)[0];
    if (firstError) {
      document.getElementById(`field-${firstError}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // TODO(Stream C): replace with a Server Action that calls
    // lib/orders/createOrder.ts (server-side pricing + slot reservation) and
    // redirects to Stripe Checkout. Nothing here is trusted by the server.
    const slot = slots.find((s) => s.id === slotId)!;
    const orderNumber = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${10 + Math.floor(Math.random() * 90)}`;
    saveDemoOrder({
      orderNumber,
      truckSlug: truck.slug,
      customerName: name.trim(),
      pickupAt: slot.startsAt,
      locationName: location.name,
      locationAddress: `${location.addressLine}, ${location.city}`,
      lines: resolved.map((l) => ({
        nameSnapshot: l.item.name,
        modifiersSnapshot: l.options.map((o) => o.name),
        unitPriceCents: l.unitCents,
        quantity: l.quantity,
        lineTotalCents: l.lineTotalCents,
      })),
      ...totals,
      placedAt: new Date().toISOString(),
    });
    setPlaced(true);
    clear();
    router.push(`/${truck.slug}/order/${orderNumber}`);
  }

  return (
    <main className="mx-auto max-w-2xl pb-32">
      <header className="px-4 pt-4">
        <Link
          href={menuHref}
          className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ChevronLeft className="size-4" />
          Back to menu
        </Link>
        <h1 className="mt-3 font-display text-[2.5rem] leading-none font-extrabold">Your order</h1>
        <p className="mt-2 text-[0.9375rem] text-muted-foreground">
          Pickup from {truck.name} at {location.name}, {formatDayLabel(service.startsAt, tz).toLowerCase()}.
        </p>
      </header>

      {ready && resolved.length === 0 && !placed ? (
        <div className="mx-4 mt-8 rounded-2xl bg-surface px-5 py-8">
          <p className="font-semibold">Your order is empty.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add something from the menu to get started.</p>
          <Link href={menuHref} className="mt-4 inline-block font-semibold text-brand underline underline-offset-4">
            Back to menu
          </Link>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} noValidate>
          <Section title="Items">
            <ul className="divide-y divide-border rounded-2xl bg-surface px-4">
              {resolved.map((line) => (
                <li key={line.key} className="flex items-start gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{line.item.name}</p>
                    {line.options.length > 0 && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{line.options.map((o) => o.name).join(", ")}</p>
                    )}
                    <p className="mt-1.5 text-sm font-medium tabular-nums">{formatCents(line.lineTotalCents)}</p>
                  </div>
                  <div className="flex h-10 items-center rounded-lg ring-1 ring-border">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.key, line.quantity - 1)}
                      aria-label={line.quantity === 1 ? `Remove ${line.item.name}` : `One less ${line.item.name}`}
                      className="flex size-10 items-center justify-center rounded-l-lg outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {line.quantity === 1 ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
                    </button>
                    <span className="w-5 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.key, line.quantity + 1)}
                      aria-label={`One more ${line.item.name}`}
                      className="flex size-10 items-center justify-center rounded-r-lg outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Pickup time" id="field-slot" error={errors.slot}>
            {slots.length === 0 ? (
              <p className="rounded-2xl bg-surface px-4 py-5 text-sm">
                Every pickup time for this stop is full. You can still order at the window.
              </p>
            ) : (
              <RadioGroup
                aria-label="Pickup time"
                value={slotId}
                onValueChange={(v) => {
                  setSlotId(v as string);
                  setErrors((e) => ({ ...e, slot: undefined }));
                }}
                className="grid grid-cols-3 gap-2"
              >
                {slots.map((slot) => {
                  const left = slot.capacity - slot.bookedCount;
                  return (
                    <Tile key={slot.id} value={slot.id}>
                      <span className="font-semibold tabular-nums">{formatTime(slot.startsAt, tz)}</span>
                      {left <= 2 && <span className="text-xs opacity-75">{left} left</span>}
                    </Tile>
                  );
                })}
              </RadioGroup>
            )}
          </Section>

          <Section title="Tip">
            <p className="-mt-1 mb-3 text-sm text-muted-foreground">All tips go to the crew.</p>
            <RadioGroup
              aria-label="Tip"
              value={tipBps}
              onValueChange={(v) => setTipBps(v as number)}
              className="grid grid-cols-4 gap-2"
            >
              {TIP_CHOICES_BPS.map((bps) => (
                <Tile key={bps} value={bps}>
                  <span className="font-semibold">{bps === 0 ? "None" : `${bps / 100}%`}</span>
                  {bps > 0 && <span className="text-xs tabular-nums opacity-75">{formatCents(applyBps(subtotal, bps))}</span>}
                </Tile>
              ))}
            </RadioGroup>
          </Section>

          <Section title="Your details">
            <div className="space-y-4 rounded-2xl bg-surface p-4">
              <Field id="field-name" label="Name for the order" error={errors.name}>
                <Input
                  id="name"
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  className="h-12 rounded-xl bg-surface px-3.5 text-base"
                />
              </Field>
              <Field id="field-phone" label="Phone" hint="Only used if there's a problem with your order." error={errors.phone}>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={Boolean(errors.phone)}
                  className="h-12 rounded-xl bg-surface px-3.5 text-base"
                />
              </Field>
            </div>
          </Section>

          <Section title="Total">
            <dl className="space-y-2 rounded-2xl bg-surface p-4 text-[0.9375rem] tabular-nums">
              <Row label="Subtotal" cents={totals.subtotalCents} />
              <Row label={`Tax (${truck.taxRateBps / 100}%)`} cents={totals.taxCents} />
              <Row label="Tip" cents={totals.tipCents} />
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCents(totals.totalCents)}</dd>
              </div>
            </dl>
          </Section>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
            <Button
              type="submit"
              disabled={slots.length === 0 || resolved.length === 0}
              className="mx-auto flex h-14 w-full max-w-2xl justify-between rounded-2xl px-5 text-base font-semibold"
            >
              <span>Place order</span>
              <span className="tabular-nums">{formatCents(totals.totalCents)}</span>
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}

function Section({
  title,
  id,
  error,
  children,
}: {
  title: string;
  id?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 px-4 pt-8">
      <h2 className="mb-3 font-display text-[1.5rem] leading-tight font-bold">{title}</h2>
      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {children}
    </section>
  );
}

// A selectable tile, used for pickup times and tip amounts.
function Tile({ value, children }: { value: string | number; children: React.ReactNode }) {
  return (
    <Radio.Root
      value={value}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl bg-surface px-2 py-2 text-[0.9375rem] ring-1 ring-border outline-none transition-colors",
        "hover:ring-foreground/30 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-checked:bg-brand data-checked:text-brand-foreground data-checked:ring-brand"
      )}
    >
      {children}
    </Radio.Root>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactElement<{ id: string }>;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <Label htmlFor={children.props.id} className="mb-2 text-sm font-semibold">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Row({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{formatCents(cents)}</dd>
    </div>
  );
}
