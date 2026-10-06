// Every timestamp is stored in UTC and displayed in the truck's timezone.
// Always pass the truck's timezone explicitly. Never rely on the server's
// or browser's local zone.

type DateInput = string | Date;

const toDate = (d: DateInput) => (typeof d === "string" ? new Date(d) : d);

export function formatTime(d: DateInput, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  })
    .format(toDate(d))
    .toLowerCase();
}

export function formatTimeRange(start: DateInput, end: DateInput, timeZone: string): string {
  return `${formatTime(start, timeZone)} – ${formatTime(end, timeZone)}`;
}

/** Calendar date (Y-M-D) of an instant, as seen in the given zone. */
export function zonedDateKey(d: DateInput, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(toDate(d));
}

/** "Today", "Tomorrow", or "Thursday, Sep 24", relative to `now` in the truck's zone. */
export function formatDayLabel(d: DateInput, timeZone: string, now: Date = new Date()): string {
  const key = zonedDateKey(d, timeZone);
  if (key === zonedDateKey(now, timeZone)) return "Today";
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (key === zonedDateKey(tomorrow, timeZone)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(toDate(d));
}

/** Mid-sentence form: "today at 9:00 am", "tomorrow at…", "Thursday at…", "Sep 24 at…". */
export function formatWhen(d: DateInput, timeZone: string, now: Date = new Date()): string {
  const time = formatTime(d, timeZone);
  const label = formatDayLabel(d, timeZone, now);
  if (label === "Today" || label === "Tomorrow") return `${label.toLowerCase()} at ${time}`;
  const daysAway = (toDate(d).getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  const day = new Intl.DateTimeFormat("en-US", daysAway < 6 ? { timeZone, weekday: "long" } : { timeZone, month: "short", day: "numeric" }).format(toDate(d));
  return `${day} at ${time}`;
}

/** Short weekday + day number, e.g. { weekday: "Thu", day: "24" }. */
export function formatDayParts(d: DateInput, timeZone: string) {
  const date = toDate(d);
  return {
    weekday: new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date),
    day: new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(date),
  };
}

/** Offset of `timeZone` from UTC at a given instant, in milliseconds. */
function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * The UTC instant for a wall-clock time in a zone, e.g. "11:30 in Chicago on
 * the day that is `daysFromToday` after today (in Chicago)".
 */
export function zonedTime(
  timeZone: string,
  daysFromToday: number,
  hour: number,
  minute: number,
  now: Date = new Date()
): Date {
  const [y, m, d] = zonedDateKey(now, timeZone).split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d + daysFromToday, hour, minute);
  return new Date(guess - zoneOffsetMs(new Date(guess), timeZone));
}

// ─── Wall-clock form values ────────────────────────────────────────────────
// The schedule form speaks "2026-10-09" and "11:30" (what <input type="date">
// and <input type="time"> produce). These convert between that and a UTC
// instant, always through the truck's zone.

/** The UTC instant for a wall-clock date ("YYYY-MM-DD") and time ("HH:mm") in a zone. */
export function zonedTimeFromParts(timeZone: string, date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  // Two passes: the offset at the guess can differ from the offset at the answer around a DST change.
  const first = guess - zoneOffsetMs(new Date(guess), timeZone);
  return new Date(guess - zoneOffsetMs(new Date(first), timeZone));
}

/** "YYYY-MM-DD" of an instant, as seen in the zone: the value for <input type="date">. */
export function toZonedDateInput(d: DateInput, timeZone: string): string {
  return zonedDateKey(d, timeZone);
}

/** "HH:mm" of an instant, as seen in the zone: the value for <input type="time">. */
export function toZonedTimeInput(d: DateInput, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(toDate(d));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}`;
}

/** Calendar arithmetic on a "YYYY-MM-DD" key, with no timezone involved. */
export function addDaysToDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
