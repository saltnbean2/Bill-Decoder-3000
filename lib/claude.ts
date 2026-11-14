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
  opts: { effort?: "low" | "medium" | "high" } = {},
): Promise<Analysis> {
  const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [{ role: "user", content }];

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      // Thinking tokens count toward max_tokens, so leave room above the ~4k answer.
      max_tokens: 8000,
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
    if (toolUse) return normalizeAnalysis(toolUse.input);

    if (response.stop_reason === "max_tokens") throw new AnalysisError("truncated");

    // Model answered in text: append its turn and ask again, explicitly.
    messages.push({ role: "assistant", content: response.content as Anthropic.Beta.Messages.BetaContentBlockParam[] });
    messages.push({
      role: "user",
      content: `Please give your answer by calling the ${TOOL_NAME} tool now.`,
    });
  }
  throw new AnalysisError("no_tool_call");
}
