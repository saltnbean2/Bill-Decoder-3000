// Tests every API route on a deployed (or local) Explain It, including bad input.
// Run: BASE_URL=https://bill-decoder-3000.vercel.app npm run smoke
// Uses the live AI for ~8 calls (a few cents).
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const results = [];
const check = (name, ok, info = "") => {
  results.push(ok);
  console.log(`${ok ? "✓" : "✗"} ${name}${info ? ` — ${info}` : ""}`);
};
const post = async (url, body, raw = false) => {
  const t0 = Date.now();
  const res = await fetch(BASE + url, {
    method: "POST",
    headers: raw ? {} : { "content-type": "application/json" },
    body: raw ? body : JSON.stringify(body),
  });
  const ms = Date.now() - t0;
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text, secs: (ms / 1000).toFixed(1), headers: res.headers };
};
const png = async (f) => (await fs.readFile(path.join(root, "public", "samples", f))).toString("base64");

// --- Pages and static files
for (const p of ["/", "/manifest.webmanifest", "/icon.png", "/apple-icon.png", "/icon-512.png", "/samples/parking-ticket.png", "/samples/scam-letter.png"]) {
  const r = await fetch(BASE + p);
  check(`GET ${p}`, r.ok, String(r.status));
}

// --- Demo cache: every sample in every language
const SAMPLES = ["ticket", "letter", "quote", "scam"];
const LANGS = ["en", "hy", "es", "ko", "tl"];
let cacheOk = 0;
const missing = [];
for (const s of SAMPLES)
  for (const l of LANGS) {
    const r = await fetch(`${BASE}/api/demo?sample=${s}&lang=${l}`);
    const j = r.ok ? await r.json() : null;
    if (j?.result?.headline && !/\{\{/.test(JSON.stringify(j))) cacheOk++;
    else missing.push(`${s}.${l}`);
  }
check("Demo cache: 4 samples × 5 languages", cacheOk === 20, missing.length ? `missing/broken: ${missing.join(", ")}` : "20/20");
const bad = await fetch(`${BASE}/api/demo?sample=nope&lang=en`);
check("Demo cache rejects unknown sample", bad.status === 400);

// --- Scan: bad input is rejected cleanly
check("Scan rejects empty body", (await post("/api/scan", "not json", true)).status === 400);
check("Scan rejects missing image", (await post("/api/scan", { mediaType: "image/png" })).status === 400);
check("Scan rejects wrong file type", (await post("/api/scan", { image: "aGVsbG8=", mediaType: "text/plain" })).status === 400);

// --- Translate (live AI)
const ticketEn = (await (await fetch(`${BASE}/api/demo?sample=ticket&lang=en`)).json()).result;
const tr = await post("/api/translate", { result: ticketEn, language: "ko" });
check(
  "Translate EN → Korean",
  tr.status === 200 && /[가-힣]/.test(tr.json?.result?.headline ?? "") && tr.json.result.ticket?.appeal_letter === ticketEn.ticket.appeal_letter,
  `${tr.secs}s, letter kept in English: ${tr.json?.result?.ticket?.appeal_letter === ticketEn.ticket.appeal_letter}`,
);
check("Translate rejects bad language", (await post("/api/translate", { result: ticketEn, language: "xx" })).status === 400);

// --- Ask agent (live AI): with a document, and on its own
const a1 = await post("/api/ask", { result: ticketEn, question: "How many days do I have left?", language: "en" });
check("Ask about a document", a1.status === 200 && (a1.json?.answer ?? "").length > 20, `${a1.secs}s`);
const a2 = await post("/api/ask", { question: "Someone from (818) 555-0199 says they are the IRS and wants gift cards. Real?", language: "es" });
check("Ask agent (no document, Spanish, scam check)", a2.status === 200 && /800\D{0,3}829\D{0,3}1040/.test(a2.json?.answer ?? ""), `${a2.secs}s, gave real IRS number: ${/800\D{0,3}829\D{0,3}1040/.test(a2.json?.answer ?? "")}`);
check("Ask rejects empty question", (await post("/api/ask", { question: "" })).status === 400);

// --- Letter editing (live AI)
const le = await post("/api/letter", { letter: ticketEn.ticket.appeal_letter, instruction: "My name is Ana Petrosyan. Add that a tree hid the sign.", ticket: { citation_number: ticketEn.ticket.citation_number } });
const letter = le.json?.letter ?? "";
check("Edit appeal letter", le.status === 200 && /Ana Petrosyan/.test(letter) && /tree/i.test(letter) && !/^\s*Note/im.test(letter), `${le.secs}s`);
check("Letter rejects empty instruction", (await post("/api/letter", { letter: "x", instruction: "" })).status === 400);

// --- Full-letter translation (live AI)
const ft = await post("/api/fulltext", { language: "es", pages: [{ image: await png("jury-summons.png"), mediaType: "image/png" }] });
check("Read the whole letter (Spanish)", ft.status === 200 && (ft.json?.sections?.length ?? 0) > 5 && /555-0143/.test(JSON.stringify(ft.json)), `${ft.secs}s, ${ft.json?.sections?.length ?? 0} sections`);
check("Full text rejects no pages", (await post("/api/fulltext", { language: "es", pages: [] })).status === 400);

// --- Calendar file
const fd = new FormData();
fd.append("title", "Deadline: Parking ticket");
fd.append("date", "2026-12-01");
fd.append("details", "Line one, with comma; and semicolon");
const ics = await post("/api/ics", fd, true);
check(
  "Calendar file (.ics) with reminders",
  ics.status === 200 && ics.headers.get("content-type")?.includes("text/calendar") && (ics.text.match(/BEGIN:VALARM/g) ?? []).length === 3 && ics.text.includes("DTSTART;VALUE=DATE:20261201"),
);
const fd2 = new FormData();
fd2.append("title", "x");
fd2.append("date", "tomorrow");
check("Calendar rejects bad date", (await post("/api/ics", fd2, true)).status === 400);

// --- Read-aloud voices
const tts = await (await fetch(`${BASE}/api/tts`)).json();
check("Read-aloud cloud voices", true, tts.enabled ? "ON (Azure key set)" : "OFF — add AZURE_SPEECH_KEY + AZURE_SPEECH_REGION in Vercel for Armenian/Tagalog voices");

const failed = results.filter((x) => !x).length;
console.log(failed ? `\n${failed} check(s) failed` : `\nAll ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
