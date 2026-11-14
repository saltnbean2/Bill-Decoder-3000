import "server-only";
import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getClient, MODEL } from "@/lib/claude";
import { LANGUAGE_NAMES, todayInLA } from "@/lib/prompt";
import { normalizeAnalysis } from "@/lib/normalize";
import { AGENT_TOOLS, runAgentTool } from "@/lib/agent-tools";
import { LANGS, type Lang } from "@/lib/types";

export const maxDuration = 60;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_ROUNDS = 5;

/**
 * "Ask Explain It": a small agent that answers questions about paperwork, with or without
 * a scanned document. It can call tools (verified Glendale help lines, official-number
 * check, date math) instead of guessing.
 */
export async function POST(req: Request) {
  let body: { result?: unknown; question?: unknown; language?: unknown; image?: unknown; mediaType?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 800) : "";
  const language: Lang = LANGS.includes(body.language as Lang) ? (body.language as Lang) : "en";
  if (!question) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const analysis = body.result ? normalizeAnalysis(body.result) : null;

  const history = Array.isArray(body.history)
    ? (body.history as { q?: unknown; a?: unknown }[]).slice(-6).filter((h) => typeof h.q === "string" && typeof h.a === "string")
    : [];

  // Earlier turns as real conversation messages.
  const messages: Anthropic.Messages.MessageParam[] = [];
  history.forEach((h) => {
    messages.push({ role: "user", content: String(h.q) });
    messages.push({ role: "assistant", content: String(h.a) });
  });

  const content: Anthropic.Messages.ContentBlockParam[] = [];
  const image = analysis && typeof body.image === "string" ? body.image : "";
  if (image && image.length < 12 * 1024 * 1024 && history.length === 0) {
    if ((IMAGE_TYPES as readonly string[]).includes(body.mediaType as string)) {
      content.push({ type: "image", source: { type: "base64", media_type: body.mediaType as (typeof IMAGE_TYPES)[number], data: image } });
    } else if (body.mediaType === "application/pdf") {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: image } });
    }
  }
  content.push({ type: "text", text: question });
  messages.push({ role: "user", content });

  const docContext = analysis
    ? `\n\nThe person just scanned a document. Your earlier analysis of it:\n<analysis>${JSON.stringify(analysis)}</analysis>\nUse details from it (dates, amounts, phone numbers, websites). Never invent facts about the document; if it doesn't say, tell them and say who to call to find out.`
    : "\n\nThe person hasn't scanned a document. If their question is about a specific letter, ticket or bill, you can suggest they scan it with the camera button for a full explanation.";

  const system = `You are Explain It, a calm, kind assistant that helps residents of Glendale, California with official paperwork: parking tickets, letters from government agencies, courts, utilities, tax agencies, and contractor or repair quotes. Many people asking are older adults or immigrants. Today is ${todayInLA()}.

Answer in ${LANGUAGE_NAMES[language]}, in plain words at a 6th-grade reading level. Keep answers short: 2–6 sentences or a few short bullet points. Start with what they can do.

Use your tools:
- find_local_help before giving any local help phone number. Never make up phone numbers.
- check_official_number whenever they ask if a call, text, letter or phone number is real.
- days_until for any "how many days" question.

You may use general knowledge of how things usually work in California, and say when something is general rather than from their document. If something sounds like a scam (gift cards, wire or crypto payments, threats of arrest, pressure to act within hours, requests for SSN or bank logins), say so clearly. You are not a lawyer; don't add disclaimers, the app shows one. Plain text only, no markdown headings.${docContext}`;

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const res = await getClient().messages.create({
        model: MODEL,
        max_tokens: 3000,
        system,
        tools: AGENT_TOOLS,
        output_config: { effort: "low" },
        messages,
      });

      if (res.stop_reason === "refusal") throw new Error("refused");
      const toolUses = res.content.filter((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
      if (toolUses.length === 0 || res.stop_reason !== "tool_use") {
        const text = res.content
          .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        if (!text) throw new Error(`empty answer (${res.stop_reason})`);
        return NextResponse.json({ answer: text, tools_used: messages.length > history.length * 2 + 1 });
      }

      messages.push({ role: "assistant", content: res.content });
      messages.push({
        role: "user",
        content: toolUses.map((tu) => {
          const out = runAgentTool(tu.name, tu.input);
          return { type: "tool_result" as const, tool_use_id: tu.id, content: out.content, ...(out.isError ? { is_error: true } : {}) };
        }),
      });
    }
    throw new Error("too many tool rounds");
  } catch (err) {
    console.error("[ask] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "ask_failed" }, { status: 502 });
  }
}
