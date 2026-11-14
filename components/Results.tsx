"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { Analysis, QuoteInfo, Severity, TicketInfo, Urgency } from "@/lib/types";
import type { Strings } from "@/lib/i18n";
import { Linkify, contactLink } from "./linkify";

const URGENCY_COLOR: Record<Urgency, string> = { urgent: "#DC2626", soon: "#D97706", no_rush: "#16A34A" };
const URGENCY_BG: Record<Urgency, string> = { urgent: "#FEF2F2", soon: "#FFFBEB", no_rush: "#F0FDF4" };
const SEVERITY_STYLE: Record<Severity, string> = {
  high: "bg-red-50 text-red-800 ring-red-200",
  medium: "bg-amber-50 text-amber-900 ring-amber-200",
  low: "bg-stone-100 text-stone-700 ring-stone-200",
};
const SEVERITY_DOT: Record<Severity, string> = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-stone-400" };

function Card({
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
      className={`rise rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-line ${className}`}
      style={{ animationDelay: `${i * 50}ms`, ...style }}
    >
      {children}
    </section>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted">{children}</h2>;
}

function Shimmer({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="shimmer h-4" style={{ width: `${92 - i * 18}%` }} />
      ))}
    </div>
  );
}

function formatDate(iso: string | null, locale: string) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(d);
}

/* ---------- Deadline (hero) ---------- */
function DeadlineBadge({ a, t, locale, i, busy }: { a: Analysis; t: Strings; locale: string; i: number; busy: boolean }) {
  const d = a.deadline;
  const days = d?.days_remaining ?? null;
  if (!d || (days === null && !d.date && !d.what_is_due)) {
    return (
      <section
        className="rise flex items-center gap-3 rounded-2xl p-5 ring-1 ring-green-200"
        style={{ background: URGENCY_BG.no_rush, animationDelay: `${i * 50}ms` }}
      >
        <span className="text-2xl">✅</span>
        <p className="text-lg font-semibold text-green-800">{t.noDeadline}</p>
      </section>
    );
  }
  const passed = days !== null && days < 0;
  const urgency: Urgency = passed ? "urgent" : a.urgency;
  const color = URGENCY_COLOR[urgency];
  let big: string;
  if (days === null) big = `⏰ ${t.deadlineUnknownDate}`;
  else if (passed) big = `⚠️ ${t.passed(Math.abs(days))}`;
  else if (days === 0) big = `⏰ ${t.dueToday}`;
  else if (days === 1) big = `⏰ ${t.dueTomorrow}`;
  else big = `⏰ ${t.daysLeft(days)}`;
  const date = formatDate(d.date, locale);

  return (
    <section
      className={`${urgency === "urgent" ? "pulse-once" : "rise"} rounded-2xl p-5 text-white`}
      style={{ background: color, animationDelay: `${i * 50}ms` }}
    >
      <p className="text-[28px] font-bold leading-tight tracking-tight">{big}</p>
      {date && <p className="mt-1 text-lg font-semibold opacity-95">{date}</p>}
      {d.what_is_due &&
        (busy ? (
          <div className="mt-2 opacity-60">
            <Shimmer lines={1} />
          </div>
        ) : (
          <p className="mt-1 text-[17px] leading-snug opacity-95">{d.what_is_due}</p>
        ))}
    </section>
  );
}

/* ---------- Checklist ---------- */
function Steps({ a, t, i, busy }: { a: Analysis; t: Strings; i: number; busy: boolean }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  if (!a.action_steps.length) return null;
  const toggle = (n: number) =>
    setDone((s) => {
      const next = new Set(s);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  return (
    <Card i={i}>
      <CardTitle>{t.whatToDo}</CardTitle>
      <ol className="space-y-2">
        {a.action_steps.map((s, n) => {
          const checked = done.has(n);
          const link = s.contact ? contactLink(s.contact) : null;
          return (
            <li key={n}>
              <div
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                onClick={() => toggle(n)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    toggle(n);
                  }
                }}
                className={`flex min-h-[44px] cursor-pointer gap-3 rounded-xl p-3 transition-colors ${
                  checked ? "bg-teal-soft" : "bg-paper active:bg-stone-100"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    checked ? "bg-teal text-white" : "bg-white text-teal ring-2 ring-teal/40"
                  }`}
                >
                  {checked ? "✓" : n + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {busy ? (
                    <Shimmer lines={2} />
                  ) : (
                    <>
                      <p className={`font-semibold leading-snug ${checked ? "text-muted line-through" : ""}`}>{s.title}</p>
                      {s.detail && (
                        <p className={`mt-0.5 text-[16px] leading-snug ${checked ? "text-muted" : "text-stone-700"}`}>
                          <Linkify text={s.detail} />
                        </p>
                      )}
                    </>
                  )}
                  {link && (
                    <a
                      href={link.href}
                      target={link.kind === "tel" ? undefined : "_blank"}
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold text-teal ring-1 ring-teal/30 active:bg-teal-soft"
                    >
                      <span>{link.kind === "tel" ? "📞" : link.kind === "url" ? "🌐" : "📍"}</span>
                      <span className="truncate">{link.label}</span>
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-muted">{t.tapToCheck}</p>
    </Card>
  );
}

/* ---------- Ticket ---------- */
function HighlightedLetter({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\[[^\]]+\]$/.test(p) ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-ink">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function TicketCards({ ticket, t, i, busy }: { ticket: TicketInfo; t: Strings; i: number; busy: boolean }) {
  const [toast, setToast] = useState(0);
  const levels = ["weak", "possible", "strong"] as const;
  const idx = levels.indexOf(ticket.contest_strength);
  const color = { weak: "#DC2626", possible: "#D97706", strong: "#16A34A" }[ticket.contest_strength];

  async function copy() {
    try {
      await navigator.clipboard.writeText(ticket.appeal_letter);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = ticket.appeal_letter;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setToast((n) => n + 1);
  }
  const mailto = `mailto:?subject=${encodeURIComponent(
    t.emailSubject + (ticket.citation_number ? ` #${ticket.citation_number}` : ""),
  )}&body=${encodeURIComponent(ticket.appeal_letter)}`;

  return (
    <>
      <Card i={i}>
        <CardTitle>{t.contestStrength}</CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {levels.map((l, n) => (
              <div
                key={l}
                className="h-3 flex-1 rounded-full transition-colors"
                style={{ background: n <= idx ? color : "#ECE7E0" }}
              />
            ))}
          </div>
          <span className="text-lg font-bold" style={{ color }}>
            {t.strength[ticket.contest_strength]}
          </span>
        </div>
        {busy ? (
          <div className="mt-3">
            <Shimmer />
          </div>
        ) : (
          ticket.contest_strength_reason && <p className="mt-3 text-stone-700">{ticket.contest_strength_reason}</p>
        )}
        {ticket.missing_or_wrong_fields.length > 0 && (
          <>
            <p className="mt-4 mb-2 text-sm font-semibold text-red-800">{t.problemsFound}</p>
            <ul className="flex flex-wrap gap-2">
              {ticket.missing_or_wrong_fields.map((f, n) => (
                <li key={n} className="rounded-xl bg-red-50 px-3 py-2 text-[15px] font-medium text-red-800 ring-1 ring-red-200">
                  🚩 {f}
                </li>
              ))}
            </ul>
          </>
        )}
        {ticket.possible_grounds.length > 0 && (
          <details className="mt-4 group">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-[15px] font-semibold text-teal">
              {t.possibleGrounds}
              <span className="transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-[16px] text-stone-700">
              {ticket.possible_grounds.map((g, n) => (
                <li key={n}>{g}</li>
              ))}
            </ul>
          </details>
        )}
      </Card>

      {ticket.appeal_letter && (
        <Card i={i + 1} className="ring-teal/30">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h2 className="text-xl font-bold">{t.letterReady}</h2>
          </div>
          <p className="text-[15px] text-muted">{t.letterNote}</p>
          {/\[[^\]]+\]/.test(ticket.appeal_letter) && (
            <p className="mt-1 text-[15px] font-medium text-amber-800">
              <mark className="rounded bg-yellow-200 px-1">[ ]</mark> {t.editBrackets}
            </p>
          )}
          <div
            lang="en"
            className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-paper p-4 font-[ui-serif,Georgia,serif] text-[15px] leading-relaxed ring-1 ring-line"
            tabIndex={0}
          >
            <HighlightedLetter text={ticket.appeal_letter} />
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <button
              onClick={copy}
              className="min-h-[52px] rounded-xl bg-teal px-4 text-[17px] font-semibold text-white active:scale-[0.98] transition-transform"
            >
              📋 {t.copy}
            </button>
            <a
              href={mailto}
              className="flex min-h-[52px] items-center justify-center rounded-xl bg-white px-4 text-[17px] font-semibold text-teal ring-1 ring-teal/40 active:bg-teal-soft"
            >
              ✉️ {t.email}
            </a>
          </div>
          {toast > 0 && (
            <div
              key={toast}
              role="status"
              className="toast fixed bottom-8 left-1/2 z-50 rounded-full bg-ink px-5 py-3 text-[16px] font-semibold text-white shadow-lg"
            >
              {t.copied}
            </div>
          )}
        </Card>
      )}
    </>
  );
}

/* ---------- Quote ---------- */
const money = (n: number | null) =>
  n === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// Each verdict zone gets a quarter of the gauge; boundaries in percent vs typical.
const ZONES = [-30, -10, 15, 40, 80];
function gaugePos(p: number) {
  const c = Math.max(ZONES[0], Math.min(ZONES[4], p));
  for (let z = 0; z < 4; z++) {
    if (c <= ZONES[z + 1]) return (z + (c - ZONES[z]) / (ZONES[z + 1] - ZONES[z])) * 25;
  }
  return 100;
}

function QuoteCards({ quote, t, i, busy }: { quote: QuoteInfo; t: Strings; i: number; busy: boolean }) {
  const p = quote.percent_vs_typical;
  const pos = p !== null ? gaugePos(p) : { good_deal: 12, fair: 37, high: 62, very_high: 88 }[quote.verdict];
  const label =
    p === null ? t.verdict[quote.verdict] : Math.abs(p) < 5 ? t.aboutTypical : p > 0 ? t.aboveTypical(Math.round(p)) : t.belowTypical(Math.round(-p));
  const ratingDot = { low: "bg-green-500", fair: "bg-green-500", high: "bg-amber-500", very_high: "bg-red-500", unclear: "bg-stone-300" };
  const verdictColor = { good_deal: "#16A34A", fair: "#65A30D", high: "#D97706", very_high: "#DC2626" }[quote.verdict];

  return (
    <>
      <Card i={i}>
        <CardTitle>{t.priceCheck}</CardTitle>
        <p className="text-[28px] font-bold leading-tight" style={{ color: verdictColor }}>
          {label}
        </p>
        <div className="relative mt-6 mb-2">
          <div className="flex h-4 overflow-hidden rounded-full">
            <div className="flex-1 bg-green-500" />
            <div className="flex-1 bg-lime-400" />
            <div className="flex-1 bg-amber-400" />
            <div className="flex-1 bg-red-500" />
          </div>
          <div
            className="absolute -top-2.5 h-9 w-9 -translate-x-1/2 rounded-full border-4 border-white shadow-md transition-[left] duration-700"
            style={{ left: `${pos}%`, background: verdictColor }}
            aria-hidden
          />
        </div>
        <div className="grid grid-cols-4 text-center text-[12px] font-semibold text-muted">
          <span>{t.verdict.good_deal}</span>
          <span>{t.verdict.fair}</span>
          <span>{t.verdict.high}</span>
          <span>{t.verdict.very_high}</span>
        </div>
        {(quote.quoted_total !== null || quote.typical_total_low !== null) && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-paper p-3">
              <p className="text-sm text-muted">{t.quoted}</p>
              <p className="text-xl font-bold">{money(quote.quoted_total)}</p>
            </div>
            <div className="rounded-xl bg-paper p-3">
              <p className="text-sm text-muted">{t.typical}*</p>
              <p className="text-xl font-bold">
                {quote.typical_total_low !== null && quote.typical_total_high !== null
                  ? `${money(quote.typical_total_low)}–${money(quote.typical_total_high)}`
                  : money(quote.typical_total_low ?? quote.typical_total_high)}
              </p>
            </div>
          </div>
        )}
        <p className="mt-2 text-[13px] text-muted">* {t.estimates}</p>
      </Card>

      {quote.line_items.length > 0 && (
        <Card i={i + 1}>
          <CardTitle>{t.lineItems}</CardTitle>
          <ul className="divide-y divide-line">
            {quote.line_items.map((li, n) => (
              <li key={n} className="flex items-start gap-3 py-3">
                <span className={`mt-2 h-3 w-3 shrink-0 rounded-full ${ratingDot[li.rating]}`} title={t.rating[li.rating]} />
                <div className="min-w-0 flex-1">
                  {busy ? <Shimmer lines={1} /> : <p className="leading-snug">{li.item}</p>}
                  {li.typical_range && (
                    <p className="text-[14px] text-muted">
                      {t.typical}: {li.typical_range}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{money(li.price)}</p>
                  <p className="text-[12px] font-semibold uppercase text-muted">{t.rating[li.rating]}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card i={i + 2}>
        {quote.license_number ? (
          <p className="text-[17px]">
            ✅ {t.license} <span className="font-mono font-semibold">#{quote.license_number}</span> —{" "}
            {t.verifyAt}{" "}
            <a
              href="https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-teal underline"
            >
              cslb.ca.gov
            </a>
          </p>
        ) : (
          <div>
            <p className="text-[19px] font-bold text-red-700">⚠️ {t.noLicense}</p>
            <a
              href="https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-[44px] items-center font-semibold text-teal underline"
            >
              {t.verifyAt} cslb.ca.gov →
            </a>
          </div>
        )}
        {quote.questions_to_ask.length > 0 && (
          <>
            <h3 className="mt-5 mb-2 text-lg font-bold">💬 {t.askBefore}</h3>
            <ul className="space-y-2">
              {quote.questions_to_ask.map((q, n) => (
                <li key={n} className="rounded-xl bg-teal-soft px-4 py-3 text-[16px] leading-snug text-teal-900">
                  {busy ? <Shimmer lines={1} /> : `“${q}”`}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}

/* ---------- Main ---------- */
export default function Results({
  a,
  t,
  locale,
  busy,
  onScanAnother,
}: {
  a: Analysis;
  t: Strings;
  locale: string;
  busy: boolean;
  onScanAnother: () => void;
}) {
  let i = 0;
  const legit = a.legitimacy_check;
  const showLegit = legit && legit.verdict !== "looks_legitimate";

  return (
    <div className="space-y-4 pb-10">
      {/* 1. chip + headline */}
      <header className="rise pt-1" style={{ animationDelay: `${i++ * 50}ms` }}>
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[14px] font-semibold text-ink ring-1 ring-line">
          {t.docType[a.document_type]}
        </span>
        {busy ? (
          <div className="mt-3">
            <Shimmer lines={2} />
          </div>
        ) : (
          <h1 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-tight">{a.headline}</h1>
        )}
        {a.sender && !busy && (
          <p className="mt-2 text-[15px] text-muted">
            {t.from}: {a.sender}
          </p>
        )}
      </header>

      {/* 2. deadline */}
      <DeadlineBadge a={a} t={t} locale={locale} i={i++} busy={busy} />

      {/* 3. legitimacy */}
      {showLegit && (
        <section
          className={`rise rounded-2xl p-5 ring-1 ${
            legit.verdict === "likely_scam" ? "bg-red-50 ring-red-300" : "bg-amber-50 ring-amber-300"
          }`}
          style={{ animationDelay: `${i++ * 50}ms` }}
        >
          <p className={`text-xl font-bold ${legit.verdict === "likely_scam" ? "text-red-800" : "text-amber-900"}`}>
            🛑 {t.scamTitle[legit.verdict as "be_careful" | "likely_scam"]}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[16px]">
            {legit.reasons.map((r, n) => (
              <li key={n}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. what this means */}
      <Card i={i++}>
        <CardTitle>{t.whatMeans}</CardTitle>
        {a.amount_due && (
          <p className="mb-2 text-[34px] font-bold leading-none tracking-tight">
            {a.amount_due}
            <span className="ml-2 text-[15px] font-medium text-muted">{t.amountDue}</span>
          </p>
        )}
        {busy ? <Shimmer lines={3} /> : <p className="text-[17px] leading-relaxed">{a.summary}</p>}
      </Card>

      {/* 5. steps */}
      <Steps a={a} t={t} i={i++} busy={busy} />

      {/* 6. type-specific */}
      {a.ticket && <TicketCards ticket={a.ticket} t={t} i={i++} busy={busy} />}
      {a.quote && <QuoteCards quote={a.quote} t={t} i={i++} busy={busy} />}

      {/* 7. if ignored */}
      {a.if_ignored && (
        <section className="rise rounded-2xl bg-stone-100 p-5" style={{ animationDelay: `${(i += 2) * 50}ms` }}>
          <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-muted">{t.ifIgnored}</h2>
          {busy ? <Shimmer /> : <p className="text-stone-700">{a.if_ignored}</p>}
        </section>
      )}

      {/* 8. red flags */}
      {a.red_flags.length > 0 && (
        <Card i={i++}>
          <CardTitle>{t.redFlags}</CardTitle>
          <ul className="space-y-2">
            {a.red_flags.map((f, n) => (
              <li key={n} className={`flex gap-2.5 rounded-xl px-3 py-2.5 text-[16px] leading-snug ring-1 ${SEVERITY_STYLE[f.severity]}`}>
                <span className={`mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full ${SEVERITY_DOT[f.severity]}`} />
                {busy ? <div className="flex-1"><Shimmer lines={1} /></div> : <span>{f.text}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 9. confidence */}
      {a.confidence !== "high" && (
        <p className="rise px-1 text-[15px] text-muted" style={{ animationDelay: `${i++ * 50}ms` }}>
          🔍 {t.lowConfidence}
        </p>
      )}

      {/* 10. footer */}
      <footer className="rise pt-4 text-center" style={{ animationDelay: `${i++ * 50}ms` }}>
        <button
          onClick={onScanAnother}
          className="min-h-[56px] w-full rounded-2xl bg-ink px-6 text-[18px] font-semibold text-white active:scale-[0.98] transition-transform"
        >
          📷 {t.scanAnother}
        </button>
        <p className="mt-4 text-[14px] text-muted">{t.disclaimer}</p>
      </footer>
    </div>
  );
}
