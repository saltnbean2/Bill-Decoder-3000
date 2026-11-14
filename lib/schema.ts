import type Anthropic from "@anthropic-ai/sdk";

export const TOOL_NAME = "report_document_analysis";

// JSON schema from the build spec, used as the tool's input_schema.
export const ANALYSIS_SCHEMA = {
  type: "object",
  required: ["document_type", "confidence", "headline", "summary", "urgency", "action_steps", "red_flags"],
  properties: {
    document_type: {
      type: "string",
      enum: ["parking_ticket", "official_letter", "contractor_quote", "other_document", "unreadable"],
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    unreadable_reason: { type: ["string", "null"] },
    sender: { type: ["string", "null"] },
    headline: { type: "string" },
    summary: { type: "string" },
    amount_due: { type: ["string", "null"] },
    deadline: {
      type: ["object", "null"],
      properties: {
        date: { type: ["string", "null"], description: "YYYY-MM-DD" },
        days_remaining: { type: ["integer", "null"] },
        what_is_due: { type: "string" },
      },
    },
    urgency: { type: "string", enum: ["urgent", "soon", "no_rush"] },
    if_ignored: { type: ["string", "null"] },
    action_steps: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "detail"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          contact: { type: ["string", "null"], description: "phone, URL or address from the document" },
        },
      },
    },
    red_flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["high", "medium", "low"] },
          text: { type: "string" },
        },
      },
    },
    legitimacy_check: {
      type: ["object", "null"],
      properties: {
        verdict: { type: "string", enum: ["looks_legitimate", "be_careful", "likely_scam"] },
        reasons: { type: "array", items: { type: "string" } },
      },
    },
    ticket: {
      type: ["object", "null"],
      properties: {
        citation_number: { type: ["string", "null"] },
        violation: { type: ["string", "null"] },
        missing_or_wrong_fields: { type: "array", items: { type: "string" } },
        possible_grounds: { type: "array", items: { type: "string" } },
        contest_strength: { type: "string", enum: ["strong", "possible", "weak"] },
        contest_strength_reason: { type: "string" },
        appeal_letter: { type: "string" },
      },
    },
    quote: {
      type: ["object", "null"],
      properties: {
        business_name: { type: ["string", "null"] },
        license_number: { type: ["string", "null"] },
        quoted_total: { type: ["number", "null"] },
        typical_total_low: { type: ["number", "null"] },
        typical_total_high: { type: ["number", "null"] },
        percent_vs_typical: { type: ["number", "null"], description: "positive = above typical midpoint" },
        verdict: { type: "string", enum: ["good_deal", "fair", "high", "very_high"] },
        line_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item: { type: "string" },
              price: { type: ["number", "null"] },
              typical_range: { type: ["string", "null"] },
              rating: { type: "string", enum: ["low", "fair", "high", "very_high", "unclear"] },
            },
          },
        },
        questions_to_ask: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

export const ANALYSIS_TOOL: Anthropic.Beta.Messages.BetaTool = {
  name: TOOL_NAME,
  description:
    "Report the full structured analysis of the document. Always call this exactly once with the complete analysis.",
  input_schema: ANALYSIS_SCHEMA as unknown as Anthropic.Beta.Messages.BetaTool.InputSchema,
};
