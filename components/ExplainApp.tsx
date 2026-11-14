"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Results from "./Results";
import { AskCard, type QA } from "./Extras";
import { prepareFile } from "@/lib/compress";
import { LANG_FULL, LANG_LABELS, STRINGS } from "@/lib/i18n";
import { LANGS, type Analysis, type Lang, type SampleId } from "@/lib/types";

type Screen = "home" | "loading" | "results" | "error";
/** "server": network / API trouble (photo is fine). "photo": we couldn't use the file. "pdf": PDF too big. */
type ErrorKind = "server" | "photo" | "pdf";

const LOCALE: Record<Lang, string> = { en: "en-US", hy: "hy-AM", es: "es-US", ko: "ko-KR", tl: "fil-PH" };
const SAMPLE_FILES: Record<SampleId, string> = {
  ticket: "/samples/parking-ticket.png",
  letter: "/samples/jury-summons.png",
  quote: "/samples/roofing-quote.png",
};
const SAMPLE_TIMEOUT = 20_000;
// Server budget is 55s inside a 60s maxDuration; give the response a moment to arrive.
const LIVE_TIMEOUT = 58_000;
// Vercel rejects request bodies over 4.5 MB. Photos are compressed to ~300 KB; PDFs are not.
const MAX_PDF_BASE64 = 4_000_000;
// After the 4 rotating messages (4 × 1.2s), switch to a "still reading" note at ~8s.
const STILL_READING_TICK = 7;

class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

async function postJson<T>(url: string, body: unknown, timeoutMs: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new HttpError(res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function getCached(sample: SampleId, lang: Lang): Promise<Analysis | null> {
  try {
    const res = await fetch(`/api/demo?sample=${sample}&lang=${lang}`);
    if (!res.ok) return null;
    return ((await res.json()) as { result: Analysis }).result;
  } catch {
    return null;
  }
}

async function getCachedWithFallback(sample: SampleId, lang: Lang): Promise<[Analysis, Lang] | null> {
  const exact = await getCached(sample, lang);
  if (exact) return [exact, lang];
  const en = lang === "en" ? null : await getCached(sample, "en");
  return en ? [en, "en"] : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ExplainApp() {
  const [lang, setLangState] = useState<Lang>("en");
  const [screen, setScreen] = useState<Screen>("home");
  const [errorKind, setErrorKind] = useState<ErrorKind>("server");
  const [preview, setPreview] = useState<string>("");
  const [results, setResults] = useState<Partial<Record<Lang, Analysis>>>({});
  const [shownLang, setShownLangState] = useState<Lang>("en");
  const [translating, setTranslating] = useState(false);
  const [notice, setNotice] = useState("");
  const [demo, setDemo] = useState(false);
  const [tick, setTick] = useState(0);
  // Follow-up questions about the current document.
  const [qa, setQa] = useState<QA[]>([]);
  const [asking, setAsking] = useState<string | null>(null);
  const [askFailed, setAskFailed] = useState(false);
  // "Show in English" (e.g. to show a clerk), without changing the chosen language.
  const [showEnglish, setShowEnglish] = useState(false);
  // The compressed document, kept in memory only, so follow-up questions can look at it again.
  const docRef = useRef<{ base64: string; mediaType: string } | null>(null);
  const sampleRef = useRef<SampleId | null>(null);
  const lastInput = useRef<{ file: Blob; sample: SampleId | null } | null>(null);
  const runId = useRef(0);
  // Refs mirror state so async work always sees the latest language.
  const langRef = useRef<Lang>("en");
  const shownLangRef = useRef<Lang>("en");
  // In-flight translations, so a background prefetch and a tap on the picker share one request.
  const pending = useRef<Partial<Record<Lang, Promise<Analysis | null>>>>({});
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const setLang = (l: Lang) => {
    langRef.current = l;
    setLangState(l);
  };
  const setShownLang = (l: Lang) => {
    shownLangRef.current = l;
    setShownLangState(l);
  };

  const t = STRINGS[lang];

  // Read ?demo=1 and remembered language on the client only.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDemo(params.get("demo") === "1");
    try {
      const saved = localStorage.getItem("explainit.lang") as Lang | null;
      const q = params.get("lang") as Lang | null;
      const pick = (q && LANGS.includes(q) && q) || (saved && LANGS.includes(saved) && saved);
      if (pick) {
        setLang(pick);
        setShownLang(pick);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Rotate loading messages every 1.2s, then show a "still reading" note.
  useEffect(() => {
    if (screen !== "loading") return;
    setTick(0);
    const id = setInterval(() => setTick((n) => n + 1), 1200);
    return () => clearInterval(id);
  }, [screen]);
  const msgIdx = Math.min(tick, 3);
  const loadingMsg = tick >= STILL_READING_TICK ? t.stillReading : t.loading[msgIdx];

  const reset = useCallback(() => {
    runId.current++;
    pending.current = {};
    setScreen("home");
    setResults({});
    setPreview("");
    setNotice("");
    setTranslating(false);
    setQa([]);
    setAsking(null);
    setAskFailed(false);
    setShowEnglish(false);
    docRef.current = null;
    sampleRef.current = null;
    window.scrollTo({ top: 0 });
  }, []);

  /** Fetch a translation (cache first for samples in demo mode), de-duplicated per language. */
  function fetchTranslation(next: Lang, base: Analysis, sample: SampleId | null): Promise<Analysis | null> {
    const existing = pending.current[next];
    if (existing) return existing;
    const p = (async () => {
      if (sample && demo) {
        const cached = await getCached(sample, next);
        if (cached) return cached;
      }
      try {
        return (await postJson<{ result: Analysis }>("/api/translate", { result: base, language: next }, 45_000)).result;
      } catch {
        return sample ? await getCached(sample, next) : null;
      }
    })();
    pending.current[next] = p;
    void p.then((r) => {
      // Let a failed attempt be retried later.
      if (!r && pending.current[next] === p) delete pending.current[next];
    });
    return p;
  }

  async function analyze(file: Blob, sample: SampleId | null) {
    const id = ++runId.current;
    const scanLang = langRef.current;
    sampleRef.current = sample;
    lastInput.current = { file, sample };
    pending.current = {};
    docRef.current = null;
    setNotice("");
    setTranslating(false);
    setQa([]);
    setAsking(null);
    setAskFailed(false);
    setShowEnglish(false);
    setResults({});
    setScreen("loading");
    window.scrollTo({ top: 0 });

    let result: Analysis | null = null;
    let gotLang: Lang = scanLang;
    const fromCache = async (s: SampleId) => {
      const hit = await getCachedWithFallback(s, scanLang);
      if (hit) [result, gotLang] = hit;
    };

    let prepared: Awaited<ReturnType<typeof prepareFile>>;
    try {
      prepared = await prepareFile(file);
    } catch {
      // Couldn't decode the file (e.g. HEIC on desktop Chrome) — a photo problem, not a server one.
      if (id === runId.current) {
        setErrorKind("photo");
        setScreen("error");
      }
      return;
    }
    if (id !== runId.current) return;
    setPreview(prepared.previewUrl);
    docRef.current = { base64: prepared.base64, mediaType: prepared.mediaType };
    if (prepared.mediaType === "application/pdf" && prepared.base64.length > MAX_PDF_BASE64) {
      setErrorKind("pdf");
      setScreen("error");
      return;
    }

    try {
      if (sample && demo) {
        // Demo mode: cached answer after a short, believable loading animation.
        await sleep(2500);
        await fromCache(sample);
      } else {
        try {
          const res = await postJson<{ result: Analysis }>(
            "/api/scan",
            { image: prepared.base64, mediaType: prepared.mediaType, language: scanLang },
            sample ? SAMPLE_TIMEOUT : LIVE_TIMEOUT,
          );
          result = res.result;
        } catch (err) {
          // Samples silently fall back to the cache; live scans show the error screen.
          if (!sample) throw err;
          await fromCache(sample);
        }
      }
      if (!result) throw new Error("no result");
    } catch (err) {
      if (id === runId.current) {
        // 400 = the server couldn't use the file; anything else (timeout, 5xx, offline) is on our side.
        setErrorKind(err instanceof HttpError && err.status === 400 ? "photo" : "server");
        setScreen("error");
      }
      return;
    }
    if (id !== runId.current) return;
    const have = { [gotLang]: result } as Partial<Record<Lang, Analysis>>;
    setResults(have);
    setShownLang(gotLang);
    setScreen("results");

    // The person may have changed language while we were loading, or a cached fallback may be English.
    const want = langRef.current;
    if (gotLang !== want) void switchLanguage(want, have);
    // Demo safety net: get Armenian ready in the background while the presenter talks.
    else if (demo && want !== "hy" && result && (result as Analysis).document_type !== "unreadable") {
      void fetchTranslation("hy", result, sample).then((r) => {
        if (r && id === runId.current) setResults((prev) => ({ ...prev, hy: prev.hy ?? r }));
      });
    }
  }

  async function loadSample(sample: SampleId) {
    try {
      const res = await fetch(SAMPLE_FILES[sample]);
      const blob = await res.blob();
      await analyze(blob, sample);
    } catch {
      setErrorKind("server");
      setScreen("error");
    }
  }

  function retryLast() {
    const last = lastInput.current;
    if (last) void analyze(last.file, last.sample);
    else reset();
  }

  async function switchLanguage(next: Lang, have: Partial<Record<Lang, Analysis>> = results) {
    setLang(next);
    setShowEnglish(false);
    try {
      localStorage.setItem("explainit.lang", next);
    } catch {
      /* ignore */
    }
    if (!Object.keys(have).length) {
      // Nothing to translate yet (home, loading or error screen): just switch the UI.
      setShownLang(next);
      setNotice("");
      return;
    }
    if (have[next]) {
      setShownLang(next);
      setNotice("");
      return;
    }
    const base = have.en ?? have[shownLangRef.current] ?? Object.values(have)[0];
    if (!base) return;
    const id = runId.current;
    setTranslating(true);
    setNotice("");
    const translated = await fetchTranslation(next, base, sampleRef.current);
    if (id !== runId.current) return;
    if (langRef.current !== next) return; // the person already picked another language
    setTranslating(false);
    if (translated) {
      setResults((r) => ({ ...r, ...have, [next]: translated }));
      setShownLang(next);
    } else {
      // Put the picker back on the language the content is in, so picking `next` again retries.
      setLang(shownLangRef.current);
      setNotice(STRINGS[next].translateFailed);
    }
  }

  async function ask(question: string) {
    const base = showEnglish ? results.en : results[shownLangRef.current];
    if (!base) return;
    const id = runId.current;
    setAsking(question);
    setAskFailed(false);
    try {
      const doc = docRef.current;
      const res = await postJson<{ answer: string }>(
        "/api/ask",
        {
          question,
          language: showEnglish ? "en" : langRef.current,
          result: base,
          history: qa.slice(-3),
          image: doc?.base64,
          mediaType: doc?.mediaType,
        },
        45_000,
      );
      if (id !== runId.current) return;
      setQa((prev) => [...prev, { q: question, a: res.answer }]);
    } catch {
      if (id === runId.current) setAskFailed(true);
    } finally {
      if (id === runId.current) setAsking(null);
    }
  }

  async function toggleEnglish() {
    if (showEnglish) return setShowEnglish(false);
    if (results.en) return setShowEnglish(true);
    const base = results[shownLangRef.current];
    if (!base) return;
    const id = runId.current;
    setTranslating(true);
    const en = await fetchTranslation("en", base, sampleRef.current);
    if (id !== runId.current) return;
    setTranslating(false);
    if (en) {
      setResults((r) => ({ ...r, en }));
      setShowEnglish(true);
    } else {
      setNotice(t.translateFailed);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void analyze(f, null);
  }

  const shown = results[shownLang] ?? Object.values(results)[0];
  const viewEnglish = showEnglish && !!results.en;
  const view = viewEnglish ? results.en! : shown;
  const viewT = viewEnglish ? STRINGS.en : t;

  const samples = (
    [
      ["ticket", "🅿️", t.sampleTicket],
      ["letter", "✉️", t.sampleLetter],
      ["quote", "🔨", t.sampleQuote],
    ] as const
  ).map(([id, icon, label]) => (
    <button
      key={id}
      onClick={() => void loadSample(id)}
      className="min-h-[44px] rounded-full bg-white px-4 text-[15px] font-semibold ring-1 ring-line transition-colors active:bg-teal-soft"
    >
      {icon} {label}
    </button>
  ));

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[480px] px-4 pb-[env(safe-area-inset-bottom)]">
      {/* Top bar */}
      <div className="sticky top-0 z-30 -mx-4 flex items-center justify-between bg-paper/90 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2 backdrop-blur">
        <button
          onClick={reset}
          className="flex min-h-[44px] items-center gap-2 text-[17px] font-bold tracking-tight"
          aria-label={t.appName}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-white">✦</span>
          {t.appName}
          {demo && <span className="rounded bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800">DEMO</span>}
        </button>
        <label className="relative">
          <span className="sr-only">{t.language}</span>
          <select
            value={lang}
            disabled={translating}
            onChange={(e) => void switchLanguage(e.target.value as Lang)}
            className="min-h-[44px] appearance-none rounded-full bg-white py-2 pr-9 pl-4 text-[16px] font-semibold ring-1 ring-line disabled:opacity-60"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l] === LANG_FULL[l] ? LANG_FULL[l] : `${LANG_LABELS[l]} · ${LANG_FULL[l]}`}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm">🌐</span>
        </label>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <input ref={uploadRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} />

      {screen === "home" && (
        <div className="flex min-h-[calc(100dvh-80px)] flex-col justify-center pb-10">
          <h1 className="rise text-[40px] font-bold leading-[1.05] tracking-tight">{t.appName}</h1>
          <p className="rise mt-3 text-[21px] leading-snug text-stone-700" style={{ animationDelay: "50ms" }}>
            {t.tagline}
          </p>

          <button
            onClick={() => cameraRef.current?.click()}
            className="rise mt-10 flex min-h-[96px] w-full items-center justify-center gap-3 rounded-3xl bg-teal px-6 text-[22px] font-bold text-white shadow-[0_10px_30px_-8px_rgba(15,118,110,0.55)] transition-transform active:scale-[0.98]"
            style={{ animationDelay: "100ms" }}
          >
            <span className="text-3xl">📷</span> {t.scan}
          </button>
          <button
            onClick={() => uploadRef.current?.click()}
            className="rise mx-auto mt-3 min-h-[48px] px-4 text-[17px] font-semibold text-teal underline decoration-teal/30 underline-offset-4"
            style={{ animationDelay: "150ms" }}
          >
            {t.upload}
          </button>

          <div className="rise mt-10" style={{ animationDelay: "200ms" }}>
            <p className="mb-3 text-center text-[13px] font-semibold uppercase tracking-wide text-muted">{t.trySample}</p>
            <div className="flex flex-wrap justify-center gap-2">{samples}</div>
          </div>
          <p className="rise mt-10 text-center text-[14px] text-muted" style={{ animationDelay: "250ms" }}>
            🔒 {t.privacy}
          </p>
        </div>
      )}

      {screen === "loading" && (
        <div className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center pb-16">
          <div className="relative w-64 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-line">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="block max-h-[52vh] w-full object-contain opacity-90" />
            ) : (
              <div className="flex h-80 items-center justify-center text-6xl">📄</div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-teal/5" />
            <div className="scan-line" />
          </div>
          <p key={loadingMsg} className="fade-msg mt-8 text-center text-[20px] font-semibold" aria-live="polite">
            {loadingMsg}
          </p>
          <div className="mt-4 flex gap-1.5">
            {t.loading.map((_, n) => (
              <span
                key={n}
                className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${n <= msgIdx ? "bg-teal" : "bg-line"}`}
              />
            ))}
          </div>
        </div>
      )}

      {screen === "error" && errorKind === "server" && (
        <RetakeScreen
          icon="📶"
          title={t.serverErrorTitle}
          body={t.serverErrorBody}
          primary={{ label: `↻ ${t.retry}`, onClick: retryLast }}
          links={[
            { label: t.tryAgain, onClick: () => cameraRef.current?.click() },
            { label: t.backHome, onClick: reset },
          ]}
          extra={
            <div className="rise mt-6" style={{ animationDelay: "300ms" }}>
              <p className="mb-2 text-center text-[13px] font-semibold uppercase tracking-wide text-muted">
                {t.trySample}
              </p>
              <div className="flex flex-wrap justify-center gap-2">{samples}</div>
            </div>
          }
        />
      )}

      {screen === "error" && errorKind !== "server" && (
        <RetakeScreen
          icon="📷"
          title={t.errorTitle}
          body={errorKind === "pdf" ? t.pdfTooBig : t.errorBody}
          tips={t.unreadableTips}
          primary={{ label: `📷 ${t.tryAgain}`, onClick: () => cameraRef.current?.click() }}
          links={[
            { label: t.upload, onClick: () => uploadRef.current?.click() },
            { label: t.backHome, onClick: reset },
          ]}
        />
      )}

      {screen === "results" && shown && shown.document_type === "unreadable" && (
        <RetakeScreen
          icon="📷"
          title={t.unreadableTitle}
          body={shown.unreadable_reason ?? ""}
          tips={t.unreadableTips}
          primary={{ label: `📷 ${t.tryAgain}`, onClick: () => cameraRef.current?.click() }}
          links={[
            { label: t.upload, onClick: () => uploadRef.current?.click() },
            { label: t.backHome, onClick: reset },
          ]}
        />
      )}

      {screen === "results" && shown && shown.document_type !== "unreadable" && (
        <div className="pt-3">
          {translating && (
            <p className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-teal" aria-live="polite">
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-teal" /> {t.translating}
            </p>
          )}
          {notice && <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[15px] text-amber-900">{notice}</p>}
          {shownLang !== "en" && lang !== "en" && !translating && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => void toggleEnglish()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold text-ink ring-1 ring-line active:bg-stone-100"
              >
                {viewEnglish ? t.backTo(LANG_FULL[lang]) : `🇺🇸 ${t.showEnglish}`}
              </button>
            </div>
          )}
          <Results
            key={viewEnglish ? "en-view" : shownLang}
            a={view}
            english={results.en}
            t={viewT}
            locale={viewEnglish ? LOCALE.en : LOCALE[shownLang]}
            busy={translating}
            onScanAnother={reset}
            askSlot={
              <AskCard
                docType={view.document_type}
                t={viewT}
                i={8}
                qa={qa}
                asking={asking}
                failed={askFailed}
                onAsk={(q) => void ask(q)}
              />
            }
          />
        </div>
      )}
    </main>
  );
}

function RetakeScreen(props: {
  icon: string;
  title: string;
  body: string;
  tips?: string[];
  primary: { label: string; onClick: () => void };
  links: { label: string; onClick: () => void }[];
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col justify-center pb-10">
      <div className="rise text-5xl">{props.icon}</div>
      <h1 className="rise mt-4 text-[28px] font-bold leading-tight" style={{ animationDelay: "50ms" }}>
        {props.title}
      </h1>
      {props.body && (
        <p className="rise mt-2 text-[17px] text-stone-700" style={{ animationDelay: "100ms" }}>
          {props.body}
        </p>
      )}
      {props.tips && (
        <ul className="rise mt-6 space-y-2" style={{ animationDelay: "150ms" }}>
          {props.tips.map((tip, n) => (
            <li key={n} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-line">
              <span className="text-xl">{["📄", "💡", "🖼️", "✋"][n] ?? "•"}</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={props.primary.onClick}
        className="rise mt-8 min-h-[64px] w-full rounded-2xl bg-teal text-[19px] font-bold text-white transition-transform active:scale-[0.98]"
        style={{ animationDelay: "200ms" }}
      >
        {props.primary.label}
      </button>
      <div className="rise mt-2 flex flex-wrap justify-center gap-x-4" style={{ animationDelay: "250ms" }}>
        {props.links.map((l) => (
          <button
            key={l.label}
            onClick={l.onClick}
            className="min-h-[48px] px-2 font-semibold text-teal underline decoration-teal/30 underline-offset-4"
          >
            {l.label}
          </button>
        ))}
      </div>
      {props.extra}
    </div>
  );
}
