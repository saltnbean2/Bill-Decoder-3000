# Explain It

**Any paperwork. Explained in your language.**

Live: https://bill-decoder-3000.vercel.app (add `?demo=1` for demo mode)

## One-line summary

Explain It is a mobile web app for Glendale residents: take a photo of a confusing official document — a parking ticket, a letter from a court or government agency, or a contractor's quote — and in about 15 seconds get a plain-language explanation, the deadline, exactly what to do next, and warnings about anything suspicious, in English, Armenian, Spanish, Korean or Tagalog.

## The problem

Glendale is one of the most multilingual cities in LA County, with large Armenian, Spanish-speaking, Korean and Filipino communities. Many residents — often older adults and immigrants — receive official paperwork they can't fully read or understand. The consequences are real and expensive:

- **Missed deadlines** — an unanswered jury summons or city notice leads to fines or a court hearing.
- **Tickets paid that could have been contested** — even when the ticket itself contains errors.
- **Overcharges** — contractor quotes with no license, illegal deposits and "sign today only" pressure.
- **Scams that look official** — fake "IRS" letters demanding gift cards target exactly the people who can't double-check.

General-purpose AI chatbots don't solve this: the people who need help most won't open a chatbot, photograph a letter and write a good prompt — and a chatbot only explains, it doesn't act.

## What it does

### 1. Snap
One large button opens the phone's camera. No account, no sign-up, no typing. Photos are compressed on the phone, processed in memory and never stored. Letters with several pages can be scanned page by page (up to 5), and PDFs can be uploaded from a computer.

### 2. Understand
The AI identifies the type of document and explains it at about a 6th-grade reading level:
- **A one-sentence headline** ("This is a $73 parking ticket from City Parking Services.")
- **The deadline as a big countdown** ("⏰ 10 days left"), colour-coded by urgency, with the date and what is due.
- **What it means**, the amount owed, and **what happens if you ignore it**.
- **Red flags** — anything wrong, suspicious or worth questioning.
- If a photo is blurry or isn't a document, a friendly "retake" screen with photo tips — it never guesses.

### 3. Act
- **Step-by-step checklist** with tap-to-call phone numbers and tappable websites taken from the document.
- **📅 Calendar reminder** — one tap adds the deadline to iPhone/Apple, Google or Outlook calendar, with alerts 3 days and 1 day before.
- **👪 Send to family** — share a short summary by text or WhatsApp, plus a link that opens the full explanation on the family member's phone. The explanation is carried inside the link itself, so nothing is stored online.
- **💬 Ask a follow-up** — "Can I pay in parts?", "What if I miss the deadline?" — answered from the document, in your language.

## What it does for specific documents

**Parking tickets**
- Checks every field a valid citation needs (date, time, location, violation, plate, vehicle make, officer ID) and lists anything missing or inconsistent — e.g. "the ticket says Honda, but the officer's notes say Toyota Camry," "no officer ID."
- Rates the case honestly: strong, possible or weak (and says "just pay before late fees" when the ticket looks valid).
- **Writes a complete appeal letter**, filled in with the ticket's details, with the parts the person must confirm highlighted in yellow.
- **The letter can be customized by asking, in any of the five languages** — "add that a tree hid the sign," "my name is Ana Petrosyan," "make it shorter" — and it stays in English because the city processes appeals in English. It can also be edited by hand, undone, copied, emailed, or printed / saved as a PDF.

**Contractor and repair quotes**
- Compares each line item to typical Los Angeles prices and shows a gauge from "Good deal" to "Very high" (e.g. "~35% above typical").
- Flags California-specific problems: no contractor license number, a deposit above the legal limit (10% or $1,000, whichever is less), vague items like "misc materials," cash-only discounts and "today only" pressure.
- Links to the state license lookup and suggests questions to ask before signing.

**Official letters (courts, IRS, DMV, utilities, etc.)**
- Names the sender in plain words and says what they want.
- **Scam check:** assesses whether the letter looks legitimate, and if it claims to be from the IRS, the California Franchise Tax Board, Social Security, the California DMV or Glendale Water & Power, compares its phone number with the agency's real one. A mismatch shows a red warning — "This phone number is NOT the official IRS number" — with a button to call the real one.
- For scam letters, the fake "pay within 48 hours" deadline is labelled as a pressure trick instead of being shown as a countdown.

## Built for Glendale

- **Five languages:** English, Armenian (Հայերեն), Spanish, Korean (한국어) and Tagalog — every explanation, step and button. Switching language is one tap, and switching back is instant.
- **"Show in English"** — one tap to show the explanation in English to a son, daughter or clerk, and back.
- **Free help near you** — a verified directory of real local help lines, each checked against its official source: 211 LA County (free, 24/7, 140+ languages), Neighborhood Legal Services of LA County (free legal aid), the City of Glendale parking citation center, LA County Consumer & Business Affairs, the Contractors State License Board, the Bureau of Automotive Repair, LA Superior Court juror services, Glendale Water & Power, and the official IRS, FTB, Social Security and DMV numbers.
- **Ask Explain It** — an AI assistant, available from the home screen with no document needed ("Someone called saying they're the IRS and want gift cards — is it real?"). It uses tools rather than guessing: it looks up the verified local help directory, checks phone numbers against official agency numbers, and does date math.

## Accessibility

- Designed for older adults: large text, big tap targets, calm colours, one action per screen.
- **Bigger-text mode** with one tap, remembered on the phone.
- **Read aloud** in the selected language.
- Plain language at about a 6th-grade reading level; no legal jargon, technical terms explained in parentheses.
- Installable to the home screen like an app; works on any modern phone without an app store.
- Lighthouse (mobile): 96 performance, 100 accessibility, 100 best practices.

## Privacy and safety

- **No accounts, no database.** Photos are processed in memory and never stored.
- Recent results are kept **only on the person's own phone**, with a one-tap clear button.
- Family share links carry the explanation inside the link; the server never sees or stores it.
- The AI is instructed to **never invent a fact** — if a date or amount isn't visible, it says so. After translation, every number, date, amount and phone number is copied back from the original, so translation can never change the facts.
- Phone numbers used for the scam check and the help directory come from a verified list, not the AI.
- The app states on every result that it helps people understand documents and is not legal advice.

## How it's built

- **Frontend:** Next.js (App Router), TypeScript and Tailwind CSS, mobile-first, deployed on Vercel.
- **AI:** Anthropic's Claude (claude-sonnet-5-5) with vision, using structured tool output so every result has the same reliable shape. Separate calls handle translation, follow-up questions (a small tool-using agent), and appeal-letter edits (structured output).
- **Reliability:** retries on busy or dropped connections within a time budget, re-asks if a section is missing, and a friendly error screen with "Try again" that reuses the same photo.
- **Calendar:** standard .ics files with reminders, plus Google and Outlook links — no accounts needed.
- **Demo safety net:** four built-in sample documents (parking ticket, jury summons, roofing quote, scam letter) with saved answers, automatic fallback if the network is slow, and a demo mode for presentations.

## Testing

- Each of the four sample documents was run through the live AI three times: the ticket's defects, the overpriced quote, the scam letter and the jury summons date were caught correctly in all 12 runs.
- Blurry photos and non-documents correctly produce the retake screen.
- The API key is never sent to the browser (checked in the built app).

## What's next

- Put it where Glendale residents already go for help: the public library, senior centers and legal-aid clinics.
- Add more document types: rent and eviction notices, medical bills, school district letters.
- Add more languages spoken in Glendale.
