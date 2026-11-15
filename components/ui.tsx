"use client";

import type { CSSProperties, ReactNode } from "react";

/* Small shared building blocks for the results screen. */

export function Card({
  children,
  i,
  className = "",
  style,
}: {
  children: ReactNode;
  i: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      className={`rise rounded-[24px] bg-white p-6 shadow-[0_1px_2px_rgba(15,17,21,0.05)] ${className}`}
      style={{ animationDelay: `${i * 50}ms`, ...style }}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-[19px] font-semibold tracking-tight text-ink">{children}</h2>;
}

export function Shimmer({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="shimmer h-4" style={{ width: `${92 - i * 18}%` }} />
      ))}
    </div>
  );
}

export function formatDate(iso: string | null, locale: string) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  // Some browsers ship without Armenian date data and silently fall back to English.
  if (locale.startsWith("hy") && !fmt.resolvedOptions().locale.startsWith("hy")) {
    return `${HY_WEEKDAYS[d.getUTCDay()]}, ${HY_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }
  return fmt.format(d);
}
const HY_WEEKDAYS = ["կիրակի", "երկուշաբթի", "երեքշաբթի", "չորեքշաբթի", "հինգշաբթի", "ուրբաթ", "շաբաթ"];
const HY_MONTHS = [
  "հունվարի",
  "փետրվարի",
  "մարտի",
  "ապրիլի",
  "մայիսի",
  "հունիսի",
  "հուլիսի",
  "օգոստոսի",
  "սեպտեմբերի",
  "հոկտեմբերի",
  "նոյեմբերի",
  "դեկտեմբերի",
];
