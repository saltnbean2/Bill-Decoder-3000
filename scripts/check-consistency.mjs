// Quality bar: runs each sample through the live /api/scan 3 times and checks the
// key facts every time. Start the app first (npm run dev), then: npm run check
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const RUNS = Number(process.env.RUNS ?? 3);

const laToday = () => {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date()).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const iso = (days) => {
  const t = laToday();
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
};

const CHECKS = {
  "parking-ticket.png": (r) => [
    ["type is parking_ticket", r.document_type === "parking_ticket"],
    ["make mismatch caught", /honda|toyota|make/i.test(JSON.stringify(r.ticket?.missing_or_wrong_fields ?? []))],
    ["blank officer ID caught", /officer|badge|id/i.test(JSON.stringify(r.ticket?.missing_or_wrong_fields ?? []))],
    ["appeal letter written", (r.ticket?.appeal_letter ?? "").length > 200],
    ["contest strength strong", r.ticket?.contest_strength === "strong"],
  ],
  "roofing-quote.png": (r) => [
    ["type is contractor_quote", r.document_type === "contractor_quote"],
    ["verdict high/very_high", ["high", "very_high"].includes(r.quote?.verdict)],
    ["~35% above typical (20–55)", (r.quote?.percent_vs_typical ?? 0) >= 20 && (r.quote?.percent_vs_typical ?? 0) <= 55],
    ["no license number", !r.quote?.license_number],
    ["deposit flagged", /deposit|40%|8,100/i.test(JSON.stringify(r.red_flags))],
  ],
  "scam-letter.png": (r) => [
    ["type is official_letter", r.document_type === "official_letter"],
    ["verdict likely_scam", r.legitimacy_check?.verdict === "likely_scam"],
    ["fake number surfaced", /555-0199/.test(JSON.stringify(r))],
  ],
  "jury-summons.png": (r) => [
    ["type is official_letter", r.document_type === "official_letter"],
    [`deadline is ${iso(10)}`, r.deadline?.date === iso(10)],
    ["days_remaining is 10", r.deadline?.days_remaining === 10],
  ],
};

let failed = 0;
for (const [file, check] of Object.entries(CHECKS)) {
  const png = await fs.readFile(path.join(root, "public", "samples", file));
  for (let i = 1; i <= RUNS; i++) {
    const t0 = Date.now();
    const res = await fetch(`${BASE}/api/scan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: png.toString("base64"), mediaType: "image/png", language: "en" }),
    });
    const body = await res.json();
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    if (!res.ok) {
      console.log(`✗ ${file} run ${i}: HTTP ${res.status} ${JSON.stringify(body)}`);
      failed++;
      continue;
    }
    const results = check(body.result);
    const bad = results.filter(([, ok]) => !ok);
    failed += bad.length;
    console.log(`${bad.length ? "✗" : "✓"} ${file} run ${i} (${secs}s)${bad.length ? " — failed: " + bad.map(([n]) => n).join(", ") : ""}`);
  }
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
