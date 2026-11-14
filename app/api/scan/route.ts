import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { runAnalysis } from "@/lib/claude";
import { buildScanSystemPrompt } from "@/lib/prompt";
import { LANGS, type Lang } from "@/lib/types";

export const maxDuration = 60;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
const MAX_BASE64 = 12 * 1024 * 1024; // ~9 MB decoded; compressed photos are ~300 KB

export async function POST(req: Request) {
  let body: { image?: unknown; mediaType?: unknown; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image.replace(/^data:[^,]+,/, "") : "";
  const mediaType = typeof body.mediaType === "string" ? body.mediaType : "";
  const language: Lang = LANGS.includes(body.language as Lang) ? (body.language as Lang) : "en";

  if (!image || image.length > MAX_BASE64) {
    return NextResponse.json({ error: "bad_image" }, { status: 400 });
  }

  let block: Anthropic.Beta.Messages.BetaContentBlockParam;
  if (mediaType === "application/pdf") {
    block = { type: "document", source: { type: "base64", media_type: "application/pdf", data: image } };
  } else if ((IMAGE_TYPES as readonly string[]).includes(mediaType)) {
    block = { type: "image", source: { type: "base64", media_type: mediaType as ImageType, data: image } };
  } else {
    return NextResponse.json({ error: "bad_type" }, { status: 400 });
  }

  try {
    const result = await runAnalysis(buildScanSystemPrompt(language), [
      block,
      { type: "text", text: "Here is my document. Please explain it." },
    ]);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[scan] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "scan_failed" }, { status: 502 });
  }
}
