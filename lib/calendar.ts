// Builds a one-event .ics file so a customer can put their pickup time in
// their calendar. Times are written in UTC (the "Z" form), which every
// calendar app converts to the customer's own zone, so the pickup lands at the
// right moment no matter where the file is opened.

export type PickupEvent = {
  uid: string;
  title: string;
  location: string;
  description: string;
  startsAt: string | Date;
  /** How long the event blocks out. A pickup is quick, so default to 15 minutes. */
  minutes?: number;
  /** When the file was made. Only passed in tests so output is stable. */
  now?: Date;
};

/** 2026-10-08T18:00:00.000Z → 20261008T180000Z */
function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escape the characters that are special inside ICS text values. */
function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines over 75 characters must be split, each continuation starting with a space. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join("\r\n");
}

export function buildPickupIcs(event: PickupEvent): string {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + (event.minutes ?? 15) * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FoodtruckApp//Pickup//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${icsDate(event.now ?? new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.location)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(fold).join("\r\n") + "\r\n";
}
