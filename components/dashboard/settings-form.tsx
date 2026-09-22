"use client";

import { useState, useTransition } from "react";
import { saveNotificationEmail, type ActionResult } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({ notificationEmail }: { notificationEmail: string | null }) {
  const [email, setEmail] = useState(notificationEmail ?? "");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => setResult(await saveNotificationEmail(email)));
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 rounded-2xl bg-surface p-5">
      <h2 className="font-display text-xl font-bold">Order emails</h2>
      <p className="mt-1 text-sm text-muted-foreground">We email this address every time a new online order comes in.</p>
      <Label htmlFor="notify-email" className="mt-4 mb-2 font-semibold">
        Email address
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
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
          className="h-12 flex-1 rounded-xl px-3.5 text-base"
        />
        <Button type="submit" disabled={pending} className="h-12 rounded-xl px-5 text-base font-semibold">
          {pending ? "Saving…" : "Save email"}
        </Button>
      </div>
      {result && (
        <p role="status" className={result.ok ? "mt-2 text-sm text-ready" : "mt-2 text-sm font-medium text-destructive"}>
          {result.ok ? (email.trim() ? "Saved. New orders will be emailed here." : "Saved. Order emails are off.") : result.error}
        </p>
      )}
    </form>
  );
}
