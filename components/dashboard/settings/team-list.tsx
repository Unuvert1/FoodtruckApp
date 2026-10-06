"use client";

import { useState, useTransition } from "react";
import { removeMember, saveMemberRole } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { Section } from "@/components/dashboard/settings/section";
import { Button } from "@/components/ui/button";
import type { TeamMember } from "@/lib/types";

const ROLE_LABELS = { OWNER: "Owner", STAFF: "Staff" } as const;

export function TeamList({ members, currentUserId, timezone }: { members: TeamMember[]; currentUserId: string; timezone: string }) {
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => ReturnType<typeof removeMember>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      else setConfirmingId(null);
    });
  }

  const joined = (iso: string) =>
    new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));

  return (
    <Section title="Team" description="Everyone who can sign in to this truck's dashboard.">
      {members.map((member) => {
        const isYou = member.clerkUserId === currentUserId;
        return (
          <div key={member.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate text-base font-medium">
                  {isYou ? "You" : `Member ${member.clerkUserId.slice(-6)}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {ROLE_LABELS[member.role]} · joined {joined(member.joinedAt)}
                </p>
              </div>
              {!isYou && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run(() => saveMemberRole({ membershipId: member.id, role: member.role === "OWNER" ? "STAFF" : "OWNER" }))}
                    className="h-11 rounded-xl px-4 text-sm font-semibold"
                  >
                    {member.role === "OWNER" ? "Make staff" : "Make owner"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => setConfirmingId(confirmingId === member.id ? null : member.id)}
                    className="h-11 rounded-xl px-4 text-sm font-semibold text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
            {confirmingId === member.id && (
              <div role="alertdialog" aria-label="Confirm removal" className="mt-3 border-t border-border pt-3">
                <p className="text-sm">They will lose access to this dashboard right away.</p>
                <div className="mt-2 flex gap-2">
                  <Button type="button" variant="destructive" disabled={pending} onClick={() => run(() => removeMember(member.id))} className="h-11 rounded-xl px-5 text-sm font-semibold">
                    {pending ? "Removing…" : "Remove member"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setConfirmingId(null)} className="h-11 rounded-xl px-4 text-sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {error && (
        <p role="alert" className="px-5 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {/* TODO(stream C): invite by email (an Invite model, a Resend email, and an accept route). */}
      <p className="px-5 py-4 text-sm text-muted-foreground">
        New members can&apos;t be invited yet. Invites are coming; for now, ask us to add someone.
      </p>
    </Section>
  );
}
