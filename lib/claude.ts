import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ANALYSIS_TOOL, TOOL_NAME } from "./schema";
import { normalizeAnalysis } from "./normalize";
import type { Analysis } from "./types";

export const MODEL = "claude-sonnet-5-5";

let client: Anthropic | null = null;
export function getClient() {
  // Reads ANTHROPIC_API_KEY from the server environment only.
  client ??= new Anthropic({ timeout: 45_000, maxRetries: 0 });
  return client;
}

/** The whole call must fit inside the route's maxDuration (60s), with a little slack. */
const BUDGET_MS = 55_000;
/** Only retry a transient error if it happened early enough to leave time for a second try. */
const RETRY_WINDOW_MS = 20_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isTransient(err: unknown) {
  if (err instanceof Anthropic.APIConnectionTimeoutError) return false; // already used up the time
  if (err instanceof Anthropic.APIConnectionError) return true;
  return err instanceof Anthropic.APIError && (err.status === 429 || (err.status ?? 0) >= 500);
}

export class AnalysisError extends Error {}

type Params = Omit<Anthropic.Beta.Messages.MessageCreateParamsNonStreaming, "model" | "betas" | "fallbacks">;

/**
 * One Messages call with: the time budget, one quick retry for overloaded / rate-limited /
 * dropped connections, and the server-side fallback for safety-classifier refusals.
 */
async function create(params: Params, started: number) {
  const remaining = () => BUDGET_MS - (Date.now() - started);
  for (let i = 0; ; i++) {
    try {
      return await getClient().beta.messages.create(
        {
          model: MODEL,
          // On a safety-classifier refusal the API retries on a fallback model in the same call.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          ...params,
        },
        { timeout: Math.max(5_000, remaining()) },
      );
    } catch (err) {
      if (i >= 1 || !isTransient(err) || Date.now() - started > RETRY_WINDOW_MS) throw err;
      await sleep(800);
    }
  }
}

/**
 * Calls Claude with the report_document_analysis tool and returns the tool input.
 *
 * Note: claude-sonnet-5-5 rejects forced tool_choice ({type:"tool"}) with a 400, so we use
 * tool_choice "auto" + a firm instruction in the system prompt, and re-ask once if the
 * model answers in text instead of calling the tool, or leaves out the ticket/quote section.
 */
export async function runAnalysis(
  system: string,
  content: Anthropic.Beta.Messages.BetaContentBlockParam[],
  opts: { effort?: "low" | "medium" | "high"; checkSections?: boolean } = {},
): Promise<Analysis> {
  const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [{ role: "user", content }];
  const started = Date.now();
  let best: Analysis | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    // Only re-ask if there is still realistic time for a second full answer.
    if (attempt > 0 && BUDGET_MS - (Date.now() - started) < 25_000) break;
    const response = await create(
      {
        // Thinking tokens count toward max_tokens, so leave room above the ~4k answer.
        max_tokens: 12000,
        system,
        tools: [ANALYSIS_TOOL],
        tool_choice: { type: "auto" },
        output_config: { effort: opts.effort ?? "medium" },
        messages,
      },
      started,
    );

    if (response.stop_reason === "refusal") throw new AnalysisError("refused");

    const toolUse = response.content.find(
      (b): b is Anthropic.Beta.Messages.BetaToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
    );
    const assistantTurn = response.content as Anthropic.Beta.Messages.BetaContentBlockParam[];

    if (toolUse) {
      const result = normalizeAnalysis(toolUse.input);
      const missing =
        response.stop_reason === "max_tokens"
          ? "the analysis was cut off"
          : opts.checkSections === false
            ? null
            : missingSection(result);
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
