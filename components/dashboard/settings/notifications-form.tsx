"use client";

import { useState, useTransition } from "react";
import { saveNotifications } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { FieldRow, inputClass } from "@/components/dashboard/settings/field-row";
import { SaveRow, type SaveState } from "@/components/dashboard/settings/save-row";
import { Section } from "@/components/dashboard/settings/section";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function NotificationsForm({ notificationEmail }: { notificationEmail: string | null }) {
  const [enabled, setEnabled] = useState(notificationEmail !== null);
  const [email, setEmail] = useState(notificationEmail ?? "");
  const [result, setResult] = useState<SaveState>(null);
  const [pending, startTransition] = useTransition();

  const dirty = enabled !== (notificationEmail !== null) || (enabled && email.trim() !== (notificationEmail ?? ""));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => setResult(await saveNotifications({ enabled, email })));
  }

  return (
    <form onSubmit={submit} noValidate>
      <Section title="Notifications" description="How we tell you a new online order came in.">
        <FieldRow label="New order emails" htmlFor="notify-enabled">
          <div className="flex h-12 items-center gap-3">
            <Switch
              id="notify-enabled"
              disabled={pending}
              checked={enabled}
              onCheckedChange={(checked) => {
                setEnabled(checked);
                setResult(null);
                // Turning off saves right away (a switch that needs a Save button lies).
                // Turning on waits for an address.
                if (!checked) startTransition(async () => setResult(await saveNotifications({ enabled: false, email })));
              }}
            />
            <span className="text-base">{enabled ? "On" : "Off"}</span>
          </div>
        </FieldRow>
        {enabled && (
          <FieldRow label="Email address" htmlFor="notify-email" hint="We email this address every time a new online order comes in.">
            <Input
              id="notify-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setResult(null);
              }}
              placeholder="you@yourtruck.com"
              aria-invalid={result !== null && !result.ok}
              className={inputClass}
            />
          </FieldRow>
        )}
        <SaveRow
          dirty={dirty}
          pending={pending}
          result={result}
          successText={enabled ? "Saved. New orders will be emailed here." : "Saved. Order emails are off."}
        />
      </Section>
    </form>
  );
}
