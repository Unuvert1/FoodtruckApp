"use client";

import { cloneElement, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import type { Location, Menu, PickupSlot, Service, Truck } from "@/lib/types";
import { findItem, resolveLine, type ResolvedLine } from "@/lib/cart";
import { removedMessage, soldOutReason } from "@/lib/cart-check";
import { resolveSlotChoice } from "@/lib/checkout-slot";
import { applyBps, formatCents, orderTotals } from "@/lib/money";
import { browserStorage, clearSavedCustomer, readSavedCustomer, writeSavedCustomer } from "@/lib/saved-customer";
import { formatDayLabel, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { placeOrder } from "@/app/(storefront)/[truckSlug]/checkout/actions";
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

  // The earliest pickup time starts selected. If the chosen time fills up while
  // the customer is checking out, resolveSlotChoice moves them to the next one.
  const [chosenSlot, setChosenSlot] = useState<PickupSlot | null>(slots[0] ?? null);
  const { slot: selectedSlot, replaced: lostSlot } = resolveSlotChoice(slots, chosenSlot);
  const slotId = selectedSlot?.id ?? null;
  const [tipBps, setTipBps] = useState(1500);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [placed, setPlaced] = useState(false); // avoids flashing "empty" between clear() and navigation
  const [serverError, setServerError] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();

  const resolved = lines.map((l) => resolveLine(menu, l)).filter((l): l is ResolvedLine => l !== null);
  // Sold-out lines stay visible, flagged, but never count toward the total: the total is what would be charged.
  const soldOutLines = resolved.filter((l) => soldOutReason(l) !== null);
  const orderable = resolved.filter((l) => soldOutReason(l) === null);
  const subtotal = orderable.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const totals = orderTotals(subtotal, truck.taxRateBps, applyBps(subtotal, tipBps));
  const menuHref = `/${truck.slug}?service=${service.id}`;

  // Items that left the menu since they were added: take them out and say so, by name.
  const [removedNames, setRemovedNames] = useState<string[]>([]);
  useEffect(() => {
    if (!ready) return;
    const gone = lines.filter((l) => !findItem(menu, l.menuItemId));
    if (gone.length === 0) return;
    setRemovedNames((prev) => [...prev, ...gone.map((l) => l.name ?? "An item")]);
    for (const line of gone) setQuantity(line.key, 0);
  }, [ready, lines, menu, setQuantity]);

  // Fill in the details from last time. Read after mount so the server and
  // browser render the same thing first, and never overwrite what's been typed.
  useEffect(() => {
    const saved = readSavedCustomer(browserStorage());
    if (!saved) return;
    setName((current) => current || saved.name);
    setPhone((current) => current || saved.phone);
    setHasSavedDetails(true);
  }, []);

  function forgetSavedDetails() {
    clearSavedCustomer(browserStorage());
    setName("");
    setPhone("");
    setHasSavedDetails(false);
  }

  function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!slotId) next.slot = "Choose a pickup time.";
    if (!name.trim()) next.name = "Enter the name we should call out.";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a phone number with area code.";
    setErrors(next);
    const firstError = Object.keys(next)[0];
    if (firstError) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document
        .getElementById(`field-${firstError}`)
        ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      // Move keyboard / screen reader focus to the problem, not just the view.
      const target =
        firstError === "slot" ? document.querySelector<HTMLElement>("#field-slot [role='radio']") : document.getElementById(firstError);
      target?.focus({ preventScroll: true });
      return;
    }

    // Send IDs and quantities only. The server reprices everything.
    setServerError(null);
    startPlacing(async () => {
      const result = await placeOrder({
        truckSlug: truck.slug,
        serviceId: service.id,
        pickupSlotId: slotId!,
        tipBps,
        customerName: name,
        customerPhone: phone,
        lines: orderable.map((l) => ({ menuItemId: l.menuItemId, optionIds: l.optionIds, quantity: l.quantity })),
      });
      if (!result.ok) {
        // The server's wording for a deleted item can't name it. The refresh below brings in the new menu,
        // and the notice at the top then names what was taken out.
        setServerError(
          /no longer on the menu/i.test(result.error)
            ? "Something in your order was just taken off the menu. We've updated your order. Check it, then place it again."
            : result.error
        );
        router.refresh(); // pick up slots that filled or items that sold out meanwhile
        return;
      }
      writeSavedCustomer(browserStorage(), { name, phone });
      setPlaced(true);
      clear();
      router.push(`/${truck.slug}/order/${result.orderId}`);
    });
  }

  return (
    <main className="mx-auto max-w-2xl pb-32 lg:max-w-4xl">
      <header className="px-4 pt-4">
        <Link
          href={menuHref}
          className="-ml-2 inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Back to menu
        </Link>
        <h1 className="mt-3 font-display text-[2.5rem] leading-none font-extrabold">Your order</h1>
        <p className="mt-2 text-[0.9375rem] text-muted-foreground">
          Pickup from {truck.name} at {location.name}, {formatDayLabel(service.startsAt, tz).toLowerCase()}.
        </p>
      </header>

      {removedNames.length > 0 && (
        <p role="status" className="mx-4 mt-5 rounded-2xl bg-surface px-4 py-3.5 text-sm font-medium">
          {removedMessage(removedNames)}
        </p>
      )}

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
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-x-8">
            <div>
              <Section title="Items">
                <ul className="divide-y divide-border rounded-2xl bg-surface px-4">
                  {resolved.map((line) => {
                    const unavailable = soldOutReason(line);
                    return (
                      <li key={line.key} className="flex items-start gap-3 py-4">
                        <div className="min-w-0 flex-1">
                          <p className={cn("font-semibold", unavailable && "text-muted-foreground")}>{line.item.name}</p>
                          {line.options.length > 0 && (
                            <p className="mt-0.5 text-sm text-muted-foreground">{line.options.map((o) => o.name).join(", ")}</p>
                          )}
                          {unavailable ? (
                            <p className="mt-1.5 text-sm font-medium text-destructive">
                              {unavailable}. Remove it to place your order.
                            </p>
                          ) : (
                            <p className="mt-1.5 text-sm font-medium tabular-nums">{formatCents(line.lineTotalCents)}</p>
                          )}
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
                    );
                  })}
                </ul>
              </Section>

              <Section title="Pickup time" id="field-slot" error={errors.slot}>
                {slots.length === 0 ? (
                  <p className="rounded-2xl bg-surface px-4 py-5 text-sm">
                    Every pickup time for this stop is full. You can still order at the window.
                  </p>
                ) : (
                  <>
                    {lostSlot && selectedSlot && (
                      <p role="status" className="mb-3 text-sm font-medium">
                        {formatTime(lostSlot.startsAt, tz)} just filled up. We picked {formatTime(selectedSlot.startsAt, tz)} instead.
                        Choose another time if you like.
                      </p>
                    )}
                    <RadioGroup
                      aria-label="Pickup time"
                      value={slotId}
                      onValueChange={(v) => {
                        setChosenSlot(slots.find((s) => s.id === v) ?? null);
                        setErrors((e) => ({ ...e, slot: undefined }));
                      }}
                      className="grid grid-cols-3 gap-2"
                    >
                      {slots.map((slot, index) => {
                        const left = slot.capacity - slot.bookedCount;
                        const note = [index === 0 ? "Earliest" : null, left <= 2 ? `${left} left` : null]
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <Tile key={slot.id} value={slot.id}>
                            <span className="font-semibold tabular-nums">{formatTime(slot.startsAt, tz)}</span>
                            {note && <span className="text-center text-xs opacity-75">{note}</span>}
                          </Tile>
                        );
                      })}
                    </RadioGroup>
                  </>
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
                  {hasSavedDetails ? (
                    <p className="text-sm text-muted-foreground">
                      Filled in from your last order, saved on this device.{" "}
                      <button
                        type="button"
                        onClick={forgetSavedDetails}
                        className="font-semibold text-brand underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      >
                        Clear
                      </button>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">We&apos;ll remember these on this device for next time.</p>
                  )}
                </div>
              </Section>

            </div>
            <div className="lg:sticky lg:top-6">
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
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
            {soldOutLines.length > 0 && (
              <p role="alert" className="mx-auto mb-3 max-w-2xl lg:max-w-4xl text-sm font-medium text-destructive">
                {soldOutLines.length === 1
                  ? `${soldOutLines[0].item.name} just sold out. Remove it to place your order.`
                  : "Some items just sold out. Remove them to place your order."}
              </p>
            )}
            {serverError && (
              <p role="alert" className="mx-auto mb-3 max-w-2xl lg:max-w-4xl text-sm font-medium text-destructive">
                {serverError}
              </p>
            )}
            <Button
              type="submit"
              aria-busy={placing}
              disabled={placing || slots.length === 0 || orderable.length === 0 || soldOutLines.length > 0}
              className="mx-auto flex h-14 w-full max-w-2xl lg:max-w-4xl justify-between rounded-2xl px-5 text-base font-semibold"
            >
              <span>{placing ? "Placing order…" : "Place order"}</span>
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
  children: React.ReactElement<{ id: string; "aria-describedby"?: string }>;
}) {
  // Tie the error (or hint) to the input so screen readers read it with the field.
  const inputId = children.props.id;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div id={id} className="scroll-mt-24">
      <Label htmlFor={inputId} className="mb-2 text-sm font-semibold">
        {label}
      </Label>
      {cloneElement(children, { "aria-describedby": message ? messageId : undefined })}
      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="mt-1.5 text-sm text-muted-foreground">
            {hint}
          </p>
        )
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
