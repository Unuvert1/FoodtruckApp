"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { saveStop, type SaveStopResult } from "@/app/(dashboard)/dashboard/(app)/schedule/actions";
import { slotSummary } from "@/lib/schedule/slots";
import { zonedTimeFromParts } from "@/lib/time";
import type { Location, ScheduleRow, StopDraft } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { PlaceCombobox, TextField, placeInput, type PlaceValue } from "@/components/dashboard/place-combobox";
import { closesKeyFor, closesOptions, opensKeyFor, opensOptions, type ClosesKey, type OpensKey } from "@/components/dashboard/schedule/schedule-model";

export type StopEditing = {
  /** Changes per open, so the form starts fresh each time. */
  key: string;
  draft: StopDraft;
  /** Set when editing an existing stop. */
  row?: ScheduleRow;
  /** True when this draft came from Repeat: a new stop, not an edit. */
  repeated?: boolean;
};

type Props = {
  editing: StopEditing | null;
  spots: Location[];
  timeZone: string;
  onClose: () => void;
};

export function StopSheet({ editing, spots, timeZone, onClose }: Props) {
  return (
    <Sheet open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-surface p-0 sm:max-w-md">
        {editing && <StopForm key={editing.key} editing={editing} spots={spots} timeZone={timeZone} onSaved={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

type Field = "place" | "date" | "endTime" | "slots";

function StopForm({ editing, spots, timeZone, onSaved }: { editing: StopEditing; spots: Location[]; timeZone: string; onSaved: () => void }) {
  const { draft, row, repeated } = editing;
  const isEdit = Boolean(row);
  const hasOrders = (row?.orderCount ?? 0) > 0;
  const wasLive = isEdit && row!.service.status !== "DRAFT";

  const [place, setPlace] = useState<PlaceValue | null>(() => {
    const known = [...spots, ...(row ? [row.location] : [])].find((l) => l.id === draft.locationId);
    return known ? { kind: "saved", location: known } : null;
  });
  const [date, setDate] = useState(draft.date);
  const [startTime, setStartTime] = useState(draft.startTime);
  const [endTime, setEndTime] = useState(draft.endTime);
  const [slotMinutes, setSlotMinutes] = useState(String(draft.slotMinutes));
  const [ordersPerSlot, setOrdersPerSlot] = useState(String(draft.ordersPerSlot));

  // A number that matches no preset is carried as a "custom" chip rather than silently rewritten.
  const initial = useMemo(() => {
    const opens = opensKeyFor(draft.opensHoursBefore, opensOptions(draft.date, draft.startTime, timeZone, null));
    const closes = closesKeyFor(draft.closesMinutesBefore);
    return { opens, closes, customHours: opens === "custom" ? draft.opensHoursBefore : null, customMinutes: closes === "custom" ? draft.closesMinutesBefore : null };
  }, [draft, timeZone]);
  const [opensKey, setOpensKey] = useState<OpensKey>(initial.opens);
  const [closesKey, setClosesKey] = useState<ClosesKey>(initial.closes);
  const opens = opensOptions(date, startTime, timeZone, initial.customHours);
  const closes = closesOptions(initial.customMinutes);
  const chosenOpens = opens.find((o) => o.key === opensKey) ?? opens[0];
  const chosenCloses = closes.find((o) => o.key === closesKey) ?? closes[0];

  const [result, setResult] = useState<SaveStopResult | null>(null);
  const [localError, setLocalError] = useState<{ field?: Field; error: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const failure = localError ?? (result && !result.ok ? result : null);
  const fieldError = (field: Field) => (failure && "field" in failure && failure.field === field ? failure.error : null);
  const bannerError = failure && !("field" in failure && failure.field) ? failure.error : null;

  // A field error can be off-screen behind the sticky footer.
  useEffect(() => {
    if (!failure) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelector("[data-field-error]")?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [failure]);

  const minutes = Number(slotMinutes);
  const orders = Number(ordersPerSlot);
  const summary = useMemo(() => {
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime) && endTime > startTime;
    if (!valid || !Number.isInteger(minutes) || !Number.isInteger(orders) || minutes < 5 || orders < 1) return null;
    return slotSummary(zonedTimeFromParts(timeZone, date, startTime), zonedTimeFromParts(timeZone, date, endTime), minutes, orders, timeZone);
  }, [date, startTime, endTime, minutes, orders, timeZone]);

  function submit(publish: boolean) {
    setResult(null);
    setLocalError(null);
    if (!place) return setLocalError({ field: "place", error: "Choose where this stop is." });
    if (!Number.isInteger(minutes) || !Number.isInteger(orders)) {
      return setLocalError({ field: "slots", error: "Enter whole numbers for how often and how many." });
    }
    startTransition(async () => {
      const saved = await saveStop({
        serviceId: row?.service.id,
        ...placeInput(place),
        date,
        startTime,
        endTime,
        opensHoursBefore: chosenOpens.hours,
        closesMinutesBefore: chosenCloses.minutes,
        slotMinutes: minutes,
        ordersPerSlot: orders,
        publicNote: draft.publicNote,
        publish,
      });
      setResult(saved);
      if (saved.ok) onSaved();
    });
  }

  const title = isEdit ? "Edit stop" : repeated ? "Repeat stop" : "Add a stop";

  return (
    <form
      // Enter in a field doesn't choose between Publish and Save as draft for you.
      onSubmit={(e) => e.preventDefault()}
      noValidate
      className="flex min-h-full flex-col"
    >
      <div className="px-5 pt-6">
        <SheetTitle className="text-[1.6rem] leading-tight font-semibold tracking-[-0.02em]">{title}</SheetTitle>
        <SheetDescription className="mt-2">
          {isEdit
            ? wasLive
              ? "Changes show on your ordering page right away."
              : "This stop is a draft. Customers can't see it yet."
            : repeated
              ? "Same as before, a few days later. Check the date, then publish."
              : "Customers can order ahead once you publish it."}
        </SheetDescription>
      </div>

      <div className="mt-6 flex-1 divide-y divide-border border-t border-border">
        <Group title="Where">
          <PlaceCombobox
            value={place}
            onChange={setPlace}
            spots={spots}
            error={fieldError("place")}
            lockedReason={hasOrders ? "This stop has orders, so its spot can't change. Cancel the stop to move it." : undefined}
          />
        </Group>

        <Group title="When" hint={`Times are in ${timeZone.replace(/_/g, " ")}.`}>
          <div>
            <label htmlFor="stop-date" className="mb-1.5 block text-sm font-semibold">
              Date
            </label>
            <input
              id="stop-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={Boolean(fieldError("date"))}
              aria-describedby={fieldError("date") ? "stop-date-error" : undefined}
              className={nativeInput}
            />
            <FieldError id="stop-date-error" message={fieldError("date")} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="stop-start" className="mb-1.5 block text-sm font-semibold">
                Starts
              </label>
              <input id="stop-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={nativeInput} />
            </div>
            <div>
              <label htmlFor="stop-end" className="mb-1.5 block text-sm font-semibold">
                Ends
              </label>
              <input
                id="stop-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-invalid={Boolean(fieldError("endTime"))}
                aria-describedby={fieldError("endTime") ? "stop-end-error" : undefined}
                className={nativeInput}
              />
            </div>
          </div>
          <FieldError id="stop-end-error" message={fieldError("endTime")} />
        </Group>

        <Group title="Ordering window">
          <Chips legend="Preorders open" name="opens" value={chosenOpens.key} onChange={(k) => setOpensKey(k as OpensKey)} options={opens.map((o) => ({ value: o.key, label: o.label }))} />
          <div className="mt-5">
            <Chips
              legend="Stop taking orders, before the end"
              name="closes"
              value={chosenCloses.key}
              onChange={(k) => setClosesKey(k as ClosesKey)}
              options={closes.map((o) => ({ value: o.key, label: o.label }))}
            />
          </div>
        </Group>

        <Group title="Pickup slots">
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="stop-slot-minutes" label="Minutes apart" value={slotMinutes} onChange={setSlotMinutes} invalid={Boolean(fieldError("slots"))} />
            <NumberField id="stop-slot-orders" label="Orders per time" value={ordersPerSlot} onChange={setOrdersPerSlot} invalid={Boolean(fieldError("slots"))} />
          </div>
          <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
            {summary ?? "Set the times above to see how many pickup times this makes."}
          </p>
          {orders === 1 || orders === 2 ? (
            <p className="mt-1.5 text-sm font-medium text-cooking-ink">
              Only {orders} {orders === 1 ? "order" : "orders"} per pickup time. Busy stops will sell out fast.
            </p>
          ) : null}
          <FieldError id="stop-slots-error" message={fieldError("slots")} />
        </Group>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-surface px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <ErrorBanner message={bannerError} className="mb-3" />
        <div className="flex gap-2">
          <Button type="button" disabled={pending} onClick={() => submit(true)} className="h-12 flex-1 rounded-xl text-base font-semibold">
            {pending ? "Saving…" : wasLive ? "Save changes" : "Publish stop"}
          </Button>
          {!wasLive && (
            <Button type="button" variant="outline" disabled={pending} onClick={() => submit(false)} className="h-12 rounded-xl px-4 text-base font-semibold">
              Save as draft
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

const nativeInput =
  "h-12 w-full min-w-0 rounded-xl border border-input bg-surface px-3.5 text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40 aria-invalid:border-destructive";

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-6">
      <h3 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" data-field-error className="mt-1.5 text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

function NumberField({ id, label, value, onChange, invalid }: { id: string; label: string; value: string; onChange: (v: string) => void; invalid: boolean }) {
  return (
    <TextField id={id} label={label} value={value} onChange={(v) => onChange(v.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" aria-invalid={invalid} className={cn("tabular-nums")} />
  );
}

/** Radio inputs dressed as chips: native arrow-key behaviour, no ARIA to get wrong. */
function Chips({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="relative">
            <input type="radio" name={name} value={o.value} checked={o.value === value} onChange={() => onChange(o.value)} className="peer sr-only" />
            <span className="flex h-11 cursor-pointer items-center rounded-full border border-input px-4 text-[0.9375rem] font-medium transition-colors select-none peer-checked:border-transparent peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-4 peer-focus-visible:ring-ring/40 motion-reduce:transition-none">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
