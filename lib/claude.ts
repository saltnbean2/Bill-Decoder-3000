import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ANALYSIS_TOOL, TOOL_NAME } from "./schema";
import { normalizeAnalysis } from "./normalize";
import type { Analysis } from "./types";

export const MODEL = "claude-sonnet-5-5";

let client: Anthropic | null = null;
function getClient() {
  // Reads ANTHROPIC_API_KEY from the server environment only.
  client ??= new Anthropic({ timeout: 45_000, maxRetries: 0 });
  return client;
}

export class AnalysisError extends Error {}

/**
 * Calls Claude with the report_document_analysis tool and returns the tool input.
 *
 * Note: claude-sonnet-5-5 rejects forced tool_choice ({type:"tool"}) with a 400, so we use
 * tool_choice "auto" + a firm instruction in the system prompt, and re-ask once if the
 * model answers in text instead of calling the tool.
 */
export async function runAnalysis(
  system: string,
  content: Anthropic.Beta.Messages.BetaContentBlockParam[],
  opts: { effort?: "low" | "medium" | "high"; checkSections?: boolean } = {},
): Promise<Analysis> {
  const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [{ role: "user", content }];
  let best: Analysis | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      // Thinking tokens count toward max_tokens, so leave room above the ~4k answer.
      max_tokens: 12000,
      system,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: "auto" },
      output_config: { effort: opts.effort ?? "medium" },
      // On a safety-classifier refusal the API retries on a fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages,
    });

    if (response.stop_reason === "refusal") throw new AnalysisError("refused");

    const toolUse = response.content.find(
      (b): b is Anthropic.Beta.Messages.BetaToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
    );
    const assistantTurn = response.content as Anthropic.Beta.Messages.BetaContentBlockParam[];

    if (toolUse) {
      const result = normalizeAnalysis(toolUse.input);
      const missing = response.stop_reason === "max_tokens" ? "the analysis was cut off"
          : opts.checkSections === false ? null : missingSection(result);
      if (!missing) return result;
      best = result;
      // Ask once more for the complete analysis, as a tool_result error on the call.
      messages.push({ role: "assistant", content: assistantTurn });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id,
            is_error: true,
            content: `Incomplete: ${missing}. Call ${TOOL_NAME} again with the complete analysis, including every field.`,
          },
        ],
      });
      continue;
    }

    if (response.stop_reason === "max_tokens") break;

    // Model answered in text: append its turn and ask again, explicitly.
    messages.push({ role: "assistant", content: assistantTurn });
    messages.push({
      role: "user",
      content: `Please give your answer by calling the ${TOOL_NAME} tool now.`,
    });
  }
  // A usable-but-incomplete first answer beats an error screen.
  if (best && best.headline) return best;
  throw new AnalysisError("no_tool_call");
}

/** Type-specific sections the UI depends on. Returns what's missing, or null. */
function missingSection(a: Analysis): string | null {
  if (!a.headline) return "headline is empty";
  if (a.document_type === "parking_ticket" && (!a.ticket || !a.ticket.appeal_letter)) {
    return 'document_type is "parking_ticket" but the "ticket" object (with missing_or_wrong_fields, contest_strength and appeal_letter) is missing';
  }
  if (a.document_type === "contractor_quote" && (!a.quote || a.quote.line_items.length === 0)) {
    return 'document_type is "contractor_quote" but the "quote" object (with line_items, typical totals, percent_vs_typical and verdict) is missing';
  }
  return null;
}
