"use client";

import { useState, useTransition } from "react";
import { saveNotifications, sendTestNotification } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { FieldRow, inputClass } from "@/components/dashboard/settings/field-row";
import { SaveRow, type SaveState } from "@/components/dashboard/settings/save-row";
import { Section } from "@/components/dashboard/settings/section";
import { useUnsavedGuard } from "@/components/dashboard/settings/use-unsaved-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type Props = {
  notificationEmail: string | null;
  notifyNewOrder: boolean;
  notifyCancellation: boolean;
  notifyDailySummary: boolean;
};

export function NotificationsForm({ notificationEmail, notifyNewOrder, notifyCancellation, notifyDailySummary }: Props) {
  const [enabled, setEnabled] = useState(notificationEmail !== null);
  const [email, setEmail] = useState(notificationEmail ?? "");
  const [events, setEvents] = useState({ notifyNewOrder, notifyCancellation, notifyDailySummary });
  const [result, setResult] = useState<SaveState>(null);
  const [testResult, setTestResult] = useState<SaveState>(null);
  const [pending, startTransition] = useTransition();
  const [testing, startTesting] = useTransition();

  const dirty =
    enabled !== (notificationEmail !== null) ||
    (enabled &&
      (email.trim() !== (notificationEmail ?? "") ||
        events.notifyNewOrder !== notifyNewOrder ||
        events.notifyCancellation !== notifyCancellation ||
        events.notifyDailySummary !== notifyDailySummary));
  useUnsavedGuard(dirty);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => setResult(await saveNotifications({ enabled, email, ...events })));
  }

  function setEvent(key: keyof typeof events) {
    return (checked: boolean) => {
      setEvents((prev) => ({ ...prev, [key]: checked }));
      setResult(null);
    };
  }

  // The test goes to the saved address (what orders really use), so it needs a saved one and no pending edits.
  const canTest = notificationEmail !== null && !dirty && !pending && !testing;

  return (
    <form onSubmit={submit} noValidate>
      <Section title="Notifications" description="How we tell you what's happening with your orders.">
        <FieldRow label="Order emails" htmlFor="notify-enabled">
          <div className="flex h-12 items-center gap-3">
            <Switch
              id="notify-enabled"
              disabled={pending}
              checked={enabled}
              onCheckedChange={(checked) => {
                setEnabled(checked);
                setResult(null);
                setTestResult(null);
                // Turning off saves right away (a switch that needs a Save button lies).
                // Turning on waits for an address.
                if (!checked) startTransition(async () => setResult(await saveNotifications({ enabled: false, email, ...events })));
              }}
            />
            <span className="text-base">{enabled ? "On" : "Off"}</span>
          </div>
        </FieldRow>
        {enabled && (
          <>
            <FieldRow label="Email address" htmlFor="notify-email" hint="One address for everything below.">
              <Input
                id="notify-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setResult(null);
                  setTestResult(null);
                }}
                placeholder="you@yourtruck.com"
                aria-invalid={result !== null && !result.ok}
                className={inputClass}
              />
            </FieldRow>
            <EventRow id="notify-new-order" label="New orders" hint="Every time an online order comes in." checked={events.notifyNewOrder} onChange={setEvent("notifyNewOrder")} />
            <EventRow
              id="notify-cancellation"
              label="Cancellations"
              hint="Saved, but these emails aren't sent yet."
              checked={events.notifyCancellation}
              onChange={setEvent("notifyCancellation")}
            />
            <EventRow
              id="notify-daily"
              label="Daily summary"
              hint="Saved, but these emails aren't sent yet."
              checked={events.notifyDailySummary}
              onChange={setEvent("notifyDailySummary")}
            />
            <FieldRow
              label="Test"
              hint={
                notificationEmail === null
                  ? "Save an address to send a test."
                  : dirty
                    ? "Save your changes first. The test goes to the saved address."
                    : `Sends a test to ${notificationEmail}, so you know orders will reach you.`
              }
            >
              <Button
                type="button"
                variant="secondary"
                disabled={!canTest}
                onClick={() => {
                  setTestResult(null);
                  startTesting(async () => setTestResult(await sendTestNotification()));
                }}
                className="h-11 rounded-xl px-5 text-base font-semibold"
              >
                {testing ? "Sending…" : "Send test email"}
              </Button>
              {testResult && (
                <p role="status" className={testResult.ok ? "mt-2 text-sm text-ok" : "mt-2 text-sm font-medium text-destructive"}>
                  {testResult.ok ? (testResult.note ?? "Sent.") : testResult.error}
                </p>
              )}
            </FieldRow>
          </>
        )}
        <SaveRow
          dirty={dirty}
          pending={pending}
          result={result}
          successText={enabled ? "Saved. Order emails will go to this address." : "Saved. Order emails are off."}
        />
      </Section>
    </form>
  );
}

function EventRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <FieldRow label={label} htmlFor={id} hint={hint}>
      <div className="flex h-12 items-center gap-3">
        <Switch id={id} checked={checked} onCheckedChange={onChange} />
        <span className="text-base">{checked ? "On" : "Off"}</span>
      </div>
    </FieldRow>
  );
}
