import "server-only";
import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getClient, MODEL } from "@/lib/claude";
import { todayInLA } from "@/lib/prompt";

export const maxDuration = 60;

/** Revises the parking-ticket appeal letter according to the person's instruction. */
export async function POST(req: Request) {
  let body: { letter?: unknown; instruction?: unknown; ticket?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const letter = typeof body.letter === "string" ? body.letter.slice(0, 12000) : "";
  const instruction = typeof body.instruction === "string" ? body.instruction.trim().slice(0, 1000) : "";
  if (!letter || !instruction) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const ticket = typeof body.ticket === "object" && body.ticket ? JSON.stringify(body.ticket).slice(0, 4000) : "{}";

  const system = `You edit a parking-ticket appeal letter for a resident of Glendale, California. Today is ${todayInLA()}.

Apply the person's change request to the letter. The request may be in any language (English, Armenian, Spanish, Korean, Tagalog); the letter itself always stays in clear, polite, formal English, because the city processes appeals in English.

Rules:
- Make exactly the change they ask for (add, remove, reword, shorten, change tone, fill in their name or details) and keep everything else the same.
- Facts the person states in their request may be used as true. Never invent any other facts.
- If they ask to add a reason but don't give the details, add it with a [BRACKETED] placeholder they can fill in, e.g. "[describe what blocked the sign]".
- When they give a detail that fills a [BRACKETED] placeholder, replace EVERY placeholder it fills, everywhere in the letter (for example, a name goes in both the sender block at the top and the signature). Keep other placeholders that are still unfilled.
- If they mention a photo or document, add an "Attached:" line or mention it where it fits.
- Keep the letter's structure (sender block, date, recipient, Re: line, body, closing).

Ticket facts for reference: ${ticket}

Return only the full revised letter text, ending with the signature block. Do not add any note, comment or explanation before or after the letter. No quotation marks around it, no markdown.`;

  try {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: 6000,
      system,
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: `<letter>\n${letter}\n</letter>\n\n<change_request>${instruction}</change_request>`,
        },
      ],
    });
    if (res.stop_reason === "refusal") throw new Error("refused");
    const text = res.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replace(/^<letter>\s*|\s*<\/letter>$/g, "")
      .replace(/\n\s*(?:\(?Note|NOTE|Changes made)[\s\S]*$/, "") // drop any commentary after the letter
      .trim();
    if (!text || res.stop_reason === "max_tokens") throw new Error(`bad letter (${res.stop_reason})`);
    return NextResponse.json({ letter: text });
  } catch (err) {
    console.error("[letter] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "letter_failed" }, { status: 502 });
  }
}
