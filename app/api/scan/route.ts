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
  let body: { image?: unknown; mediaType?: unknown; language?: unknown; pages?: unknown };
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

  const toBlock = (data: string, type: string): Anthropic.Beta.Messages.BetaContentBlockParam | null =>
    type === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : (IMAGE_TYPES as readonly string[]).includes(type)
        ? { type: "image", source: { type: "base64", media_type: type as ImageType, data } }
        : null;

  const first = toBlock(image, mediaType);
  if (!first) return NextResponse.json({ error: "bad_type" }, { status: 400 });

  // Optional extra pages of the same letter (multi-page scan), up to 5 pages in total.
  const extra = Array.isArray(body.pages) ? (body.pages as { image?: unknown; mediaType?: unknown }[]).slice(0, 4) : [];
  const blocks: Anthropic.Beta.Messages.BetaContentBlockParam[] = [first];
  let total = image.length;
  for (const pg of extra) {
    const data = typeof pg.image === "string" ? pg.image.replace(/^data:[^,]+,/, "") : "";
    const blk = data ? toBlock(data, typeof pg.mediaType === "string" ? pg.mediaType : "") : null;
    total += data.length;
    if (!blk || total > MAX_BASE64) return NextResponse.json({ error: "bad_image" }, { status: 400 });
    blocks.push(blk);
  }

  try {
    const result = await runAnalysis(buildScanSystemPrompt(language), [
      ...blocks,
      {
        type: "text",
        text:
          blocks.length > 1
            ? `Here is my document. It has ${blocks.length} pages, in order. Please explain the whole document.`
            : "Here is my document. Please explain it.",
      },
    ]);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[scan] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "scan_failed" }, { status: 502 });
  }
}
