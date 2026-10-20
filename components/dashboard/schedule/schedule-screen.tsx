"use client";

import { useState, useTransition } from "react";
import { Menu } from "@base-ui/react/menu";
import { Ellipsis, Plus } from "lucide-react";
import { archiveSpot, repeatStop, setStopStatus } from "@/app/(dashboard)/dashboard/(app)/schedule/actions";
import { singleLineAddress } from "@/lib/service";
import { formatDayParts, formatTimeRange } from "@/lib/time";
import type { Location, ScheduleRow, StopDraft } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { SpotSheet, type SpotEditing } from "@/components/dashboard/schedule/spot-sheet";
import { StopSheet, type StopEditing } from "@/components/dashboard/schedule/stop-sheet";
import { draftFromService, repeatWeeks, statusView, type StopStatusView } from "@/components/dashboard/schedule/schedule-model";

type Props = {
  rows: ScheduleRow[];
  spots: Location[];
  timeZone: string;
  /** What a brand-new stop starts with, from the vendor's latest one. */
  newDraft: StopDraft;
  /** Server time as an ISO string, so server and client agree on what is upcoming. */
  nowIso: string;
};

export function ScheduleScreen({ rows, spots, timeZone, newDraft, nowIso }: Props) {
  const now = new Date(nowIso);
  const [stop, setStop] = useState<StopEditing | null>(null);
  const [spot, setSpot] = useState<SpotEditing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [opened, setOpened] = useState(0);

  const upcoming = rows.filter((r) => new Date(r.service.endsAt) > now);
  const past = rows.filter((r) => new Date(r.service.endsAt) <= now).reverse();

  function openStop(next: Omit<StopEditing, "key">) {
    setOpened((n) => n + 1);
    setStop({ ...next, key: `${opened}` });
  }

  function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong. Try again.");
      setBusyId(null);
    });
  }

  function repeat(row: ScheduleRow) {
    setError(null);
    setBusyId(row.service.id);
    startTransition(async () => {
      const weeks = repeatWeeks(row.service, rows, timeZone, now);
      const result = await repeatStop({ serviceId: row.service.id, weeks });
      setBusyId(null);
      if (!result.ok) return setError(result.error);
      // A one-off note belongs to that day, not to the next one.
      openStop({ draft: { ...result.draft, publicNote: "" }, repeated: true });
    });
  }

  function togglePublished(row: ScheduleRow) {
    const next = row.service.status === "DRAFT" ? "PUBLISHED" : "DRAFT";
    run(row.service.id, () => setStopStatus({ serviceId: row.service.id, status: next }));
  }

  function cancelStop(row: ScheduleRow) {
    setCancelling(null);
    run(row.service.id, () => setStopStatus({ serviceId: row.service.id, status: "CANCELLED" }));
  }

  const renderRow = (row: ScheduleRow, isPast: boolean) => (
    <StopRow
      key={row.service.id}
      row={row}
      timeZone={timeZone}
      now={now}
      isPast={isPast}
      busy={pending && busyId === row.service.id}
      weeksAhead={repeatWeeks(row.service, rows, timeZone, now)}
      confirming={cancelling === row.service.id}
      onEdit={() => openStop({ draft: draftFromService(row.service, timeZone), row })}
      onRepeat={() => repeat(row)}
      onTogglePublished={() => togglePublished(row)}
      onAskCancel={() => setCancelling(row.service.id)}
      onKeep={() => setCancelling(null)}
      onCancel={() => cancelStop(row)}
    />
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[2rem] leading-none font-semibold tracking-[-0.03em]">Schedule</h1>
        <Button onClick={() => openStop({ draft: newDraft })} className="h-11 gap-1.5 rounded-full px-4.5 text-[0.9375rem] font-semibold">
          <Plus className="size-4" strokeWidth={2.5} />
          Add a stop
        </Button>
      </div>
      <p className="mt-2 text-[0.9375rem] text-muted-foreground">Where the truck will be, and when customers can order ahead.</p>

      <ErrorBanner message={error} className="mt-4" />

      <section className="mt-9" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="mb-2.5 px-1 text-[1.0625rem] font-semibold tracking-[-0.01em]">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl bg-surface/60 px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing scheduled. Add a stop and customers can order ahead.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">{upcoming.map((row) => renderRow(row, false))}</ul>
        )}
      </section>

      {past.length > 0 && (
        <details className="group mt-9 overflow-hidden rounded-2xl bg-surface">
          <summary className="cursor-pointer list-none px-4 py-3.5 font-medium outline-none select-none focus-visible:bg-muted">
            Earlier stops
            <span className="ml-2 text-muted-foreground tabular-nums">{past.length}</span>
            <span className="ml-2 text-sm text-muted-foreground">last 14 days</span>
          </summary>
          <ul className="divide-y divide-border border-t border-border">{past.map((row) => renderRow(row, true))}</ul>
        </details>
      )}

      <section className="mt-9" aria-labelledby="spots-heading">
        <div className="mb-2.5 flex items-baseline justify-between gap-4 px-1">
          <h2 id="spots-heading" className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
            Your spots
          </h2>
          <button
            type="button"
            onClick={() => {
              setOpened((n) => n + 1);
              setSpot({ key: `${opened}`, location: null });
            }}
            className="rounded-sm text-[0.9375rem] font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            Add a spot
          </button>
        </div>
        {spots.length === 0 ? (
          <p className="rounded-2xl bg-surface/60 px-4 py-6 text-center text-sm text-muted-foreground">
            Spots you park at show up here. Adding a stop saves its spot for next time.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-surface">
            {spots.map((location) => (
              <SpotRow
                key={location.id}
                location={location}
                onEdit={() => {
                  setOpened((n) => n + 1);
                  setSpot({ key: `${opened}`, location });
                }}
                onError={setError}
              />
            ))}
          </ul>
        )}
      </section>

      <StopSheet editing={stop} spots={spots} timeZone={timeZone} onClose={() => setStop(null)} />
      <SpotSheet editing={spot} onClose={() => setSpot(null)} />
    </div>
  );
}

// ─── Stops ─────────────────────────────────────────────────────────────────

const PILL: Record<StopStatusView["tone"], string> = {
  draft: "bg-cooking-tint text-cooking-ink",
  published: "bg-muted text-foreground",
  live: "bg-ok/12 text-ok",
  quiet: "bg-muted text-muted-foreground",
};

function StopRow({
  row,
  timeZone,
  now,
  isPast,
  busy,
  weeksAhead,
  confirming,
  onEdit,
  onRepeat,
  onTogglePublished,
  onAskCancel,
  onKeep,
  onCancel,
}: {
  row: ScheduleRow;
  timeZone: string;
  now: Date;
  isPast: boolean;
  busy: boolean;
  weeksAhead: number;
  confirming: boolean;
  onEdit: () => void;
  onRepeat: () => void;
  onTogglePublished: () => void;
  onAskCancel: () => void;
  onKeep: () => void;
  onCancel: () => void;
}) {
  const { service, location, orderCount } = row;
  const { weekday, day } = formatDayParts(service.startsAt, timeZone);
  const status = statusView(service, now);
  const editable = !isPast && service.status !== "CANCELLED";
  const draft = service.status === "DRAFT";
  const dim = isPast || service.status === "CANCELLED";

  const body = (
    <>
      <div className="w-10 shrink-0 text-center">
        <p className="text-xs font-medium text-muted-foreground">{weekday}</p>
        <p className="font-display text-[1.75rem] leading-none font-bold tabular-nums">{day}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-semibold", dim && "text-muted-foreground")}>{location.name}</p>
        <p className="text-sm text-muted-foreground tabular-nums">{formatTimeRange(service.startsAt, service.endsAt, timeZone)}</p>
        <p className="truncate text-sm text-muted-foreground">{singleLineAddress(location)}</p>
        <p className="mt-1.5 flex items-center gap-2 text-sm">
          <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold", PILL[status.tone])}>
            {status.tone === "live" && <span aria-hidden className="size-1.5 rounded-full bg-ok" />}
            {status.label}
          </span>
          {!draft && orderCount > 0 && (
            <span className="text-muted-foreground tabular-nums">
              {orderCount} {orderCount === 1 ? "order" : "orders"}
            </span>
          )}
        </p>
      </div>
    </>
  );

  return (
    <li className={cn("transition-opacity motion-reduce:transition-none", busy && "opacity-60")}>
      <div className="flex items-start gap-1 pr-2 pl-2">
        {editable ? (
          <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 items-start gap-4 rounded-xl px-2 py-3.5 text-left outline-none focus-visible:bg-muted/70 focus-visible:ring-4 focus-visible:ring-ring/30">
            {body}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-start gap-4 px-2 py-3.5">{body}</div>
        )}

        <Menu.Root>
          <Menu.Trigger
            aria-label={`Actions for ${location.name}, ${weekday} ${day}`}
            className="mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/40 data-[popup-open]:bg-muted"
          >
            <Ellipsis className="size-5" aria-hidden />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align="end" sideOffset={4} className="z-50">
              <Menu.Popup className="min-w-56 origin-(--transform-origin) rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground outline-none transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none">
                <MenuItem onClick={onRepeat}>{weeksAhead === 1 ? "Repeat next week" : `Repeat in ${weeksAhead} weeks`}</MenuItem>
                {editable && (
                  <>
                    <MenuItem onClick={onEdit}>Edit</MenuItem>
                    {draft ? (
                      <MenuItem onClick={onTogglePublished}>Publish</MenuItem>
                    ) : (
                      <MenuItem onClick={onTogglePublished} disabled={orderCount > 0}>
                        Unpublish
                        {orderCount > 0 && <span className="block text-xs font-normal text-muted-foreground">Has orders. Cancel it instead.</span>}
                      </MenuItem>
                    )}
                    <MenuItem onClick={onAskCancel} destructive>
                      Cancel stop
                    </MenuItem>
                  </>
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      {confirming && (
        <div role="alertdialog" aria-label="Confirm cancelling this stop" className="border-t border-border px-4 py-3.5">
          <p className="text-sm">
            {orderCount > 0 ? (
              <>
                <strong className="font-semibold">
                  {orderCount} {orderCount === 1 ? "customer has" : "customers have"} ordered
                </strong>{" "}
                for this stop. Cancelling it cancels {orderCount === 1 ? "their order" : "their orders"} too.
              </>
            ) : (
              "No one has ordered yet. Customers will no longer see this stop."
            )}
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button type="button" variant="destructive" onClick={onCancel} className="h-11 rounded-xl px-5 text-sm font-semibold">
              Cancel stop
            </Button>
            <Button type="button" variant="ghost" onClick={onKeep} className="h-11 rounded-xl px-4 text-sm">
              Keep it
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function MenuItem({ children, onClick, destructive, disabled }: { children: React.ReactNode; onClick: () => void; destructive?: boolean; disabled?: boolean }) {
  return (
    <Menu.Item
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-11 cursor-pointer flex-col justify-center rounded-xl px-3 text-[0.9375rem] font-medium outline-none select-none data-highlighted:bg-muted data-disabled:cursor-default data-disabled:text-muted-foreground",
        destructive && "text-destructive"
      )}
    >
      {children}
    </Menu.Item>
  );
}

// ─── Spots ─────────────────────────────────────────────────────────────────

function SpotRow({ location, onEdit, onError }: { location: Location; onEdit: () => void; onError: (message: string | null) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function archive() {
    onError(null);
    startTransition(async () => {
      const result = await archiveSpot({ locationId: location.id, archived: true });
      if (!result.ok) onError(result.error);
      setConfirming(false);
    });
  }

  return (
    <li className={cn(pending && "opacity-60")}>
      <div className="flex items-center gap-1 py-1.5 pr-2 pl-4">
        <div className="min-w-0 flex-1 py-1.5">
          <p className="truncate font-semibold">{location.name}</p>
          <p className="truncate text-sm text-muted-foreground">{singleLineAddress(location)}</p>
        </div>
        <button type="button" onClick={onEdit} className="h-11 shrink-0 rounded-full px-3.5 text-sm font-semibold text-brand outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40">
          Edit
        </button>
        <button
          type="button"
          onClick={() => setConfirming((c) => !c)}
          aria-expanded={confirming}
          className="h-11 shrink-0 rounded-full px-3.5 text-sm font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          Archive
        </button>
      </div>
      {confirming && (
        <div role="alertdialog" aria-label={`Confirm archiving ${location.name}`} className="border-t border-border px-4 py-3.5">
          <p className="text-sm">It leaves your list of spots. Stops already scheduled here stay as they are.</p>
          <div className="mt-2.5 flex gap-2">
            <Button type="button" variant="destructive" disabled={pending} onClick={archive} className="h-11 rounded-xl px-5 text-sm font-semibold">
              {pending ? "Archiving…" : "Archive spot"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)} className="h-11 rounded-xl px-4 text-sm">
              Keep it
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
