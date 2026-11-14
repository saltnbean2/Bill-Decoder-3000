// Runs each sample through the LIVE API (scan in English, then translate to every
// language) and saves the real responses to data/demo-cache/{sample}.{lang}.json.
// Start the app first (npm run dev), then:  npm run record-cache
// Optional: BASE_URL=https://your-app.vercel.app npm run record-cache
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SAMPLES = { ticket: "parking-ticket.png", letter: "jury-summons.png", quote: "roofing-quote.png" };
const LANGS = ["hy", "es", "ko", "tl"];

async function post(url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}: ${await res.text()}`);
  return (await res.json()).result;
}

// Turn concrete dates near today into relative tokens ({{ISO:+10}}, {{DATE:+10}}, ...)
// so the cached demo stays correct on later days (resolved in lib/dates.ts).
const laToday = () => {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date()).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fmt = (t, o) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(new Date(t));
function tokenize(obj) {
  let s = JSON.stringify(obj, null, 2);
  for (let n = 40; n >= -40; n--) {
    const t = laToday() + n * 86_400_000;
    const k = n >= 0 ? `+${n}` : `${n}`;
    const iso = new Date(t).toISOString().slice(0, 10);
    const long = fmt(t, { month: "long", day: "numeric", year: "numeric" });
    const md = fmt(t, { month: "long", day: "numeric" });
    const wd = fmt(t, { weekday: "long" });
    s = s.split(iso).join(`{{ISO:${k}}}`);
    s = s.split(`${wd}, ${long}`).join(`{{WD:${k}}}, {{DATE:${k}}}`);
    s = s.split(long).join(`{{DATE:${k}}}`);
    s = s.replace(new RegExp(`${wd}, ${md}(?!\\d)`, "g"), `{{WD:${k}}}, {{MD:${k}}}`);
    s = s.replace(new RegExp(`${md}(?!\\d)`, "g"), `{{MD:${k}}}`);
  }
  return s;
}

const only = process.argv[2]; // optional: ticket | letter | quote
for (const [sample, file] of Object.entries(SAMPLES)) {
  if (only && only !== sample) continue;
  const png = await fs.readFile(path.join(root, "public", "samples", file));
  console.log(`scanning ${sample}…`);
  const en = await post("/api/scan", { image: png.toString("base64"), mediaType: "image/png", language: "en" });
  await fs.writeFile(path.join(root, "data", "demo-cache", `${sample}.en.json`), tokenize(en));
  console.log(`  en: ${en.document_type} — ${en.headline}`);
  for (const lang of LANGS) {
    const t = await post("/api/translate", { result: en, language: lang });
    await fs.writeFile(path.join(root, "data", "demo-cache", `${sample}.${lang}.json`), tokenize(t));
    console.log(`  ${lang}: ${t.headline}`);
  }
}
console.log("done — rebuild/redeploy so the new cache is bundled.");
