import { NextResponse } from "next/server";
import { normalizeAnalysis, refreshDeadline } from "@/lib/normalize";
import { resolveDateTokens } from "@/lib/dates";
import { LANGS, type Lang, type SampleId } from "@/lib/types";

const SAMPLES: SampleId[] = ["ticket", "letter", "quote", "scam"];

/** Serves a cached demo response: GET /api/demo?sample=ticket&lang=en */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sample = url.searchParams.get("sample") as SampleId;
  const lang = (url.searchParams.get("lang") ?? "en") as Lang;
  if (!SAMPLES.includes(sample) || !LANGS.includes(lang)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    const mod = await import(`@/data/demo-cache/${sample}.${lang}.json`);
    const json = resolveDateTokens(JSON.stringify(mod.default ?? mod), lang);
    return NextResponse.json({ result: refreshDeadline(normalizeAnalysis(JSON.parse(json))) });
  } catch {
    return NextResponse.json({ error: "not_cached" }, { status: 404 });
  }
}
