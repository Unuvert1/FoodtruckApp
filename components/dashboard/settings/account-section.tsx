"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { leaveTruck } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { FieldRow } from "@/components/dashboard/settings/field-row";
import { Section } from "@/components/dashboard/settings/section";
import { Button } from "@/components/ui/button";

type Props = {
  email: string | null;
  truckName: string;
  role: "OWNER" | "STAFF";
  devBypass: boolean; // login is off in development: there is no session to end
};

export function AccountSection({ email, truckName, role, devBypass }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function leave() {
    setError(null);
    startTransition(async () => {
      const result = await leaveTruck();
      if (result.ok) router.replace("/dashboard");
      else setError(result.error);
    });
  }

  return (
    <Section title="Your account" description="You, rather than the truck.">
      <FieldRow label="Signed in as">
        <p className="pt-3 text-base break-words">
          {email ?? <span className="text-muted-foreground">{devBypass ? "Demo login (no email)" : "Email unavailable"}</span>}
        </p>
      </FieldRow>
      <FieldRow label="Truck">
        <p className="pt-3 text-base">{truckName}</p>
      </FieldRow>
      <FieldRow label="Your role" hint={role === "OWNER" ? "Owners can change every setting and manage the team." : "Staff can work orders, the menu and the schedule."}>
        <p className="pt-3 text-base">{role === "OWNER" ? "Owner" : "Staff"}</p>
      </FieldRow>
      {!devBypass && (
        <FieldRow label="Session">
          <SignOutButton redirectUrl="/">
            <Button type="button" variant="secondary" className="h-11 rounded-xl px-5 text-base font-semibold">
              Sign out
            </Button>
          </SignOutButton>
        </FieldRow>
      )}
      <FieldRow label="Leave this truck" hint="You lose access to this dashboard. An owner can invite you back.">
        {confirming ? (
          <div role="alertdialog" aria-label="Confirm leaving the truck">
            <p className="text-sm">
              Leave <strong className="font-semibold">{truckName}</strong>? You will lose access right away.
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="destructive" disabled={pending} onClick={leave} className="h-11 rounded-xl px-5 text-base font-semibold">
                {pending ? "Leaving…" : "Leave truck"}
              </Button>
              <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirming(false)} className="h-11 rounded-xl px-4 text-base">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setError(null);
              setConfirming(true);
            }}
            className="h-11 rounded-xl px-5 text-base font-semibold text-destructive hover:text-destructive"
          >
            Leave this truck…
          </Button>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </FieldRow>
    </Section>
  );
}
