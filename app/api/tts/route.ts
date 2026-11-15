import "server-only";
import { NextResponse } from "next/server";
import { LANGS, type Lang } from "@/lib/types";

/*
 * Read-aloud with natural neural voices in all five languages (Azure AI Speech).
 * Phones rarely have built-in Armenian or Tagalog voices, so this fills the gap.
 * Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (e.g. "westus") in the environment.
 * Without them, GET reports enabled:false and the app uses the phone's own voices.
 */

export const maxDuration = 30;

const VOICES: Record<Lang, { locale: string; voice: string }> = {
  en: { locale: "en-US", voice: "en-US-JennyNeural" },
  hy: { locale: "hy-AM", voice: "hy-AM-AnahitNeural" },
  es: { locale: "es-US", voice: "es-US-PalomaNeural" },
  ko: { locale: "ko-KR", voice: "ko-KR-SunHiNeural" },
  tl: { locale: "fil-PH", voice: "fil-PH-BlessicaNeural" },
};

const key = () => process.env.AZURE_SPEECH_KEY;
const region = () => process.env.AZURE_SPEECH_REGION;

export async function GET() {
  return NextResponse.json({ enabled: !!(key() && region()) });
}

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function POST(req: Request) {
  if (!key() || !region()) return NextResponse.json({ error: "tts_not_configured" }, { status: 503 });
  let body: { text?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 4000) : "";
  const lang: Lang = LANGS.includes(body.lang as Lang) ? (body.lang as Lang) : "en";
  if (!text) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const v = VOICES[lang];
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${v.locale}"><voice name="${v.voice}"><prosody rate="-8%">${xml(
    text,
  ).replace(/\n+/g, '<break time="400ms"/>')}</prosody></voice></speak>`;

  const res = await fetch(`https://${region()}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key()!,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "doc-deco",
    },
    body: ssml,
  });
  if (!res.ok) {
    console.error("[tts] azure error", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "tts_failed" }, { status: 502 });
  }
  return new Response(res.body, {
    headers: { "content-type": "audio/mpeg", "cache-control": "no-store" },
  });
}
