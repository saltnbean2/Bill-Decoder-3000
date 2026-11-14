export type Lang = "en" | "hy" | "es" | "ko" | "tl";
export const LANGS: Lang[] = ["en", "hy", "es", "ko", "tl"];

export type DocType =
  | "parking_ticket"
  | "official_letter"
  | "contractor_quote"
  | "other_document"
  | "unreadable";

export type Urgency = "urgent" | "soon" | "no_rush";
export type Severity = "high" | "medium" | "low";

export interface ActionStep {
  title: string;
  detail: string;
  contact?: string | null;
}

export interface RedFlag {
  severity: Severity;
  text: string;
}

export interface Deadline {
  date: string | null;
  days_remaining: number | null;
  what_is_due: string;
}

export interface LegitimacyCheck {
  verdict: "looks_legitimate" | "be_careful" | "likely_scam";
  reasons: string[];
}

export interface TicketInfo {
  citation_number: string | null;
  violation: string | null;
  missing_or_wrong_fields: string[];
  possible_grounds: string[];
  contest_strength: "strong" | "possible" | "weak";
  contest_strength_reason: string;
  appeal_letter: string;
}

export interface QuoteLineItem {
  item: string;
  price: number | null;
  typical_range: string | null;
  rating: "low" | "fair" | "high" | "very_high" | "unclear";
}

export interface QuoteInfo {
  business_name: string | null;
  license_number: string | null;
  quoted_total: number | null;
  typical_total_low: number | null;
  typical_total_high: number | null;
  percent_vs_typical: number | null;
  verdict: "good_deal" | "fair" | "high" | "very_high";
  line_items: QuoteLineItem[];
  questions_to_ask: string[];
}

export interface Analysis {
  document_type: DocType;
  confidence: "high" | "medium" | "low";
  unreadable_reason?: string | null;
  sender?: string | null;
  headline: string;
  summary: string;
  amount_due?: string | null;
  deadline?: Deadline | null;
  urgency: Urgency;
  if_ignored?: string | null;
  action_steps: ActionStep[];
  red_flags: RedFlag[];
  legitimacy_check?: LegitimacyCheck | null;
  ticket?: TicketInfo | null;
  quote?: QuoteInfo | null;
}

export type SampleId = "ticket" | "letter" | "quote" | "scam";
