"use client";

// The form furniture the stop sheet and the repeating-stop sheet share. Pulled
// out when the second sheet arrived rather than copied, so the two keep looking
// like one screen.

import { TextField } from "@/components/dashboard/place-combobox";
import { cn } from "@/lib/utils";

export const nativeInput =
  "h-12 w-full min-w-0 rounded-xl border border-input bg-surface px-3.5 text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40 aria-invalid:border-destructive";

export function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-6">
      <h3 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

export function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" data-field-error className="mt-1.5 text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
}) {
  return (
    <TextField
      id={id}
      label={label}
      value={value}
      onChange={(v) => onChange(v.replace(/\D/g, "").slice(0, 3))}
      inputMode="numeric"
      aria-invalid={invalid}
      className={cn("tabular-nums")}
    />
  );
}

/** Radio inputs dressed as chips: native arrow-key behaviour, no ARIA to get wrong. */
export function Chips({
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

/** Checkboxes dressed the same way, for picking several weekdays at once. */
export function DayToggles({
  legend,
  value,
  onChange,
  invalid,
}: {
  legend: string;
  value: number[];
  onChange: (days: number[]) => void;
  invalid?: boolean;
}) {
  // Monday first: a trading week reads Mon–Sun, not Sun–Sat.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {order.map((day) => {
          const on = value.includes(day);
          return (
            <label key={day} className="relative">
              <input
                type="checkbox"
                checked={on}
                aria-invalid={invalid}
                onChange={() => onChange(on ? value.filter((d) => d !== day) : [...value, day])}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-input text-[0.9375rem] font-semibold transition-colors select-none peer-checked:border-transparent peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-4 peer-focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                {labels[day]}
              </span>
              <span className="sr-only">{names[day]}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
