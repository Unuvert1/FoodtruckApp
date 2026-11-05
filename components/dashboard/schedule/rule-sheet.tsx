"use client";

// The repeating-stop form. Deliberately the same four groups as the one-off
// stop sheet, with weekday toggles where the date picker is — so a vendor who
// has added a stop already knows this screen.

import { useMemo, useState, useTransition } from "react";
import { saveRule, type SaveRuleResult } from "@/app/(dashboard)/dashboard/(app)/schedule/actions";
import { RULE_HORIZON_DAYS, ruleProblem, weekdaysLabel } from "@/lib/schedule/rules";
import { slotSummary } from "@/lib/schedule/slots";
import { zonedDateKey, zonedTimeFromParts } from "@/lib/time";
import type { Location, RuleDraft } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { PlaceCombobox, placeInput, type PlaceValue } from "@/components/dashboard/place-combobox";
import { Chips, DayToggles, FieldError, Group, NumberField, nativeInput } from "@/components/dashboard/schedule/sheet-fields";
import { closesKeyFor, closesOptions, opensKeyFor, opensOptions, type ClosesKey, type OpensKey } from "@/components/dashboard/schedule/schedule-model";

export type RuleEditing = {
  /** Changes per open, so the form starts fresh each time. */
  key: string;
  draft: RuleDraft;
  location?: Location;
};

type Props = {
  editing: RuleEditing | null;
  spots: Location[];
  timeZone: string;
  onClose: () => void;
};

export function RuleSheet({ editing, spots, timeZone, onClose }: Props) {
  return (
    <Sheet open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-surface p-0 sm:max-w-md">
        {editing && <RuleForm key={editing.key} editing={editing} spots={spots} timeZone={timeZone} onSaved={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

type Field = "place" | "endTime" | "weekdays" | "slots";

function RuleForm({ editing, spots, timeZone, onSaved }: { editing: RuleEditing; spots: Location[]; timeZone: string; onSaved: () => void }) {
  const { draft, location } = editing;
  const isEdit = Boolean(draft.ruleId);

  const [place, setPlace] = useState<PlaceValue | null>(() => {
    const known = [...spots, ...(location ? [location] : [])].find((l) => l.id === draft.locationId);
    return known ? { kind: "saved", location: known } : null;
  });
  const [weekdays, setWeekdays] = useState<number[]>(draft.weekdays);
  const [startTime, setStartTime] = useState(draft.startTime);
  const [endTime, setEndTime] = useState(draft.endTime);
  const [slotMinutes, setSlotMinutes] = useState(String(draft.slotMinutes));
  const [ordersPerSlot, setOrdersPerSlot] = useState(String(draft.ordersPerSlot));

  // The ordering-window presets are worded against a date ("the evening
  // before"), so they are computed against today — the offsets are what get
  // stored, and they hold for every date the rule covers.
  const today = useMemo(() => zonedDateKey(new Date(), timeZone), [timeZone]);
  const initial = useMemo(() => {
    const opens = opensKeyFor(draft.opensHoursBefore, opensOptions(today, draft.startTime, timeZone, null));
    const closes = closesKeyFor(draft.closesMinutesBefore);
    return {
      opens,
      closes,
      customHours: opens === "custom" ? draft.opensHoursBefore : null,
      customMinutes: closes === "custom" ? draft.closesMinutesBefore : null,
    };
  }, [draft, timeZone, today]);
  const [opensKey, setOpensKey] = useState<OpensKey>(initial.opens);
  const [closesKey, setClosesKey] = useState<ClosesKey>(initial.closes);
  const opens = opensOptions(today, startTime, timeZone, initial.customHours);
  const closes = closesOptions(initial.customMinutes);
  const chosenOpens = opens.find((o) => o.key === opensKey) ?? opens[0];
  const chosenCloses = closes.find((o) => o.key === closesKey) ?? closes[0];

  const [result, setResult] = useState<SaveRuleResult | null>(null);
  const [localError, setLocalError] = useState<{ field?: Field; error: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const failure = localError ?? (result && !result.ok ? result : null);
  const fieldError = (field: Field) => (failure && "field" in failure && failure.field === field ? failure.error : null);
  const bannerError = failure && !("field" in failure && failure.field) ? failure.error : null;

  const minutes = Number(slotMinutes);
  const orders = Number(ordersPerSlot);
  const summary = useMemo(() => {
    if (endTime <= startTime || !Number.isInteger(minutes) || !Number.isInteger(orders) || minutes < 5 || orders < 1) return null;
    return slotSummary(
      zonedTimeFromParts(timeZone, today, startTime),
      zonedTimeFromParts(timeZone, today, endTime),
      minutes,
      orders,
      timeZone
    );
  }, [today, startTime, endTime, minutes, orders, timeZone]);

  function submit() {
    setResult(null);
    setLocalError(null);
    if (!place) return setLocalError({ field: "place", error: "Choose where this stop is." });
    const problem = ruleProblem({ weekdays, startTime, endTime });
    if (problem) return setLocalError({ field: weekdays.length === 0 ? "weekdays" : "endTime", error: problem });
    if (!Number.isInteger(minutes) || !Number.isInteger(orders)) {
      return setLocalError({ field: "slots", error: "Enter whole numbers for how often and how many." });
    }
    startTransition(async () => {
      const saved = await saveRule({
        ruleId: draft.ruleId,
        ...placeInput(place),
        weekdays,
        startTime,
        endTime,
        opensHoursBefore: chosenOpens.hours,
        closesMinutesBefore: chosenCloses.minutes,
        slotMinutes: minutes,
        ordersPerSlot: orders,
        publicNote: draft.publicNote,
      });
      setResult(saved);
      if (saved.ok) onSaved();
    });
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate className="flex min-h-full flex-col">
      <div className="px-5 pt-6">
        <SheetTitle className="text-[1.6rem] leading-tight font-semibold tracking-[-0.02em]">
          {isEdit ? "Edit repeating stop" : "Repeat every week"}
        </SheetTitle>
        <SheetDescription className="mt-2">
          Set it once and these stops keep appearing, {RULE_HORIZON_DAYS} days ahead, until you switch it off. You can
          still cancel any single day.
        </SheetDescription>
      </div>

      <div className="mt-6 flex-1 divide-y divide-border border-t border-border">
        <Group title="Where">
          <PlaceCombobox value={place} onChange={setPlace} spots={spots} error={fieldError("place")} />
        </Group>

        <Group title="When" hint={`Times are in ${timeZone.replace(/_/g, " ")}.`}>
          <DayToggles legend="Days" value={weekdays} onChange={setWeekdays} invalid={Boolean(fieldError("weekdays"))} />
          <FieldError id="rule-days-error" message={fieldError("weekdays")} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rule-start" className="mb-1.5 block text-sm font-semibold">
                Starts
              </label>
              <input id="rule-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={nativeInput} />
            </div>
            <div>
              <label htmlFor="rule-end" className="mb-1.5 block text-sm font-semibold">
                Ends
              </label>
              <input
                id="rule-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-invalid={Boolean(fieldError("endTime"))}
                aria-describedby={fieldError("endTime") ? "rule-end-error" : undefined}
                className={nativeInput}
              />
            </div>
          </div>
          <FieldError id="rule-end-error" message={fieldError("endTime")} />
          {weekdays.length > 0 && endTime > startTime && (
            <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
              {weekdaysLabel(weekdays)}, {startTime} to {endTime}.
            </p>
          )}
        </Group>

        <Group title="Ordering window">
          <Chips
            legend="Preorders open"
            name="rule-opens"
            value={chosenOpens.key}
            onChange={(k) => setOpensKey(k as OpensKey)}
            options={opens.map((o) => ({ value: o.key, label: o.label }))}
          />
          <div className="mt-5">
            <Chips
              legend="Stop taking orders, before the end"
              name="rule-closes"
              value={chosenCloses.key}
              onChange={(k) => setClosesKey(k as ClosesKey)}
              options={closes.map((o) => ({ value: o.key, label: o.label }))}
            />
          </div>
        </Group>

        <Group title="Pickup slots">
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="rule-slot-minutes" label="Minutes apart" value={slotMinutes} onChange={setSlotMinutes} invalid={Boolean(fieldError("slots"))} />
            <NumberField id="rule-slot-orders" label="Orders per time" value={ordersPerSlot} onChange={setOrdersPerSlot} invalid={Boolean(fieldError("slots"))} />
          </div>
          <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
            {summary ? `Each day: ${summary}` : "Set the times above to see how many pickup times this makes."}
          </p>
          <FieldError id="rule-slots-error" message={fieldError("slots")} />
        </Group>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-surface px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <ErrorBanner message={bannerError} className="mb-3" />
        <Button type="button" disabled={pending} onClick={submit} className="h-12 w-full rounded-xl text-base font-semibold">
          {pending ? "Saving…" : isEdit ? "Save changes" : "Turn it on"}
        </Button>
      </div>
    </form>
  );
}
