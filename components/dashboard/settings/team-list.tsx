"use client";

import { useState, useTransition } from "react";
import { inviteMember, removeMember, resendInvite, revokePendingInvite, saveMemberRole } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { FieldRow, inputClass } from "@/components/dashboard/settings/field-row";
import { SaveRow, type SaveState } from "@/components/dashboard/settings/save-row";
import { Section } from "@/components/dashboard/settings/section";
import { useUnsavedGuard } from "@/components/dashboard/settings/use-unsaved-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PendingInvite, TeamMember } from "@/lib/types";

const ROLE_LABELS = { OWNER: "Owner", STAFF: "Staff" } as const;

type Props = {
  members: TeamMember[];
  invites: PendingInvite[];
  currentUserId: string;
  timezone: string;
  appUrl: string;
};

export function TeamList({ members, invites, currentUserId, timezone, appUrl }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<Record<string, SaveState>>({});
  const [pending, startTransition] = useTransition();

  function run(action: () => ReturnType<typeof removeMember>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      else setConfirmingId(null);
    });
  }

  function runInvite(inviteId: string, action: () => Promise<NonNullable<SaveState>>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      setInviteResult((prev) => ({ ...prev, [inviteId]: result }));
      setConfirmingId(null);
    });
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));

  return (
    <div className="space-y-6">
      <Section title="Team" description="Everyone who can sign in to this truck's dashboard.">
        {members.map((member) => {
          const isYou = member.clerkUserId === currentUserId;
          // Older members have no stored email, so fall back to a piece of their id.
          const name = member.email ?? `Member ${member.clerkUserId.slice(-6)}`;
          return (
            <div key={member.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-base font-medium">{isYou ? "You" : name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {isYou && member.email ? `${member.email} · ` : ""}
                    {ROLE_LABELS[member.role]} · joined {formatDate(member.joinedAt)}
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
      </Section>

      {invites.length > 0 && (
        <Section title="Pending invites" description="They join as soon as they open the link and sign in.">
          {invites.map((invite) => {
            const result = inviteResult[invite.id] ?? null;
            const key = `invite:${invite.id}`;
            return (
              <div key={invite.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-base font-medium">{invite.email}</p>
                    <p className={invite.expired ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"}>
                      {ROLE_LABELS[invite.role]} · {invite.expired ? "expired" : "expires"} {formatDate(invite.expiresAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => runInvite(invite.id, () => resendInvite(invite.id))}
                      className="h-11 rounded-xl px-4 text-sm font-semibold"
                    >
                      Resend
                    </Button>
                    <CopyLinkButton url={`${appUrl}/invite/${invite.token}`} disabled={pending || invite.expired} />
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => setConfirmingId(confirmingId === key ? null : key)}
                      className="h-11 rounded-xl px-4 text-sm font-semibold text-destructive hover:text-destructive"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
                {confirmingId === key && (
                  <div role="alertdialog" aria-label="Confirm revoking the invite" className="mt-3 border-t border-border pt-3">
                    <p className="text-sm">The link in their email will stop working.</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={pending}
                        onClick={() => runInvite(invite.id, async () => {
                          const done = await revokePendingInvite(invite.id);
                          return done.ok ? { ok: true as const, note: "Revoked." } : done;
                        })}
                        className="h-11 rounded-xl px-5 text-sm font-semibold"
                      >
                        {pending ? "Revoking…" : "Revoke invite"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setConfirmingId(null)} className="h-11 rounded-xl px-4 text-sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {result && (
                  <p role="status" className={result.ok ? "mt-2 text-sm text-ok" : "mt-2 text-sm font-medium text-destructive"}>
                    {result.ok ? (result.note ?? "Done.") : result.error}
                  </p>
                )}
              </div>
            );
          })}
        </Section>
      )}

      <InviteForm />
    </div>
  );
}

function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"OWNER" | "STAFF">("STAFF");
  const [result, setResult] = useState<SaveState>(null);
  const [pending, startTransition] = useTransition();

  const dirty = email.trim() !== "";
  useUnsavedGuard(dirty);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const sent = await inviteMember({ email, role });
      setResult(sent);
      if (sent.ok) setEmail("");
    });
  }

  return (
    <form onSubmit={submit} noValidate>
      <Section title="Invite someone" description="We email them a link that works for 7 days.">
        <FieldRow label="Email" htmlFor="invite-email">
          <Input
            id="invite-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setResult(null);
            }}
            placeholder="sam@example.com"
            aria-invalid={result !== null && !result.ok}
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="Role" htmlFor="invite-role" hint={role === "OWNER" ? "Owners can change every setting and manage the team." : "Staff can work orders, the menu and the schedule."}>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as "OWNER" | "STAFF");
              setResult(null);
            }}
            className={`${inputClass} w-full border border-input bg-transparent`}
          >
            <option value="STAFF">Staff</option>
            <option value="OWNER">Owner</option>
          </select>
        </FieldRow>
        <SaveRow dirty={dirty} pending={pending} result={result} label="Send invite" successText="Invite sent." />
      </Section>
    </form>
  );
}

function CopyLinkButton({ url, disabled }: { url: string; disabled: boolean }) {
  const [copied, setCopied] = useState<"yes" | "no" | null>(null);

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied("yes");
        } catch {
          setCopied("no"); // clipboard blocked: the link is still on the invite email
        }
        setTimeout(() => setCopied(null), 2500);
      }}
      className="h-11 rounded-xl px-4 text-sm font-semibold"
    >
      {copied === "yes" ? "Copied" : copied === "no" ? "Couldn't copy" : "Copy link"}
    </Button>
  );
}
