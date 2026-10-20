"use client";

import { useState, useTransition } from "react";
import { closeTruck, reopenTruck } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { FieldRow, inputClass } from "@/components/dashboard/settings/field-row";
import type { SaveState } from "@/components/dashboard/settings/save-row";
import { Section } from "@/components/dashboard/settings/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Closing hides the storefront; nothing is deleted. Typing the name is the confirm, like GitHub. */
export function DangerZone({ truckName, closed }: { truckName: string; closed: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<SaveState>(null);
  const [pending, startTransition] = useTransition();

  const matches = typed.trim() === truckName;

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    startTransition(async () => {
      const done = await action();
      setResult(done);
      if (done.ok) {
        setConfirming(false);
        setTyped("");
      }
    });
  }

  const errorLine = result && !result.ok && (
    <p role="status" className="mt-2 text-sm font-medium text-destructive">
      {result.error}
    </p>
  );

  return (
    <Section
      title="Danger zone"
      description={closed ? "This truck is closed." : "Close the truck when you're done for good."}
      className="ring-1 ring-destructive/40"
    >
      {closed ? (
        <FieldRow label="Reopen truck" hint="Your ordering page comes back as it was. Menu, schedule and past orders were never removed.">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => run(reopenTruck)} className="h-11 rounded-xl px-5 text-base font-semibold">
            {pending ? "Reopening…" : "Reopen this truck"}
          </Button>
          {errorLine}
        </FieldRow>
      ) : (
        <FieldRow
          label="Close this truck"
          hint="Your ordering page stops working and customers can't order. Your menu, schedule and past orders are kept, and you can reopen any time."
        >
          {confirming ? (
            <form
              noValidate
              role="alertdialog"
              aria-label="Confirm closing the truck"
              onSubmit={(e) => {
                e.preventDefault();
                if (matches) run(() => closeTruck({ confirmName: typed }));
              }}
            >
              <label htmlFor="close-confirm" className="text-sm">
                Type <strong className="font-semibold">{truckName}</strong> to confirm.
              </label>
              <Input
                id="close-confirm"
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value);
                  setResult(null);
                }}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={result !== null && !result.ok}
                className={`${inputClass} mt-2`}
              />
              <div className="mt-3 flex gap-2">
                <Button type="submit" variant="destructive" disabled={!matches || pending} className="h-11 rounded-xl px-5 text-base font-semibold">
                  {pending ? "Closing…" : "Close this truck"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    setConfirming(false);
                    setTyped("");
                    setResult(null);
                  }}
                  className="h-11 rounded-xl px-4 text-base"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirming(true)}
              className="h-11 rounded-xl px-5 text-base font-semibold text-destructive hover:text-destructive"
            >
              Close this truck…
            </Button>
          )}
          {errorLine}
        </FieldRow>
      )}
    </Section>
  );
}
