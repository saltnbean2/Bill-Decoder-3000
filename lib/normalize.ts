import type { Analysis, DocType, Severity, Urgency } from "./types";

/* Defensive normalization so the UI never crashes on missing / null / odd fields. */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : v == null ? fallback : String(v));
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const num = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,%\s]/g, ""));
    return Number.isFinite(n) && v.trim() !== "" ? n : null;
  }
  return null;
};
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strArr = (v: unknown): string[] => arr(v).map((x) => str(x)).filter(Boolean);
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

const DOC_TYPES = ["parking_ticket", "official_letter", "contractor_quote", "other_document", "unreadable"] as const;
const URGENCIES = ["urgent", "soon", "no_rush"] as const;
const SEVERITIES = ["high", "medium", "low"] as const;

/** Days from today (America/Los_Angeles) to an ISO date. */
export function daysUntil(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [ty, tm, td] = today.split("-").map(Number);
  const a = Date.UTC(ty, tm - 1, td);
  const b = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.round((b - a) / 86_400_000);
}

export function normalizeAnalysis(raw: unknown): Analysis {
  const r: Obj = isObj(raw) ? raw : {};
  const document_type = oneOf<DocType>(r.document_type, DOC_TYPES, "other_document");

  let deadline: Analysis["deadline"] = null;
  if (isObj(r.deadline)) {
    const date = strOrNull(r.deadline.date);
    // Recompute from the date so the countdown is always arithmetically right.
    const computed = date ? daysUntil(date) : null;
    const days = computed ?? num(r.deadline.days_remaining);
    const what = str(r.deadline.what_is_due);
    if (date || days !== null || what) {
      deadline = { date, days_remaining: days === null ? null : Math.round(days), what_is_due: what };
    }
  }

  const legit = isObj(r.legitimacy_check)
    ? {
        verdict: oneOf(r.legitimacy_check.verdict, ["looks_legitimate", "be_careful", "likely_scam"] as const, "be_careful"),
        reasons: strArr(r.legitimacy_check.reasons),
      }
    : null;

  const ticket = isObj(r.ticket)
    ? {
        citation_number: strOrNull(r.ticket.citation_number),
        violation: strOrNull(r.ticket.violation),
        missing_or_wrong_fields: strArr(r.ticket.missing_or_wrong_fields),
        possible_grounds: strArr(r.ticket.possible_grounds),
        contest_strength: oneOf(r.ticket.contest_strength, ["strong", "possible", "weak"] as const, "possible"),
        contest_strength_reason: str(r.ticket.contest_strength_reason),
        appeal_letter: str(r.ticket.appeal_letter),
      }
    : null;

  const quote = isObj(r.quote)
    ? {
        business_name: strOrNull(r.quote.business_name),
        license_number: strOrNull(r.quote.license_number),
        quoted_total: num(r.quote.quoted_total),
        typical_total_low: num(r.quote.typical_total_low),
        typical_total_high: num(r.quote.typical_total_high),
        percent_vs_typical: num(r.quote.percent_vs_typical),
        verdict: oneOf(r.quote.verdict, ["good_deal", "fair", "high", "very_high"] as const, "fair"),
        line_items: arr(r.quote.line_items)
          .filter(isObj)
          .map((li) => ({
            item: str(li.item),
            price: num(li.price),
            typical_range: strOrNull(li.typical_range),
            rating: oneOf(li.rating, ["low", "fair", "high", "very_high", "unclear"] as const, "unclear"),
          }))
          .filter((li) => li.item),
        questions_to_ask: strArr(r.quote.questions_to_ask),
      }
    : null;

  let urgency = oneOf<Urgency>(r.urgency, URGENCIES, "soon");
  // A passed or imminent deadline is always urgent, whatever the model said.
  if (deadline?.days_remaining != null && deadline.days_remaining <= 7) urgency = "urgent";

  return {
    document_type,
    confidence: oneOf(r.confidence, ["high", "medium", "low"] as const, "medium"),
    unreadable_reason: strOrNull(r.unreadable_reason),
    sender: strOrNull(r.sender),
    headline: str(r.headline),
    summary: str(r.summary),
    amount_due: strOrNull(r.amount_due),
    deadline,
    urgency,
    if_ignored: strOrNull(r.if_ignored),
    action_steps: arr(r.action_steps)
      .filter(isObj)
      .map((s) => ({ title: str(s.title), detail: str(s.detail), contact: strOrNull(s.contact) }))
      .filter((s) => s.title || s.detail),
    red_flags: arr(r.red_flags)
      .filter(isObj)
      .map((f) => ({ severity: oneOf<Severity>(f.severity, SEVERITIES, "medium"), text: str(f.text) }))
      .filter((f) => f.text),
    legitimacy_check: legit,
    ticket: document_type === "parking_ticket" ? ticket : null,
    quote: document_type === "contractor_quote" ? quote : null,
  };
}

/** Recompute days_remaining against today (used when serving cached demo results). */
export function refreshDeadline(a: Analysis): Analysis {
  if (!a.deadline?.date) return a;
  const d = daysUntil(a.deadline.date);
  if (d === null) return a;
  return { ...a, deadline: { ...a.deadline, days_remaining: d } };
}
