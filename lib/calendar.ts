/* Calendar integration without accounts:
 *  - Google Calendar and Outlook open a pre-filled "new event" page in the user's own calendar.
 *  - Apple Calendar / anything else gets a real .ics file with two reminders (3 days and 1 day before),
 *    served by /api/ics so iPhone Safari shows the native "Add to Calendar" sheet.
 */

export interface CalEvent {
  title: string;
  date: string; // YYYY-MM-DD (all-day)
  details: string;
  location?: string;
}

const compact = (iso: string) => iso.replaceAll("-", "");
function nextDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function googleUrl(e: CalEvent) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${compact(e.date)}/${compact(nextDay(e.date))}`,
    details: e.details,
    ...(e.location ? { location: e.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function outlookUrl(e: CalEvent) {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: e.date,
    enddt: nextDay(e.date),
    allday: "true",
    body: e.details,
    ...(e.location ? { location: e.location } : {}),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 folding: lines longer than 75 octets continue on the next line after a space. */
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) {
      out.push(cur);
      cur = " " + ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}

export function buildIcs(e: CalEvent) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const uid = `${compact(e.date)}-${Math.random().toString(36).slice(2)}@explain-it`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Explain It//Deadline//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(e.date)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(e.details)}`,
    ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(e.title)}`,
    "TRIGGER:-P3DT0H0M0S",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(e.title)}`,
    "TRIGGER:-P1DT0H0M0S",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(e.title)}`,
    "TRIGGER:PT9H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
