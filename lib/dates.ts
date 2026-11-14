/**
 * Sample documents and seeded demo responses use relative date tokens so the demo
 * always shows realistic deadlines, whatever day it runs:
 *   {{ISO:+10}}  -> 2026-11-24 (today in Los Angeles + 10 days)
 *   {{DATE:+10}} -> "November 24, 2026", localized to the response language
 */
const LOCALES: Record<string, string> = { en: "en-US", hy: "hy-AM", es: "es-US", ko: "ko-KR", tl: "fil-PH" };

export function laToday(): Date {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function offsetDate(days: number): Date {
  const t = laToday();
  t.setUTCDate(t.getUTCDate() + days);
  return t;
}

export function resolveDateTokens(text: string, lang = "en"): string {
  return text
    .replace(/\{\{ISO:([+-]\d+)\}\}/g, (_, n) => offsetDate(Number(n)).toISOString().slice(0, 10))
    .replace(/\{\{DATE:([+-]\d+)\}\}/g, (_, n) =>
      new Intl.DateTimeFormat(LOCALES[lang] ?? "en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(offsetDate(Number(n))),
    );
}
