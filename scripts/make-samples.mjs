// Renders the sample HTML documents in public/samples/ to PNGs with Playwright.
// Dates on the samples are relative to "today" in Los Angeles, so re-run this the
// morning of the demo:  npm run samples   (or: npm run samples -- 2026-11-20)
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const today = process.argv[2]; // optional YYYY-MM-DD
const samples = ["parking-ticket", "jury-summons", "roofing-quote", "scam-letter"];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 800, height: 1200 } });
for (const name of samples) {
  const file = path.join(root, "public", "samples", `${name}.html`);
  await page.goto(`file://${file}${today ? `?today=${today}` : ""}`);
  await page.waitForLoadState("networkidle");
  const el = await page.$(".ticket, .page");
  const out = path.join(root, "public", "samples", `${name}.png`);
  await el.screenshot({ path: out });
  console.log("wrote", path.relative(root, out));
}
await browser.close();
