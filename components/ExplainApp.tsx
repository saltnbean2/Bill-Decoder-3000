"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Results from "./Results";
import DocumentHero from "./DocumentHero";
import { SAMPLE_MARKS } from "@/lib/marks";
import { clearShareLink, readShareLink } from "@/lib/sharelink";
import { clearRecent, loadRecent, saveRecent, type RecentItem } from "@/lib/recent";
import { refreshDeadline } from "@/lib/normalize";
import { AskCard, Directory } from "./Extras";
import { BackIcon, CameraIcon, ChatIcon, CheckIcon, ClockIcon, DocIcon, GlobeIcon, LockIcon, PinIcon, WifiOffIcon } from "./icons";
import { prepareFile, type PreparedFile } from "@/lib/compress";
import { LANG_FULL, STRINGS } from "@/lib/i18n";
import { LANGS, type Analysis, type Lang, type SampleId } from "@/lib/types";

type Screen = "home" | "loading" | "results" | "error" | "chat" | "directory" | "pages";
/** "server": network / API trouble (photo is fine). "photo": we couldn't use the file. "pdf": PDF too big. */
type ErrorKind = "server" | "photo" | "pdf";

const LOCALE: Record<Lang, string> = { en: "en-US", hy: "hy-AM", es: "es-US", ko: "ko-KR", tl: "fil-PH" };
const SAMPLE_FILES: Record<SampleId, string> = {
  ticket: "/samples/parking-ticket.png",
  letter: "/samples/jury-summons.png",
  quote: "/samples/roofing-quote.png",
  scam: "/samples/scam-letter.png",
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
  // Edited versions of the appeal letter (last one is current), kept across language switches.
  const [letters, setLetters] = useState<string[]>([]);
  // "Show in English" (e.g. to show a clerk), without changing the chosen language.
  const [showEnglish, setShowEnglish] = useState(false);
  // The compressed document, kept in memory only, so follow-up questions can look at it again.
  // Every page of the current document (for "read the whole letter").
  const [docPages, setDocPages] = useState<{ base64: string; mediaType: string }[]>([]);
  const [image, setImage] = useState<{ base64: string; mediaType: string } | null>(null);
  const sampleRef = useRef<SampleId | null>(null);
  const lastInput = useRef<{ file: Blob; sample: SampleId | null; more?: PreparedFile[] } | null>(null);
  // Multi-page scan: pages collected before sending (already compressed).
  const [pages, setPages] = useState<PreparedFile[]>([]);
  const collectingPages = useRef(false);
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

  // Recent results, stored only on this phone.
  const [recent, setRecent] = useState<RecentItem[]>([]);
  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  function openRecent(r: RecentItem) {
    runId.current++;
    sampleRef.current = null;
    setImage(null);
    setDocPages([]);
    setLetters([]);
    setResults({ [r.lang]: refreshDeadline(r.analysis) });
    setShownLang(r.lang);
    setScreen("results");
    window.scrollTo({ top: 0 });
  }

  // Bigger text for older eyes: zooms the whole page, remembered on this phone.
  const [bigText, setBigText] = useState(false);
  useEffect(() => {
    try {
      setBigText(localStorage.getItem("explainit.big") === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);
  useEffect(() => {
    document.documentElement.style.zoom = bigText ? "1.18" : "";
    try {
      localStorage.setItem("explainit.big", bigText ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [bigText]);

  // Opened from a family share link: show that explanation right away (data is in the #fragment).
  const [shared, setShared] = useState(false);
  useEffect(() => {
    void readShareLink().then((s) => {
      if (!s) return;
      setResults({ [s.lang]: s.analysis });
      setShownLang(s.lang);
      setLang(s.lang);
      setShared(true);
      setScreen("results");
    });
  }, []);

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
    clearShareLink();
    setShared(false);
    collectingPages.current = false;
    runId.current++;
    pending.current = {};
    setScreen("home");
    setResults({});
    setPreview("");
    setNotice("");
    setTranslating(false);
    setLetters([]);
    setShowEnglish(false);
    setImage(null);
    setDocPages([]);
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

  async function analyze(file: Blob, sample: SampleId | null, more: PreparedFile[] = []) {
    const id = ++runId.current;
    const scanLang = langRef.current;
    sampleRef.current = sample;
    lastInput.current = { file, sample, more };
    pending.current = {};
    setImage(null);
    setDocPages([]);
    setNotice("");
    setTranslating(false);
    setLetters([]);
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
    setImage({ base64: prepared.base64, mediaType: prepared.mediaType });
    setDocPages([
      { base64: prepared.base64, mediaType: prepared.mediaType },
      ...more.map((m) => ({ base64: m.base64, mediaType: m.mediaType })),
    ]);
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
            {
              image: prepared.base64,
              mediaType: prepared.mediaType,
              language: scanLang,
              ...(more.length ? { pages: more.map((p) => ({ image: p.base64, mediaType: p.mediaType })) } : {}),
            },
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
    setRecent(saveRecent(result, gotLang));

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
    if (last) void analyze(last.file, last.sample, last.more);
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
    if (!f) return;
    if (collectingPages.current) void addPage(f);
    else void analyze(f, null);
  }

  async function addPage(f: Blob) {
    try {
      const p = await prepareFile(f);
      if (p.mediaType === "application/pdf") return; // multi-page mode is for photos
      setPages((list) => (list.length >= 5 ? list : [...list, p]));
    } catch {
      /* unreadable photo: ignore it, the person can retake */
    }
  }

  function explainPages() {
    if (!pages.length) return;
    collectingPages.current = false;
    const [first, ...rest] = pages;
    // The first page is re-sent as a Blob so retry and the thumbnail work as for a single photo.
    const bytes = Uint8Array.from(atob(first.base64), (c) => c.charCodeAt(0));
    void analyze(new Blob([bytes], { type: first.mediaType }), null, rest);
    setPages([]);
  }

  const shown = results[shownLang] ?? Object.values(results)[0];
  const viewEnglish = showEnglish && !!results.en;
  const view = viewEnglish ? results.en! : shown;
  const viewT = viewEnglish ? STRINGS.en : t;

  const samples = (
    [
      ["ticket", t.sampleTicket],
      ["letter", t.sampleLetter],
      ["quote", t.sampleQuote],
      ["scam", t.sampleScam],
    ] as const
  ).map(([id, label]) => (
    <button
      key={id}
      onClick={() => void loadSample(id)}
      className="min-h-[44px] rounded-full bg-white px-4 text-[15px] font-semibold ring-1 ring-line transition-colors active:bg-teal-soft"
    >
      {label}
    </button>
  ));

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[480px] px-4 pb-[env(safe-area-inset-bottom)]">
      {/* Top bar */}
      <div className="sticky top-0 z-30 -mx-4 flex items-center justify-between bg-paper/90 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2 backdrop-blur">
        <button
          onClick={reset}
          className="flex min-h-[44px] items-center gap-2 whitespace-nowrap text-[17px] font-bold tracking-tight"
          aria-label={t.appName}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-white">✦</span>
          {!bigText && t.appName}
          {demo && !bigText && <span className="rounded bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800">DEMO</span>}
        </button>
        <div className="flex items-center gap-2">
        <button
          onClick={() => setBigText((b) => !b)}
          aria-pressed={bigText}
          aria-label={t.bigText}
          title={t.bigText}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-[17px] font-bold ring-1 ${
            bigText ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-line"
          }`}
        >
          A<span className="text-[22px]">A</span>
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
                {LANG_FULL[l]}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"><GlobeIcon size={16} /></span>
        </label>
        </div>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <input ref={uploadRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} />

      {screen === "home" && (
        <div className="flex min-h-[calc(100dvh-80px)] flex-col pb-10">
          {/* Live preview of what the app does: a ticket gets scanned and its mistakes circled */}
          <div className="rise mt-3">
            <DocumentHero compact photo="/samples/thumb-parking-ticket.jpg" marks={SAMPLE_MARKS.ticket} alt="" />
          </div>

          <h1 className="rise font-display mt-7 text-[38px] leading-[1.05] text-ink" style={{ animationDelay: "50ms" }}>
            {t.tagline}
          </h1>

          <div className="rise mt-5 flex flex-wrap gap-2" style={{ animationDelay: "100ms" }}>
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => void switchLanguage(l)}
                aria-pressed={lang === l}
                className={`min-h-[44px] rounded-full px-4 text-[15px] font-semibold transition-colors ${
                  lang === l ? "bg-ink text-white" : "bg-white/70 text-ink ring-1 ring-black/10 active:bg-white"
                }`}
              >
                {LANG_FULL[l]}
              </button>
            ))}
          </div>

          <button
            onClick={() => cameraRef.current?.click()}
            className="rise mt-7 flex min-h-[64px] w-full items-center justify-center gap-3 rounded-full bg-ink px-6 text-[18px] font-semibold text-white shadow-[0_12px_30px_rgba(20,20,20,0.25)] transition-transform active:scale-[0.98]"
            style={{ animationDelay: "150ms" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 8.5A2.5 2.5 0 016.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0120 8.5v9a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 17.5z" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            {t.scan}
          </button>
          <button
            onClick={() => uploadRef.current?.click()}
            className="rise mt-2 min-h-[52px] w-full rounded-full bg-white/80 text-[16px] font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:bg-white"
            style={{ animationDelay: "180ms" }}
          >
            {t.upload}
          </button>
          <button
            onClick={() => {
              collectingPages.current = true;
              setPages([]);
              setScreen("pages");
              window.scrollTo({ top: 0 });
            }}
            className="rise mx-auto mt-1 inline-flex min-h-[44px] items-center gap-2 px-4 text-[16px] font-medium text-muted"
            style={{ animationDelay: "160ms" }}
          >
            <DocIcon size={17} /> {t.multiPage}
          </button>

          <button
            onClick={() => {
              setScreen("chat");
              window.scrollTo({ top: 0 });
            }}
            className="rise mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white/80 text-[16px] font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-transform active:scale-[0.98]"
            style={{ animationDelay: "175ms" }}
          >
            <ChatIcon /> {t.agentButton}
          </button>
          <button
            onClick={() => {
              setScreen("directory");
              window.scrollTo({ top: 0 });
            }}
            className="rise mt-2 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white/80 text-[16px] font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-transform active:scale-[0.98]"
            style={{ animationDelay: "190ms" }}
          >
            <PinIcon /> {t.directoryButton}
          </button>

          <div className="rise mt-10" style={{ animationDelay: "200ms" }}>
            <p className="mb-3 text-center text-[13px] font-semibold text-muted">{t.trySample}</p>
            <div className="flex flex-wrap justify-center gap-2">{samples}</div>
          </div>
          {recent.length > 0 && (
            <div className="rise mt-10" style={{ animationDelay: "230ms" }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted"><ClockIcon size={15} /> {t.recentTitle}</p>
                <button
                  onClick={() => {
                    clearRecent();
                    setRecent([]);
                  }}
                  className="min-h-[44px] px-2 text-[14px] font-semibold text-muted underline"
                >
                  {t.clearRecent}
                </button>
              </div>
              <ul className="space-y-2">
                {recent.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => openRecent(r)}
                      className="flex min-h-[56px] w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left ring-1 ring-line active:bg-teal-soft"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-soft text-muted"><DocIcon size={17} /></span>
                      <span className="line-clamp-2 flex-1 text-[15px] leading-snug">{r.analysis.headline}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[13px] text-muted">{t.recentNote}</p>
            </div>
          )}
          <p className="rise mt-10 flex items-start justify-center gap-2 text-center text-[14px] text-muted" style={{ animationDelay: "250ms" }}>
            <LockIcon size={15} className="mt-[3px] shrink-0" /> {t.privacy}
          </p>
        </div>
      )}

      {screen === "directory" && (
        <div className="pt-3 pb-10">
          <button onClick={reset} className="mb-2 -ml-1 inline-flex min-h-[44px] items-center gap-1 text-[16px] font-semibold text-ink">
            <BackIcon /> {t.back}
          </button>
          <h1 className="rise font-display text-[32px] leading-tight">{t.directoryTitle}</h1>
          <p className="rise mt-2 mb-5 text-[17px] text-[#3F4450]" style={{ animationDelay: "50ms" }}>
            {t.directorySub}
          </p>
          <Directory t={t} lang={lang} />
          <p className="mt-8 text-center text-[14px] text-muted">{t.disclaimer}</p>
        </div>
      )}

      {screen === "pages" && (
        <div className="pt-3 pb-10">
          <button
            onClick={() => {
              collectingPages.current = false;
              reset();
            }}
            className="mb-2 -ml-1 inline-flex min-h-[44px] items-center gap-1 text-[16px] font-semibold text-ink"
          >
            <BackIcon /> {t.back}
          </button>
          <h1 className="rise font-display text-[32px] leading-tight">{t.pagesTitle}</h1>
          <p className="rise mt-2 mb-5 text-[17px] text-[#3F4450]" style={{ animationDelay: "50ms" }}>
            {t.pagesSub}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {pages.map((p, n) => (
              <div key={n} className="fade-msg relative overflow-hidden rounded-xl bg-white ring-1 ring-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={t.pageN(n + 1)} className="block aspect-[3/4] w-full object-cover" />
                <span className="absolute top-1.5 left-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[13px] font-semibold text-white">
                  {n + 1}
                </span>
                <button
                  onClick={() => setPages((list) => list.filter((_, k) => k !== n))}
                  aria-label={`${t.removePage} ${t.pageN(n + 1)}`}
                  className="absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[16px] text-ink shadow"
                >
                  ✕
                </button>
              </div>
            ))}
            {pages.length < 5 && (
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#C9CDD4] bg-white text-[15px] font-semibold text-ink active:bg-teal-soft"
              >
                <CameraIcon size={28} />
                {t.addPage}
              </button>
            )}
          </div>
          <button
            onClick={() => uploadRef.current?.click()}
            className="mt-3 min-h-[44px] text-[16px] font-semibold text-ink underline decoration-line underline-offset-4"
          >
            {t.upload}
          </button>
          <button
            onClick={explainPages}
            disabled={!pages.length}
            className="mt-6 min-h-[64px] w-full rounded-full bg-ink text-[18px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
          >
            {t.explainPages(Math.max(pages.length, 1))}
          </button>
        </div>
      )}

      {screen === "chat" && (
        <div className="pt-3 pb-10">
          <button onClick={reset} className="mb-2 -ml-1 inline-flex min-h-[44px] items-center gap-1 text-[16px] font-semibold text-ink">
            <BackIcon /> {t.back}
          </button>
          <h1 className="rise font-display text-[32px] leading-tight">{t.agentTitle}</h1>
          <p className="rise mt-2 mb-5 text-[17px] text-[#3F4450]" style={{ animationDelay: "50ms" }}>
            {t.agentSub}
          </p>
          <AskCard key={lang} a={null} t={t} lang={lang} image={null} i={2} bare />
          <p className="mt-8 text-center text-[14px] text-muted">{t.disclaimer}</p>
        </div>
      )}

      {screen === "loading" && (
        <div className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center pb-16">
          <div className="relative w-64 overflow-hidden rounded-[14px] bg-white" style={{ boxShadow: "0 0 0 1px rgba(15,17,21,.06), 0 24px 60px rgba(15,17,21,.18)" }}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="block max-h-[52vh] w-full object-contain opacity-90" />
            ) : (
              <div className="flex h-80 items-center justify-center text-[#C9CDD4]"><DocIcon size={64} /></div>
            )}
                        <div className="scan-line" />
          </div>
          <p key={loadingMsg} className="fade-msg mt-8 text-center text-[20px] font-semibold" aria-live="polite">
            {loadingMsg}
          </p>
          <div className="mt-4 flex gap-1.5">
            {t.loading.map((_, n) => (
              <span
                key={n}
                className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${n <= msgIdx ? "bg-mark" : "bg-line"}`}
              />
            ))}
          </div>
        </div>
      )}

      {screen === "error" && errorKind === "server" && (
        <RetakeScreen
          icon={<WifiOffIcon size={30} />}
          title={t.serverErrorTitle}
          body={t.serverErrorBody}
          primary={{ label: t.retry, onClick: retryLast }}
          links={[
            { label: t.tryAgain, onClick: () => cameraRef.current?.click() },
            { label: t.backHome, onClick: reset },
          ]}
          extra={
            <div className="rise mt-6" style={{ animationDelay: "300ms" }}>
              <p className="mb-2 text-center text-[13px] font-semibold text-muted">
                {t.trySample}
              </p>
              <div className="flex flex-wrap justify-center gap-2">{samples}</div>
            </div>
          }
        />
      )}

      {screen === "error" && errorKind !== "server" && (
        <RetakeScreen
          icon={<CameraIcon size={30} />}
          title={t.errorTitle}
          body={errorKind === "pdf" ? t.pdfTooBig : t.errorBody}
          tips={t.unreadableTips}
          primary={{ label: t.tryAgain, onClick: () => cameraRef.current?.click() }}
          links={[
            { label: t.upload, onClick: () => uploadRef.current?.click() },
            { label: t.backHome, onClick: reset },
          ]}
        />
      )}

      {screen === "results" && shown && shown.document_type === "unreadable" && (
        <RetakeScreen
          icon={<CameraIcon size={30} />}
          title={t.unreadableTitle}
          body={shown.unreadable_reason ?? ""}
          tips={t.unreadableTips}
          primary={{ label: t.tryAgain, onClick: () => cameraRef.current?.click() }}
          links={[
            { label: t.upload, onClick: () => uploadRef.current?.click() },
            { label: t.backHome, onClick: reset },
          ]}
        />
      )}

      {screen === "results" && shown && shown.document_type !== "unreadable" && (
        <div className="pt-3">
          {translating && (
            <p className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink" aria-live="polite">
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-mark" /> {t.translating}
            </p>
          )}
          {notice && <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[15px] text-amber-900">{notice}</p>}
          {shared && <p className="mb-3 rounded-xl bg-teal-soft px-4 py-3 text-[15px] leading-snug text-ink">{t.sharedBanner}</p>}
          {shownLang !== "en" && lang !== "en" && !translating && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => void toggleEnglish()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold text-ink ring-1 ring-line active:bg-[#F1F2F5]"
              >
                {viewEnglish ? t.backTo(LANG_FULL[lang]) : t.showEnglish}
              </button>
            </div>
          )}
          <Results
            key={viewEnglish ? "en-view" : shownLang}
            a={view}
            t={viewT}
            locale={viewEnglish ? LOCALE.en : LOCALE[shownLang]}
            busy={translating}
            lang={viewEnglish ? "en" : shownLang}
            image={image}
            docPages={docPages}
            letters={letters}
            onLetters={setLetters}
            photo={preview || undefined}
            marks={sampleRef.current ? SAMPLE_MARKS[sampleRef.current] : undefined}
            onScanAnother={reset}
          />
        </div>
      )}
    </main>
  );
}

function RetakeScreen(props: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tips?: string[];
  primary: { label: string; onClick: () => void };
  links: { label: string; onClick: () => void }[];
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col justify-center pb-10">
      <div className="rise flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink shadow-[0_1px_2px_rgba(15,17,21,0.06)]">{props.icon}</div>
      <h1 className="rise font-display mt-5 text-[32px] leading-tight" style={{ animationDelay: "50ms" }}>
        {props.title}
      </h1>
      {props.body && (
        <p className="rise mt-2 text-[17px] text-[#3F4450]" style={{ animationDelay: "100ms" }}>
          {props.body}
        </p>
      )}
      {props.tips && (
        <ul className="rise mt-6 space-y-2" style={{ animationDelay: "150ms" }}>
          {props.tips.map((tip, n) => (
            <li key={n} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5">
              <CheckIcon size={18} className="shrink-0 text-muted" />
              {tip}
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={props.primary.onClick}
        className="rise mt-8 min-h-[64px] w-full rounded-full bg-ink text-[18px] font-semibold text-white transition-transform active:scale-[0.98]"
        style={{ animationDelay: "200ms" }}
      >
        {props.primary.label}
      </button>
      <div className="rise mt-2 flex flex-wrap justify-center gap-x-4" style={{ animationDelay: "250ms" }}>
        {props.links.map((l) => (
          <button
            key={l.label}
            onClick={l.onClick}
            className="min-h-[48px] px-2 font-semibold text-ink underline decoration-line underline-offset-4"
          >
            {l.label}
          </button>
        ))}
      </div>
      {props.extra}
    </div>
  );
}
