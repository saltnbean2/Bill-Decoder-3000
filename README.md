# Explain It

**Any paperwork. Explained in your language.**

Take a photo of a parking ticket, an official letter or a contractor quote. Explain It says what it is, finds the deadline, lists what to do, flags red flags, and does some of the work for you: it drafts the ticket appeal letter or tells you whether a quote is overpriced. Results come in English, Armenian, Spanish, Korean or Tagalog.

Built for the Glendale hackathon ("make Glendale better").

## Run it locally

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

Open http://localhost:3000. To use the camera from your phone, open the same URL on your Wi-Fi IP (e.g. `http://192.168.1.20:3000`). iOS only opens the camera over HTTPS, so for phone testing use the Vercel deploy.

The key is read only on the server (`lib/claude.ts`) and is never sent to the browser.

## Deploy to Vercel

1. Import this GitHub repo at vercel.com/new (framework: Next.js, no settings to change).
2. Add the environment variable `ANTHROPIC_API_KEY` under Project → Settings → Environment Variables.
3. Deploy. The API routes have `maxDuration = 60`, which fits the Hobby plan.

Or from the terminal: `npx vercel` then `npx vercel env add ANTHROPIC_API_KEY` and `npx vercel --prod`.

## How it works

| Piece | File |
|---|---|
| Scan API (image → structured analysis) | `app/api/scan/route.ts` |
| Translate API (analysis JSON → other language, no image re-send) | `app/api/translate/route.ts` |
| Cached demo responses | `app/api/demo/route.ts`, `data/demo-cache/*.json` |
| System prompt + tool schema | `lib/prompt.ts`, `lib/schema.ts` |
| Claude call | `lib/claude.ts` |
| Null-safe normalization (UI never crashes on missing fields) | `lib/normalize.ts` |
| UI strings for en / hy / es / ko / tl | `lib/i18n.ts` |
| Client-side compression (≤1600px, JPEG 0.85) | `lib/compress.ts` |
| Screens | `components/ExplainApp.tsx`, `components/Results.tsx` |

**Model:** `claude-sonnet-5-5`, with the image sent as base64.

**Structured output:** one tool, `report_document_analysis`, with the JSON schema from the spec. One change from the spec: `claude-sonnet-5-5` rejects a forced `tool_choice: {type: "tool"}` with a 400 error, so the call uses `tool_choice: auto`. The system prompt tells the model to always call the tool, and if it ever answers in plain text instead, the server asks once more. The result then passes through `normalizeAnalysis`, which fills defaults and **recomputes `days_remaining` from the date**, so the countdown is always arithmetically right.

**Other settings:** `effort: medium` for scans and `low` for translations, for speed. `max_tokens: 8000` (the spec said 4000, but thinking tokens count against the limit, so there's headroom to avoid cut-off answers). The client timeout is 45s. If a safety classifier declines a request, the server-side fallback (`fallbacks: "default"`) retries it on another model inside the same call.

**Translation:** the appeal letter is never sent for translation; it always stays in English. After translating, every enum, number, date, amount and contact is copied back from the original (`lib/merge.ts`), so translation can't change the facts. Translations are cached per language in the browser, so switching back is instant.

## Demo mode and the safety net

- **`?demo=1`**: tapping a sample chip shows the cached response after a 2.5s loading animation. No network call to Claude. Live camera scans still go to the real API.
- **Automatic fallback**: without demo mode, sample chips call the live API. If that fails or takes longer than 20s, the cached response is shown quietly, with no error screen.
- **Language switch in demo mode** uses cached translations when they exist (`{sample}.{lang}.json`) and otherwise calls `/api/translate`.

**Sample documents** live in `public/samples/` as HTML (fictional names and addresses, a "SAMPLE — DEMO ONLY" watermark, no real seals). Their dates are computed relative to today in Los Angeles, so the deadlines always look realistic:

- Parking ticket: issued 5 days ago, due in 16 days. Defects: HONDA vs Toyota Camry, and a blank officer ID.
- Jury summons: report date in 10 days.
- Roofing quote: $20,250 (~35% above typical), no license, 40% deposit, "$2,400 misc materials".

**The morning of the demo**, re-render the PNGs and re-record the cache so every date matches the day. English dates in the cache are stored as relative tokens, but dates written out in other languages are not:

```bash
npm run samples
BASE_URL=https://bill-decoder-3000.vercel.app npm run record-cache
git commit -am "Refresh demo samples" && git push   # Vercel redeploys
```

**Cached responses:** `data/demo-cache/` comes seeded with hand-written English and Armenian results that use relative date tokens (`{{ISO:+10}}`, `{{DATE:+10}}`). Once your API key works, replace them with real model output, then rebuild or redeploy:

```bash
npm run dev            # in one terminal
npm run record-cache   # scans each sample in English, translates to hy/es/ko/tl
```

## Quality checks

```bash
npm run check   # each sample through the live API 3x: ticket defects caught, quote flagged high, summons date correct
```

Also check before the demo:
- A blurry photo, and a photo of something that isn't a document → both should show the friendly retake screen.
- `npm run build && grep -rl "sk-ant" .next/static` → should print nothing.
- Lighthouse (mobile) on `/`.

## 90-second demo script

1. **(0:00)** Open the deployed URL with `?demo=1` on the phone. "Glendale residents get paperwork they can't read. Explain It reads it for them."
2. **(0:10)** Tap **🅿️ Parking ticket**. Point at the amber **"16 days left"** badge. Scroll to **"Problems on the ticket"**: *the ticket says HONDA, but the officer wrote Toyota Camry, and there's no officer ID.* Show **Strong case**, then **"Your appeal letter is ready"**, with the yellow parts to edit. Tap **Copy letter** to show "Copied ✓".
3. **(0:35)** Tap **Scan another**, then **🔨 Contractor quote**. Point at the gauge: **"~35% above typical"**. Scroll to **"⚠️ No license number on this quote"** and the questions to ask before signing. Mention the 40% deposit when the legal limit is $1,000.
4. **(0:55)** Tap **Scan another**, then **📷 Scan a document**, and photograph the printed jury summons live. (Live scans always use the real API.) Show **"10 days left"** and the tappable phone number.
5. **(1:15)** Switch the language picker to **ՀԱՅ**. Everything, including the steps and the deadline, is now in Armenian. "Same for Spanish, Korean and Tagalog."
6. **(1:25)** "No accounts, photos are never stored, and it's not legal advice. It's a calm friend who reads English paperwork for you."

Backup: if the live scan is slow on hackathon Wi-Fi, tap the **✉️ City letter** chip instead. It falls back to the cache automatically after 20s.
