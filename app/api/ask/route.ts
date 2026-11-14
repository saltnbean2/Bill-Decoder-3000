import "server-only";
import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getClient, MODEL } from "@/lib/claude";
import { LANGUAGE_NAMES, todayInLA } from "@/lib/prompt";
import { normalizeAnalysis } from "@/lib/normalize";
import { LANGS, type Lang } from "@/lib/types";

export const maxDuration = 60;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

/** Follow-up questions about the document the person just scanned. */
export async function POST(req: Request) {
  let body: { result?: unknown; question?: unknown; language?: unknown; image?: unknown; mediaType?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
  const language: Lang = LANGS.includes(body.language as Lang) ? (body.language as Lang) : "en";
  if (!question || !body.result) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const analysis = normalizeAnalysis(body.result);

  const history = Array.isArray(body.history)
    ? (body.history as { q?: unknown; a?: unknown }[])
        .slice(-4)
        .filter((h) => typeof h.q === "string" && typeof h.a === "string")
    : [];

  const content: Anthropic.Messages.ContentBlockParam[] = [];
  const image = typeof body.image === "string" ? body.image : "";
  if (image && image.length < 12 * 1024 * 1024) {
    if ((IMAGE_TYPES as readonly string[]).includes(body.mediaType as string)) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: body.mediaType as (typeof IMAGE_TYPES)[number], data: image },
      });
    } else if (body.mediaType === "application/pdf") {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: image } });
    }
  }
  content.push({
    type: "text",
    text: `<analysis>${JSON.stringify(analysis)}</analysis>\n${history
      .map((h) => `<earlier_question>${h.q}</earlier_question><earlier_answer>${h.a}</earlier_answer>`)
      .join("\n")}\n<question>${question}</question>`,
  });

  const system = `You are Explain It, helping a resident of Glendale, California with a document they just scanned. You have the document${image ? " (image attached)" : ""} and your earlier analysis of it. Today is ${todayInLA()}.

Answer the person's question in ${LANGUAGE_NAMES[language]}, in plain words at a 6th-grade reading level. Keep it short: 2–5 sentences, or a few short bullet points. Be specific and use details from the document (dates, amounts, phone numbers, websites). Never invent facts about the document; if it doesn't say, tell them and say who to call to find out. You may use general knowledge of how things usually work in California, and say when something is general rather than from their document. You are not a lawyer; don't add disclaimers, the app shows one. Plain text only, no markdown headings.`;

  try {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: 3000,
      system,
      output_config: { effort: "low" },
      messages: [{ role: "user", content }],
    });
    const text = res.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!text) throw new Error(`empty answer (${res.stop_reason})`);
    return NextResponse.json({ answer: text });
  } catch (err) {
    console.error("[ask] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "ask_failed" }, { status: 502 });
  }
}
