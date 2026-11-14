import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { runText } from "@/lib/claude";
import { normalizeAnalysis } from "@/lib/normalize";
import { buildAskSystemPrompt } from "@/lib/prompt";
import { LANGS, type Lang } from "@/lib/types";

export const maxDuration = 60;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
const MAX_QUESTION = 400;
const MAX_IMAGE_BASE64 = 4_000_000;

/**
 * POST /api/ask
 * { question, language, result: <analysis JSON>, history?: [{q, a}], image?, mediaType? }
 * A short, plain-language answer about the scanned document (not a general chatbot).
 */
export async function POST(req: Request) {
  let body: {
    question?: unknown;
    language?: unknown;
    result?: unknown;
    history?: unknown;
    image?: unknown;
    mediaType?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim().slice(0, MAX_QUESTION) : "";
  if (!question || !body.result || !LANGS.includes(body.language as Lang)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const language = body.language as Lang;
  const analysis = normalizeAnalysis(body.result);

  // The document itself, when the client still has it, so answers can use details the summary left out.
  const docBlocks: Anthropic.Beta.Messages.BetaContentBlockParam[] = [];
  const image = typeof body.image === "string" ? body.image.replace(/^data:[^,]+,/, "") : "";
  const mediaType = typeof body.mediaType === "string" ? body.mediaType : "";
  if (image && image.length <= MAX_IMAGE_BASE64) {
    if (mediaType === "application/pdf") {
      docBlocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: image } });
    } else if ((IMAGE_TYPES as readonly string[]).includes(mediaType)) {
      docBlocks.push({ type: "image", source: { type: "base64", media_type: mediaType as ImageType, data: image } });
    }
  }

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((h): h is { q: string; a: string } => typeof h?.q === "string" && typeof h?.a === "string")
    .slice(-3);

  const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [
    {
      role: "user",
      content: [
        ...docBlocks,
        { type: "text", text: `Here is your analysis of my document:\n${JSON.stringify(analysis)}` },
        { type: "text", text: history.length ? history[0].q : question },
      ],
    },
  ];
  // Earlier questions in this session, so short follow-ups ("and if I'm late?") make sense.
  history.forEach((h, i) => {
    messages.push({ role: "assistant", content: h.a });
    messages.push({ role: "user", content: i + 1 < history.length ? history[i + 1].q : question });
  });

  try {
    const answer = await runText(buildAskSystemPrompt(language), messages, { effort: "low", maxTokens: 3000 });
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[ask] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "ask_failed" }, { status: 502 });
  }
}
