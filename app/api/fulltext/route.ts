import "server-only";
import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getClient, MODEL } from "@/lib/claude";
import { LANGUAGE_NAMES } from "@/lib/prompt";
import { LANGS, type Lang } from "@/lib/types";

export const maxDuration = 60;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_TOTAL = 12 * 1024 * 1024;

/** The whole document, paragraph by paragraph: the original text next to a faithful translation. */
export async function POST(req: Request) {
  let body: { pages?: unknown; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const language: Lang = LANGS.includes(body.language as Lang) ? (body.language as Lang) : "en";
  const pages = Array.isArray(body.pages) ? (body.pages as { image?: unknown; mediaType?: unknown }[]).slice(0, 5) : [];

  const content: Anthropic.Messages.ContentBlockParam[] = [];
  let total = 0;
  for (const p of pages) {
    const data = typeof p.image === "string" ? p.image.replace(/^data:[^,]+,/, "") : "";
    const type = typeof p.mediaType === "string" ? p.mediaType : "";
    total += data.length;
    if (!data || total > MAX_TOTAL) return NextResponse.json({ error: "bad_image" }, { status: 400 });
    if (type === "application/pdf") content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
    else if ((IMAGE_TYPES as readonly string[]).includes(type))
      content.push({ type: "image", source: { type: "base64", media_type: type as (typeof IMAGE_TYPES)[number], data } });
    else return NextResponse.json({ error: "bad_type" }, { status: 400 });
  }
  if (!content.length) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  content.push({ type: "text", text: "Transcribe and translate this document." });

  const system = `You transcribe official documents and translate them faithfully into ${LANGUAGE_NAMES[language]} for a resident of Glendale, California.

Go through the document from top to bottom and split it into short sections: each heading, paragraph, labelled field (like "Date: …" or "Amount due: …"), table row or list item is one section. For each section give:
- "original": the text exactly as printed (fix nothing; write [unreadable] for parts you can't read).
- "translated": a faithful translation into ${LANGUAGE_NAMES[language]}. Keep names, numbers, dates, amounts, phone numbers, addresses, codes and URLs exactly as they are. Translate the meaning plainly, using the standard everyday words a native speaker would use for official terms (for example the usual word for "juror" or "citation" in that language); do not summarize, add advice or leave anything out.

Skip decorative things like barcodes, logos and page borders. Never invent text that isn't there.`;

  try {
    const res = await getClient().messages.create(
      {
        model: MODEL,
        max_tokens: 12000,
        system,
        output_config: {
          effort: "medium",
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { original: { type: "string" }, translated: { type: "string" } },
                    required: ["original", "translated"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["sections"],
              additionalProperties: false,
            },
          },
        },
        messages: [{ role: "user", content }],
      },
      { timeout: 55_000 },
    );
    if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") throw new Error(`stop: ${res.stop_reason}`);
    const raw = res.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed = JSON.parse(raw) as { sections?: { original?: unknown; translated?: unknown }[] };
    const sections = (parsed.sections ?? [])
      .map((s) => ({ original: String(s.original ?? ""), translated: String(s.translated ?? "") }))
      .filter((s) => s.original || s.translated);
    if (!sections.length) throw new Error("empty");
    return NextResponse.json({ sections });
  } catch (err) {
    console.error("[fulltext] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "fulltext_failed" }, { status: 502 });
  }
}
