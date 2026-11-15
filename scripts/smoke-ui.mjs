// Clicks through every screen of the app on a phone-sized browser, like a user would.
// Run: BASE_URL=https://bill-decoder-3000.vercel.app npm run smoke:ui
// Uses the live AI for 3 calls (letter edit, agent, multi-page scan).
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DEMO = `${BASE}/?demo=1`;
const results = [];
const check = (name, ok, info = "") => {
  results.push(ok);
  console.log(`${ok ? "✓" : "✗"} ${name}${info ? ` — ${info}` : ""}`);
};

const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "en-US",
});
// Edge on Windows has a real share sheet; hide it so the test sees the Text / WhatsApp fallback, as in headless Chromium.
if (process.env.PW_CHANNEL) await ctx.addInitScript(() => { delete Navigator.prototype.share; });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && !/favicon|Failed to load resource/.test(m.text()) && errors.push(m.text()));

const visible = (text) => page.getByText(text, { exact: false }).first().isVisible().catch(() => false);
const has = async (text, ms = 8000) => {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: ms });
    return true;
  } catch {
    return false;
  }
};
async function home() {
  await page.goto(DEMO);
  await page.waitForTimeout(800);
}
async function sample(name) {
  await home();
  await page.getByRole("button", { name }).click();
  return has("What this means", 12000);
}

// --- Home
await page.goto(DEMO);
await page.evaluate(() => localStorage.clear());
await home();
for (const label of ["Scan a document", "Upload a photo", "Letter has several pages?", "Ask a question", "Glendale help numbers", "Parking ticket", "Court letter", "Contractor quote", "Suspicious letter"]) {
  check(`Home shows "${label}"`, await page.getByRole("button", { name: label }).first().isVisible());
}
const tapTargets = await page.$$eval("button, a, select", (els) =>
  els.filter((e) => e.offsetParent && e.getBoundingClientRect().height < 40).map((e) => e.textContent?.trim().slice(0, 30)),
);
check("Every home tap target ≥ 40px tall", tapTargets.length === 0, tapTargets.join(", "));

// --- Parking ticket
check("Ticket sample loads", await sample(/Parking ticket/));
check("Ticket: deadline countdown", await visible("days left"));
check("Ticket: problems found", await has("Problems on the ticket"));
check("Ticket: appeal letter", await has("Your appeal letter is ready"));
check("Ticket: print button", await has("Print / save as PDF"));
check("Ticket: free help card", await has("Free help near you"));
check("Ticket: whole-letter button", await has("Read the whole letter"));
check("Ticket: Glendale parking not shown for a non-Glendale ticket", !(await visible("City of Glendale Parking Citation Center")));

// Steps tick off
const step = page.getByRole("button", { name: /^1\. / }).first();
await step.click();
check("Steps can be ticked off", (await step.getAttribute("aria-pressed")) === "true");

// Calendar
await page.getByRole("button", { name: /Don.t miss it/ }).click();
const gHref = await page.getByRole("link", { name: "Google" }).getAttribute("href");
const oHref = await page.getByRole("link", { name: "Outlook" }).getAttribute("href");
check("Calendar: Google link pre-filled", /calendar\.google\.com.*dates=\d{8}/.test(gHref ?? ""));
check("Calendar: Outlook link pre-filled", /outlook\.live\.com.*startdt=\d{4}-\d{2}-\d{2}/.test(oHref ?? ""));

// Share (headless has no share sheet, so the Text / WhatsApp buttons show)
await page.getByRole("button", { name: /Send to family/ }).click();
await page.waitForTimeout(500);
const wa = await page.getByRole("link", { name: /WhatsApp/ }).getAttribute("href").catch(() => "");
check("Share: WhatsApp message includes the family link", decodeURIComponent(wa ?? "").includes("#r="));

// Share link opens on another phone
const link = decodeURIComponent(wa ?? "").match(/https?:\/\/\S+#r=\S+/)?.[0];
if (link) {
  const p2 = await ctx.newPage();
  await p2.goto(link);
  const ok = await p2.getByText("Shared with you", { exact: false }).first().waitFor({ timeout: 8000 }).then(() => true, () => false);
  check("Share link opens the explanation on another phone", ok);
  await p2.close();
} else check("Share link opens the explanation on another phone", false, "no link found");

// Letter customize (live AI)
await page.getByRole("button", { name: "Make it shorter" }).click();
check("Letter: change by asking (live AI)", await has("Undo", 40000));

// Language switch + Show in English
await page.locator("select").first().selectOption("hy");
check("Switch to Armenian", await has("Ինչ է սա նշանակում", 20000));
const hyHeadline = await page.locator("h1").first().textContent();
check("Armenian text renders", /[Ա-֏]/.test(hyHeadline ?? ""));
await page.getByRole("button", { name: /Ցույց տալ անգլերեն/ }).click();
check("Show in English", await has("What this means", 15000));
await page.getByRole("button", { name: /Հայերեն/ }).first().click();
check("Back to Armenian", await has("Ինչ է սա նշանակում", 10000));
await page.locator("select").first().selectOption("en");
await page.waitForTimeout(1500);

// --- Quote
check("Quote sample loads", await sample(/Contractor quote/));
check("Quote: price gauge", (await has("above typical")) || (await has("Very high")));
check("Quote: no license warning", await has("No license number"));
check("Quote: questions to ask", await has("Ask them this before you sign"));

// --- Court letter
check("Court letter sample loads", await sample(/Court letter/));
check("Court letter: 10 days left", await has("10 days left"));

// --- Scam letter
check("Scam sample loads", await sample(/Suspicious letter/));
check("Scam: wrong-number warning", await has("NOT the official IRS number"));
check("Scam: fake deadline labelled", await has("pressure trick"));
check("Scam: no calendar reminder for a fake deadline", !(await visible("Don't miss it")));

// --- Recent documents
await home();
check("Recent documents listed on home", await has("Recent"));
await page.getByRole("button", { name: /scam/i }).first().click().catch(() => {});
check("Recent document reopens", await has("What this means", 8000));

// --- Directory
await home();
await page.getByRole("button", { name: /Glendale help numbers/ }).click();
check("Directory opens", await has("Not sure where to start"));
check("Directory: 211 and IRS listed", (await has("211 LA County")) && (await has("(800) 829-1040")));
const telLinks = await page.locator('a[href^="tel:"]').count();
check("Directory: tap-to-call links", telLinks >= 10, `${telLinks} phone links`);

// --- Ask agent (live AI)
await home();
await page.getByRole("button", { name: /^(💬 )?Ask a question$/ }).click();
await page.getByRole("button", { name: /Where can I get free legal help/ }).click();
check("Agent answers (live AI)", await has("433-6251", 40000));

// --- Bigger text
await home();
await page.getByRole("button", { name: "Bigger text" }).click();
await page.waitForTimeout(400);
const zoom = await page.evaluate(() => document.documentElement.style.zoom);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check("Bigger text turns on", zoom === "1.18");
check("Bigger text: no sideways scrolling", !overflow);
await page.getByRole("button", { name: "Bigger text" }).click();

// --- Multi-page scan (live AI)
await home();
await page.getByRole("button", { name: /Letter has several pages/ }).click();
const upload = page.locator('input[type=file]:not([capture])');
await upload.setInputFiles(path.join(root, "public/samples/jury-summons.png"));
await page.waitForTimeout(800);
await upload.setInputFiles(path.join(root, "public/samples/jury-summons.png"));
await page.waitForTimeout(800);
check("Multi-page: 2 pages added", await has("Explain these 2 pages"));
await page.getByRole("button", { name: /Explain these 2 pages/ }).click();
check("Multi-page: explained (live AI)", await has("What this means", 55000));

// --- Error screen when the network fails
await home();
await page.route("**/api/scan", (r) => r.abort());
await page.locator('input[type=file]:not([capture])').setInputFiles(path.join(root, "public/samples/jury-summons.png"));
check("Network failure shows friendly error + Try again", (await has("We couldn't finish that", 20000)) && (await visible("Try again")));
await page.unroute("**/api/scan");

check("No JavaScript errors in the console", errors.length === 0, errors.slice(0, 3).join(" | "));
await browser.close();

const failed = results.filter((x) => !x).length;
console.log(failed ? `\n${failed} of ${results.length} checks failed` : `\nAll ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
