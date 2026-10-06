// A stop's ordering window, from the two numbers the form asks for:
// "preorders open N hours before" (0 = right away) and "stop taking orders
// N minutes before the end". The defaults for both live on the Truck.

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

export const MAX_OPENS_HOURS_BEFORE = 336; // two weeks
export const MAX_CLOSES_MINUTES_BEFORE = 1440;

type Input = {
  startsAt: Date;
  endsAt: Date;
  opensHoursBefore: number;
  closesMinutesBefore: number;
  now: Date;
  /** When editing: a stop that already opened keeps its opening time instead of resetting to now. */
  existingOpensAt?: Date;
};

export function resolveOrderingWindow(input: Input): { opensAt: Date; closesAt: Date } | { error: string } {
  const { startsAt, endsAt, opensHoursBefore, closesMinutesBefore, now, existingOpensAt } = input;

  const closesAt = new Date(endsAt.getTime() - closesMinutesBefore * MINUTE);
  const opensAt =
    opensHoursBefore === 0
      ? existingOpensAt && existingOpensAt <= now
        ? existingOpensAt
        : now
      : new Date(startsAt.getTime() - opensHoursBefore * HOUR);

  if (closesAt <= startsAt) return { error: "Ordering would close before the stop starts. Pick a shorter cut-off." };
  if (opensAt >= closesAt) return { error: "Ordering would close before it opens. Open it earlier, or close it later." };
  return { opensAt, closesAt };
}

/** The "opens N hours before" value to show when editing an existing stop. */
export function opensHoursBeforeOf(startsAt: Date, opensAt: Date): number {
  const hours = Math.round((startsAt.getTime() - opensAt.getTime()) / HOUR);
  return Math.min(MAX_OPENS_HOURS_BEFORE, Math.max(0, hours));
}

export function closesMinutesBeforeOf(endsAt: Date, closesAt: Date): number {
  const minutes = Math.round((endsAt.getTime() - closesAt.getTime()) / MINUTE);
  return Math.min(MAX_CLOSES_MINUTES_BEFORE, Math.max(0, minutes));
}
