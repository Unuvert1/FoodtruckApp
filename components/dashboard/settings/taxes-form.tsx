"use client";

import { useState, useTransition } from "react";
import { saveTaxRate } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { FieldRow, inputClass } from "@/components/dashboard/settings/field-row";
import { SaveRow, type SaveState } from "@/components/dashboard/settings/save-row";
import { Section } from "@/components/dashboard/settings/section";
import { Input } from "@/components/ui/input";
import { bpsToPercentInput } from "@/lib/money";

export function TaxesForm({ taxRateBps, platformFeeBps }: { taxRateBps: number; platformFeeBps: number }) {
  const initial = bpsToPercentInput(taxRateBps);
  const [percent, setPercent] = useState(initial);
  const [result, setResult] = useState<SaveState>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => setResult(await saveTaxRate(percent)));
  }

  return (
    <form onSubmit={submit} noValidate>
      <Section title="Taxes & fees" description="Added to every order at checkout.">
        <FieldRow label="Sales tax rate" htmlFor="tax-rate" hint="Applies to new orders. Orders already placed keep the rate they were charged.">
          <div className="flex items-center gap-2">
            <Input
              id="tax-rate"
              inputMode="decimal"
              value={percent}
              onChange={(e) => {
                setPercent(e.target.value);
                setResult(null);
              }}
              placeholder="8.25"
              maxLength={6}
              aria-invalid={result !== null && !result.ok}
              className={`${inputClass} max-w-32`}
            />
            <span className="text-base text-muted-foreground">%</span>
          </div>
        </FieldRow>
        <FieldRow label="Platform fee" hint="Set by FoodtruckApp. You can't change it here.">
          <p className="pt-3 text-base tabular-nums">{bpsToPercentInput(platformFeeBps)}%</p>
        </FieldRow>
        <SaveRow dirty={percent.trim() !== initial} pending={pending} result={result} successText="Saved. New orders use this rate." />
      </Section>
    </form>
  );
}
