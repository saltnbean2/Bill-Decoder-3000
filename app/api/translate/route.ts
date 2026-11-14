import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/claude";
import { normalizeAnalysis } from "@/lib/normalize";
import { buildTranslateSystemPrompt } from "@/lib/prompt";
import { mergeTranslation } from "@/lib/merge";
import { LANGS, type Analysis, type Lang } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { result?: unknown; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!LANGS.includes(body.language as Lang) || !body.result) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const language = body.language as Lang;
  const original = normalizeAnalysis(body.result);

  // The appeal letter always stays in English, so don't send it (faster, cheaper).
  const toTranslate: Analysis = original.ticket
    ? { ...original, ticket: { ...original.ticket, appeal_letter: "" } }
    : original;

  try {
    const translated = await runAnalysis(
      buildTranslateSystemPrompt(language),
      [{ type: "text", text: JSON.stringify(toTranslate) }],
      { effort: "low" },
    );
    return NextResponse.json({ result: mergeTranslation(original, translated) });
  } catch (err) {
    console.error("[translate] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "translate_failed" }, { status: 502 });
  }
}
