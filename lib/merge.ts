import type { Analysis } from "./types";

/**
 * Take the translated strings, but keep every structural value (enums, numbers, dates,
 * contacts, the English appeal letter) from the original, so translation can never
 * change the facts.
 */
export function mergeTranslation(original: Analysis, t: Analysis): Analysis {
  // Take translated items by position only when the arrays line up exactly. If the model
  // dropped or added an item, keep that whole list in the original language rather than
  // attaching text to the wrong item.
  const aligned = <T, U>(orig: T[], tr: U[] | undefined): U[] | undefined =>
    tr && tr.length === orig.length ? tr : undefined;
  const pick = <T,>(arr: T[] | undefined, i: number): T | undefined => (arr ? arr[i] : undefined);
  return {
    ...original,
    headline: t.headline || original.headline,
    summary: t.summary || original.summary,
    unreadable_reason: t.unreadable_reason ?? original.unreadable_reason,
    sender: t.sender ?? original.sender,
    amount_due: original.amount_due,
    if_ignored: t.if_ignored ?? original.if_ignored,
    deadline: original.deadline
      ? { ...original.deadline, what_is_due: t.deadline?.what_is_due || original.deadline.what_is_due }
      : null,
    action_steps: original.action_steps.map((s, i) => ({
      ...s,
      title: pick(aligned(original.action_steps, t.action_steps), i)?.title || s.title,
      detail: pick(aligned(original.action_steps, t.action_steps), i)?.detail || s.detail,
    })),
    red_flags: original.red_flags.map((f, i) => ({ ...f, text: pick(aligned(original.red_flags, t.red_flags), i)?.text || f.text })),
    legitimacy_check: original.legitimacy_check
      ? {
          ...original.legitimacy_check,
          reasons: original.legitimacy_check.reasons.map((r, i) => pick(aligned(original.legitimacy_check!.reasons, t.legitimacy_check?.reasons), i) || r),
        }
      : null,
    ticket: original.ticket
      ? {
          ...original.ticket,
          violation: t.ticket?.violation ?? original.ticket.violation,
          missing_or_wrong_fields: original.ticket.missing_or_wrong_fields.map(
            (x, i) => pick(aligned(original.ticket!.missing_or_wrong_fields, t.ticket?.missing_or_wrong_fields), i) || x,
          ),
          possible_grounds: original.ticket.possible_grounds.map((x, i) => pick(aligned(original.ticket!.possible_grounds, t.ticket?.possible_grounds), i) || x),
          contest_strength_reason: t.ticket?.contest_strength_reason || original.ticket.contest_strength_reason,
        }
      : null,
    quote: original.quote
      ? {
          ...original.quote,
          line_items: original.quote.line_items.map((li, i) => ({
            ...li,
            item: pick(aligned(original.quote!.line_items, t.quote?.line_items), i)?.item || li.item,
            typical_range: pick(aligned(original.quote!.line_items, t.quote?.line_items), i)?.typical_range ?? li.typical_range,
          })),
          questions_to_ask: original.quote.questions_to_ask.map((q, i) => pick(aligned(original.quote!.questions_to_ask, t.quote?.questions_to_ask), i) || q),
        }
      : null,
  };
}
