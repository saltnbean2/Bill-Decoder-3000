"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Results from "./Results";
import { AskCard } from "./Extras";
import { prepareFile } from "@/lib/compress";
import { LANG_FULL, LANG_LABELS, STRINGS } from "@/lib/i18n";
import { LANGS, type Analysis, type Lang, type SampleId } from "@/lib/types";

type Screen = "home" | "loading" | "results" | "error" | "chat";

const LOCALE: Record<Lang, string> = { en: "en-US", hy: "hy-AM", es: "es-US", ko: "ko-KR", tl: "fil-PH" };
const SAMPLE_FILES: Record<SampleId, string> = {
  ticket: "/samples/parking-ticket.png",
  letter: "/samples/jury-summons.png",
  quote: "/samples/roofing-quote.png",
  scam: "/samples/scam-letter.png",
};
const SAMPLE_TIMEOUT = 20_000;
const LIVE_TIMEOUT = 50_000;

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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
  const [lang, setLang] = useState<Lang>("en");
  const [screen, setScreen] = useState<Screen>("home");
  const [preview, setPreview] = useState<string>("");
  const [image, setImage] = useState<{ base64: string; mediaType: string } | null>(null);
  const [results, setResults] = useState<Partial<Record<Lang, Analysis>>>({});
  const [shownLang, setShownLang] = useState<Lang>("en");
  const [translating, setTranslating] = useState(false);
  const [notice, setNotice] = useState("");
  const [demo, setDemo] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const sampleRef = useRef<SampleId | null>(null);
  const runId = useRef(0);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

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

  // Rotate loading messages every 1.2s.
  useEffect(() => {
    if (screen !== "loading") return;
    setMsgIdx(0);
    const id = setInterval(() => setMsgIdx((n) => Math.min(n + 1, 3)), 1200);
    return () => clearInterval(id);
  }, [screen]);

  const reset = useCallback(() => {
    runId.current++;
    setScreen("home");
    setResults({});
    setPreview("");
    setImage(null);
    setNotice("");
    sampleRef.current = null;
    window.scrollTo({ top: 0 });
  }, []);

  async function analyze(file: Blob, sample: SampleId | null) {
    const id = ++runId.current;
    const scanLang = lang;
    sampleRef.current = sample;
    setNotice("");
    setResults({});
    setScreen("loading");
    window.scrollTo({ top: 0 });

    let result: Analysis | null = null;
    let gotLang: Lang = scanLang;
    const fromCache = async (s: SampleId) => {
      const hit = await getCachedWithFallback(s, scanLang);
      if (hit) [result, gotLang] = hit;
    };
    try {
      const prepared = await prepareFile(file);
      if (id !== runId.current) return;
      setPreview(prepared.previewUrl);
      setImage({ base64: prepared.base64, mediaType: prepared.mediaType });

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
    } catch {
      if (id === runId.current) setScreen("error");
      return;
    }
    if (id !== runId.current) return;
    // A cached fallback may be English even if another language is selected.
    setResults({ [gotLang]: result });
    setShownLang(gotLang);
    setScreen("results");
    if (gotLang !== scanLang) void switchLanguage(scanLang, { [gotLang]: result });
  }

  async function loadSample(sample: SampleId) {
    try {
      const res = await fetch(SAMPLE_FILES[sample]);
      const blob = await res.blob();
      await analyze(blob, sample);
    } catch {
      setScreen("error");
    }
  }

  async function switchLanguage(next: Lang, have: Partial<Record<Lang, Analysis>> = results) {
    setLang(next);
    try {
      localStorage.setItem("explainit.lang", next);
    } catch {
      /* ignore */
    }
    if (screen === "home" || screen === "loading" || screen === "error") {
      if (!Object.keys(have).length) {
        setShownLang(next);
        return;
      }
    }
    if (have[next]) {
      setShownLang(next);
      return;
    }
    const base = have.en ?? Object.values(have)[0];
    if (!base) return;
    const id = runId.current;
    setTranslating(true);
    setNotice("");
    let translated: Analysis | null = null;
    const sample = sampleRef.current;
    if (sample && demo) translated = await getCached(sample, next);
    if (!translated) {
      try {
        translated = (await postJson<{ result: Analysis }>("/api/translate", { result: base, language: next }, 45_000)).result;
      } catch {
        if (sample) translated = await getCached(sample, next);
      }
    }
    if (id !== runId.current) return;
    setTranslating(false);
    if (translated) {
      setResults((r) => ({ ...r, ...have, [next]: translated! }));
      setShownLang(next);
    } else {
      setNotice(STRINGS[next].translateFailed);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void analyze(f, null);
  }

  const shown = results[shownLang] ?? Object.values(results)[0];

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
            onChange={(e) => void switchLanguage(e.target.value as Lang)}
            className="min-h-[44px] appearance-none rounded-full bg-white py-2 pr-9 pl-4 text-[16px] font-semibold ring-1 ring-line"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l]} · {LANG_FULL[l]}
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

          <button
            onClick={() => {
              setScreen("chat");
              window.scrollTo({ top: 0 });
            }}
            className="rise mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-white text-[18px] font-semibold text-ink ring-1 ring-line transition-transform active:scale-[0.98]"
            style={{ animationDelay: "175ms" }}
          >
            💬 {t.agentButton}
          </button>

          <div className="rise mt-10" style={{ animationDelay: "200ms" }}>
            <p className="mb-3 text-center text-[13px] font-semibold uppercase tracking-wide text-muted">{t.trySample}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {(
                [
                  ["ticket", "🅿️", t.sampleTicket],
                  ["letter", "✉️", t.sampleLetter],
                  ["quote", "🔨", t.sampleQuote],
                  ["scam", "🚩", t.sampleScam],
                ] as const
              ).map(([id, icon, label]) => (
                <button
                  key={id}
                  onClick={() => void loadSample(id)}
                  className="min-h-[44px] rounded-full bg-white px-4 text-[15px] font-semibold ring-1 ring-line transition-colors active:bg-teal-soft"
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
          <p className="rise mt-10 text-center text-[14px] text-muted" style={{ animationDelay: "250ms" }}>
            🔒 {t.privacy}
          </p>
        </div>
      )}

      {screen === "chat" && (
        <div className="pt-3 pb-10">
          <button onClick={reset} className="mb-2 min-h-[44px] text-[16px] font-semibold text-teal">
            ← {t.back}
          </button>
          <h1 className="rise text-[28px] font-bold leading-tight tracking-tight">💬 {t.agentTitle}</h1>
          <p className="rise mt-2 mb-5 text-[17px] text-stone-700" style={{ animationDelay: "50ms" }}>
            {t.agentSub}
          </p>
          <AskCard key={lang} a={null} t={t} lang={lang} image={null} i={2} bare />
          <p className="mt-8 text-center text-[14px] text-muted">{t.disclaimer}</p>
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
          <p key={msgIdx} className="fade-msg mt-8 text-center text-[20px] font-semibold" aria-live="polite">
            {t.loading[msgIdx]}
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

      {screen === "error" && (
        <RetakeScreen
          title={t.errorTitle}
          body={t.errorBody}
          tips={t.unreadableTips}
          cta={t.tryAgain}
          onRetake={() => cameraRef.current?.click()}
          onHome={reset}
          homeLabel={t.upload}
          onUpload={() => uploadRef.current?.click()}
        />
      )}

      {screen === "results" && shown && shown.document_type === "unreadable" && (
        <RetakeScreen
          title={t.unreadableTitle}
          body={shown.unreadable_reason ?? ""}
          tips={t.unreadableTips}
          cta={t.tryAgain}
          onRetake={() => cameraRef.current?.click()}
          onHome={reset}
          homeLabel={t.upload}
          onUpload={() => uploadRef.current?.click()}
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
          <Results
            key={shownLang}
            a={shown}
            t={STRINGS[translating ? lang : shownLang]}
            locale={LOCALE[shownLang]}
            busy={translating}
            lang={shownLang}
            image={image}
            onScanAnother={() => {
              reset();
            }}
          />
        </div>
      )}
    </main>
  );
}

function RetakeScreen(props: {
  title: string;
  body: string;
  tips: string[];
  cta: string;
  onRetake: () => void;
  onHome: () => void;
  homeLabel: string;
  onUpload: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col justify-center pb-10">
      <div className="rise text-5xl">📷</div>
      <h1 className="rise mt-4 text-[28px] font-bold leading-tight" style={{ animationDelay: "50ms" }}>
        {props.title}
      </h1>
      {props.body && (
        <p className="rise mt-2 text-[17px] text-stone-700" style={{ animationDelay: "100ms" }}>
          {props.body}
        </p>
      )}
      <ul className="rise mt-6 space-y-2" style={{ animationDelay: "150ms" }}>
        {props.tips.map((tip, n) => (
          <li key={n} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-line">
            <span className="text-xl">{["📄", "💡", "🖼️", "✋"][n] ?? "•"}</span>
            {tip}
          </li>
        ))}
      </ul>
      <button
        onClick={props.onRetake}
        className="rise mt-8 min-h-[64px] w-full rounded-2xl bg-teal text-[19px] font-bold text-white active:scale-[0.98] transition-transform"
        style={{ animationDelay: "200ms" }}
      >
        📷 {props.cta}
      </button>
      <button
        onClick={props.onUpload}
        className="rise mx-auto mt-2 min-h-[48px] px-4 font-semibold text-teal underline"
        style={{ animationDelay: "250ms" }}
      >
        {props.homeLabel}
      </button>
    </div>
  );
}
