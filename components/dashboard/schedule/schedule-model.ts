// Pure helpers for the Schedule screen: status labels, repeat dates, and the
// ordering-window presets (which the actions want as plain numbers).

import { MAX_OPENS_HOURS_BEFORE, closesMinutesBeforeOf, opensHoursBeforeOf } from "@/lib/schedule/ordering-window";
import { addDaysToDateKey, toZonedDateInput, toZonedTimeInput, zonedDateKey, zonedTimeFromParts } from "@/lib/time";
import type { ScheduleRow, Service, StopDraft } from "@/lib/types";

export type StopStatusView = { label: "Draft" | "Published" | "Live" | "Done" | "Cancelled"; tone: "draft" | "published" | "live" | "quiet" };

export function statusView(service: Service, now: Date): StopStatusView {
  if (service.status === "CANCELLED") return { label: "Cancelled", tone: "quiet" };
  if (new Date(service.endsAt) <= now) return service.status === "DRAFT" ? { label: "Draft", tone: "draft" } : { label: "Done", tone: "quiet" };
  if (service.status === "DRAFT") return { label: "Draft", tone: "draft" };
  const live = service.status === "LIVE" || (new Date(service.startsAt) <= now && now < new Date(service.endsAt));
  return live ? { label: "Live", tone: "live" } : { label: "Published", tone: "published" };
}

export function draftFromService(service: Service, timeZone: string): StopDraft {
  const startsAt = new Date(service.startsAt);
  const endsAt = new Date(service.endsAt);
  return {
    serviceId: service.id,
    locationId: service.locationId,
    date: toZonedDateInput(startsAt, timeZone),
    startTime: toZonedTimeInput(startsAt, timeZone),
    endTime: toZonedTimeInput(endsAt, timeZone),
    opensHoursBefore: opensHoursBeforeOf(startsAt, new Date(service.orderingOpensAt)),
    closesMinutesBefore: closesMinutesBeforeOf(endsAt, new Date(service.orderingClosesAt)),
    slotMinutes: service.slotMinutes,
    ordersPerSlot: service.ordersPerSlot,
    publicNote: service.publicNote,
  };
}

/** Whole weeks to jump so a repeat lands today or later, and not on a day this spot already has a stop. */
export function repeatWeeks(service: Service, rows: ScheduleRow[], timeZone: string, now: Date): number {
  const base = toZonedDateInput(service.startsAt, timeZone);
  const today = zonedDateKey(now, timeZone);
  const taken = new Set(
    rows
      .filter((r) => r.service.locationId === service.locationId && r.service.status !== "CANCELLED")
      .map((r) => zonedDateKey(r.service.startsAt, timeZone))
  );
  for (let weeks = 1; weeks < 52; weeks++) {
    const date = addDaysToDateKey(base, weeks * 7);
    if (date >= today && !taken.has(date)) return weeks;
  }
  return 52;
}

// ─── Ordering-window presets ───────────────────────────────────────────────

export type OpensKey = "now" | "evening" | "morning" | "two" | "custom";
export type ClosesKey = "15" | "30" | "60" | "custom";

export type OpensOption = { key: OpensKey; label: string; hours: number };
export type ClosesOption = { key: ClosesKey; label: string; minutes: number };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

/** "Evening before" is 6 pm the day before and "morning of" is 8 am, so the hours depend on the start. */
export function opensOptions(date: string, startTime: string, timeZone: string, customHours: number | null): OpensOption[] {
  let evening = 17;
  let morning = 3;
  if (DATE.test(date) && TIME.test(startTime)) {
    const start = zonedTimeFromParts(timeZone, date, startTime).getTime();
    const hoursFrom = (at: Date) => Math.round((start - at.getTime()) / 3_600_000);
    evening = hoursFrom(zonedTimeFromParts(timeZone, addDaysToDateKey(date, -1), "18:00"));
    morning = hoursFrom(zonedTimeFromParts(timeZone, date, "08:00"));
  }
  const options: OpensOption[] = [{ key: "now", label: "Right away", hours: 0 }];
  if (evening > 0 && evening <= MAX_OPENS_HOURS_BEFORE) options.push({ key: "evening", label: "The evening before", hours: evening });
  if (morning > 0) options.push({ key: "morning", label: "The morning of", hours: morning });
  options.push({ key: "two", label: "2 hours before", hours: 2 });
  if (customHours !== null) options.push({ key: "custom", label: `${customHours} hours before`, hours: customHours });
  return options;
}

export const CLOSES_PRESETS: ClosesOption[] = [
  { key: "15", label: "15 minutes", minutes: 15 },
  { key: "30", label: "30 minutes", minutes: 30 },
  { key: "60", label: "60 minutes", minutes: 60 },
];

export function closesOptions(customMinutes: number | null): ClosesOption[] {
  return customMinutes === null ? CLOSES_PRESETS : [...CLOSES_PRESETS, { key: "custom", label: `${customMinutes} minutes`, minutes: customMinutes }];
}

/** Which preset an existing number corresponds to; anything else is carried as a custom value. */
export function opensKeyFor(hours: number, options: OpensOption[]): OpensKey {
  return options.find((o) => o.key !== "custom" && o.hours === hours)?.key ?? "custom";
}

export function closesKeyFor(minutes: number): ClosesKey {
  return CLOSES_PRESETS.find((o) => o.minutes === minutes)?.key ?? "custom";
}
