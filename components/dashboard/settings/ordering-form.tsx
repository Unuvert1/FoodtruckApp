"use client";

import { useState, useTransition } from "react";
import { saveOrdering } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { FieldRow, inputClass } from "@/components/dashboard/settings/field-row";
import { SaveRow, type SaveState } from "@/components/dashboard/settings/save-row";
import { Section } from "@/components/dashboard/settings/section";
import { Input } from "@/components/ui/input";
import type { OrderingDefaults } from "@/lib/types";

type NumberField = Exclude<keyof OrderingDefaults, "timezone">;

const NUMBER_FIELDS: { key: NumberField; label: string; unit: string; hint: string }[] = [
  { key: "defaultSlotMinutes", label: "Pickup slot length", unit: "minutes", hint: "How long each pickup window is." },
  { key: "defaultOrdersPerSlot", label: "Orders per slot", unit: "orders", hint: "How many orders your kitchen can turn out in one slot." },
  { key: "orderingOpensHoursBefore", label: "Ordering opens", unit: "hours before", hint: "How long before a service starts customers can order." },
  { key: "orderingClosesMinutesBefore", label: "Ordering closes", unit: "minutes before", hint: "How long before a service ends orders stop." },
  { key: "slotLeadMinutes", label: "Minimum lead time", unit: "minutes", hint: "The soonest a customer can pick up. Applies to every order right away." },
];

export function OrderingForm({ defaults, timezones }: { defaults: OrderingDefaults; timezones: string[] }) {
  const [timezone, setTimezone] = useState(defaults.timezone);
  const [values, setValues] = useState<Record<NumberField, string>>(() => {
    const out = {} as Record<NumberField, string>;
    for (const f of NUMBER_FIELDS) out[f.key] = String(defaults[f.key]);
    return out;
  });
  const [result, setResult] = useState<SaveState>(null);
  const [pending, startTransition] = useTransition();

  const dirty = timezone !== defaults.timezone || NUMBER_FIELDS.some((f) => values[f.key].trim() !== String(defaults[f.key]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Non-numeric text becomes NaN, which the server's Zod schema rejects with a clear message.
    const toInt = (text: string) => (/^\d{1,5}$/.test(text.trim()) ? Number(text.trim()) : Number.NaN);
    startTransition(async () =>
      setResult(
        await saveOrdering({
          timezone,
          defaultSlotMinutes: toInt(values.defaultSlotMinutes),
          defaultOrdersPerSlot: toInt(values.defaultOrdersPerSlot),
          orderingOpensHoursBefore: toInt(values.orderingOpensHoursBefore),
          orderingClosesMinutesBefore: toInt(values.orderingClosesMinutesBefore),
          slotLeadMinutes: toInt(values.slotLeadMinutes),
        })
      )
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <Section title="Ordering" description="Your time zone, and the defaults every new service starts from. Changing a default never touches a service you have already set up.">
        <FieldRow label="Time zone" htmlFor="timezone" hint="Every time on your dashboard and ordering page is shown in this zone.">
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value);
              setResult(null);
            }}
            className="h-12 w-full rounded-xl border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </FieldRow>

        {NUMBER_FIELDS.map((f) => (
          <FieldRow key={f.key} label={f.label} htmlFor={f.key} hint={f.hint}>
            <div className="flex items-center gap-3">
              <Input
                id={f.key}
                inputMode="numeric"
                value={values[f.key]}
                onChange={(e) => {
                  setValues((v) => ({ ...v, [f.key]: e.target.value }));
                  setResult(null);
                }}
                maxLength={5}
                className={`${inputClass} max-w-28 tabular-nums`}
              />
              <span className="text-sm text-muted-foreground">{f.unit}</span>
            </div>
          </FieldRow>
        ))}

        <SaveRow dirty={dirty} pending={pending} result={result} />
      </Section>
    </form>
  );
}
