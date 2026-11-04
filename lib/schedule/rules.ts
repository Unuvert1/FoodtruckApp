// When a standing commitment ("Tuesdays and Thursdays, 11:00–14:00") falls due.
//
// Pure: no database, no clock of its own. A rule stores wall-clock times and
// weekdays rather than instants, so 11am stays 11am when the clocks change —
// the instants are worked out per date, through the truck's timezone.

import { addDaysToDateKey, zonedDateKey, zonedTimeFromParts } from "@/lib/time";

export type RuleSpec = {
  weekdays: number[]; // 0 = Sunday … 6 = Saturday
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm", later the same day
};

/** How far ahead stops are created. Two weeks is enough that a missed daily run never shows. */
export const RULE_HORIZON_DAYS = 14;

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The weekday of a "YYYY-MM-DD" key. No timezone involved: a calendar date has one weekday. */
export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * The local dates this rule covers, from today through the horizon inclusive.
 * Starts at today rather than tomorrow: a rule switched on at 9am should put
 * today's lunch stop up, not wait until next week.
 */
export function ruleDates(rule: RuleSpec, timeZone: string, now: Date, horizonDays = RULE_HORIZON_DAYS): string[] {
  const wanted = new Set(rule.weekdays);
  const today = zonedDateKey(now, timeZone);
  const dates: string[] = [];
  for (let i = 0; i <= horizonDays; i++) {
    const key = addDaysToDateKey(today, i);
    if (wanted.has(weekdayOf(key))) dates.push(key);
  }
  return dates;
}

/** The instants a rule's stop occupies on one local date. */
export function ruleTimes(rule: RuleSpec, timeZone: string, dateKey: string): { startsAt: Date; endsAt: Date } {
  return {
    startsAt: zonedTimeFromParts(timeZone, dateKey, rule.startTime),
    endsAt: zonedTimeFromParts(timeZone, dateKey, rule.endTime),
  };
}

/** "Tue, Thu" — or "Every day" and "Weekdays", which read better than listing them. */
export function weekdaysLabel(weekdays: number[]): string {
  const days = [...new Set(weekdays)].sort((a, b) => a - b);
  if (days.length === 0) return "No days";
  if (days.length === 7) return "Every day";
  if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return "Weekdays";
  if (days.length === 2 && days[0] === 0 && days[1] === 6) return "Weekends";
  return days.map((d) => SHORT[d]).join(", ");
}

/** Why this rule can't be saved, in a sentence a vendor can act on. */
export function ruleProblem(rule: RuleSpec): string | null {
  if (rule.weekdays.length === 0) return "Pick at least one day of the week.";
  if (rule.weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return "That isn't a day of the week.";
  if (!/^\d{2}:\d{2}$/.test(rule.startTime) || !/^\d{2}:\d{2}$/.test(rule.endTime)) return "Enter a start and end time.";
  if (rule.endTime <= rule.startTime) return "The end time has to be after the start time.";
  return null;
}
