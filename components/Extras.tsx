"use client";
import { CalendarIcon, ChatIcon, GlobeIcon, MicIcon, PhoneIcon, ShareIcon, SpeakerIcon, StopIcon } from "./icons";

import { useEffect, useRef, useState } from "react";
import type { Analysis, Lang } from "@/lib/types";
import type { Strings } from "@/lib/i18n";
import { googleUrl, outlookUrl, type CalEvent } from "@/lib/calendar";
import { checkOfficialNumbers, formatPhone, helpFor, type HelpResource } from "@/lib/resources";
import { DIRECTORY } from "@/lib/directory";
import { buildShareLink } from "@/lib/sharelink";
import { Linkify } from "./linkify";

const cardCls =
  "rise rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-12px_rgba(0,0,0,0.12)] ring-1 ring-line";
const pill =
  "flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 text-[16px] font-semibold ring-1 transition-colors";

/* ---------- Calendar + Share action row ---------- */

function eventFor(a: Analysis, t: Strings): CalEvent | null {
  const d = a.deadline;
  if (!d?.date || (d.days_remaining !== null && d.days_remaining < 0)) return null;
  const steps = a.action_steps.map((s, i) => `${i + 1}. ${s.title}${s.contact ? ` (${s.contact})` : ""}`).join("\n");
  return {
    title: `${t.eventPrefix}: ${t.docType[a.document_type].replace(/^\S+\s/, "")}${
      a.amount_due && a.amount_due.length <= 12 ? ` (${a.amount_due})` : ""
    }`,
    date: d.date,
    details: `${a.headline}\n${d.what_is_due ? `\n${d.what_is_due}\n` : ""}\n${t.stepsWord}:\n${steps}\n\n— ${t.shareFooter}`,
  };
}

function shareTextFor(a: Analysis, t: Strings, dateLabel: string | null) {
  const lines = [a.headline];
  if (a.deadline?.what_is_due) lines.push(`⏰ ${t.dueWord}${dateLabel ? ` ${dateLabel}` : ""}: ${a.deadline.what_is_due}`);
  if (a.amount_due) lines.push(`💵 ${a.amount_due}`);
  lines.push("", `${t.stepsWord}:`);
  a.action_steps.slice(0, 5).forEach((s, i) => lines.push(`${i + 1}. ${s.title}${s.contact ? ` — ${s.contact}` : ""}`));
  lines.push("", `— ${t.shareFooter}`);
  return lines.join("\n");
}

async function addToAppleCalendar(e: CalEvent) {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) {
    // A real form POST lets iOS Safari show its native "Add to Calendar" sheet.
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/ics";
    for (const [k, v] of Object.entries(e)) {
      if (v === undefined) continue;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = v;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    form.remove();
    return;
  }
  const body = new FormData();
  for (const [k, v] of Object.entries(e)) if (v !== undefined) body.append(k, v);
  const res = await fetch("/api/ics", { method: "POST", body });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "deadline.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function ActionRow({
  a,
  t,
  dateLabel,
  i,
  noCalendar = false,
  lang,
}: {
  a: Analysis;
  t: Strings;
  dateLabel: string | null;
  i: number;
  noCalendar?: boolean;
  lang: Lang;
}) {
  const [open, setOpen] = useState<"cal" | "share" | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const event = noCalendar ? null : eventFor(a, t);

  // A link that opens the full explanation on the family member's phone (the data rides in the #fragment).
  useEffect(() => {
    let live = true;
    void buildShareLink(a, lang).then((l) => live && setLink(l));
    return () => {
      live = false;
    };
  }, [a, lang]);
  const text = shareTextFor(a, t, dateLabel) + (link ? `\n${link}` : "");

  async function onShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
      }
    }
    setOpen((o) => (o === "share" ? null : "share"));
  }

  return (
    <section className="rise space-y-2" style={{ animationDelay: `${i * 50}ms` }}>
      <div className={`grid gap-2 ${event ? "grid-cols-2" : "grid-cols-1"}`}>
        {event && (
          <button
            onClick={() => setOpen((o) => (o === "cal" ? null : "cal"))}
            aria-expanded={open === "cal"}
            className={`${pill} bg-white text-ink ring-line active:bg-teal-soft ${open === "cal" ? "ring-2 ring-teal" : ""}`}
          >
            <CalendarIcon /> {t.remindTitle}
          </button>
        )}
        <button
          onClick={onShare}
          aria-expanded={open === "share"}
          className={`${pill} bg-white text-ink ring-line active:bg-teal-soft ${open === "share" ? "ring-2 ring-teal" : ""}`}
        >
          <ShareIcon /> {t.share}
        </button>
      </div>

      {open === "cal" && event && (
        <div className="fade-msg rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-12px_rgba(0,0,0,0.12)] ring-1 ring-line">
          <p className="mb-3 text-[15px] text-muted">{t.remindSub}</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => void addToAppleCalendar(event)} className={`${pill} bg-ink text-white ring-ink text-[15px]`}>
              {t.apple}
            </button>
            <a href={googleUrl(event)} target="_blank" rel="noreferrer" className={`${pill} bg-white text-ink ring-line text-[15px]`}>
              {t.google}
            </a>
            <a href={outlookUrl(event)} target="_blank" rel="noreferrer" className={`${pill} bg-white text-ink ring-line text-[15px]`}>
              {t.outlook}
            </a>
          </div>
        </div>
      )}

      {open === "share" && (
        <div className="fade-msg rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-12px_rgba(0,0,0,0.12)] ring-1 ring-line">
          <p className="mb-3 text-[15px] text-muted">
            {t.shareSub} {link && t.linkIncluded}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a href={`sms:?&body=${encodeURIComponent(text)}`} className={`${pill} bg-white text-ink ring-line`}>
              <ChatIcon /> {t.shareText}
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noreferrer"
              className={`${pill} bg-[#25D366] text-white ring-[#25D366]`}
            >
              {t.whatsapp}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- Official number check ---------- */

export function NumberCheckBanner({ a, t, i }: { a: Analysis; t: Strings; i: number }) {
  const check = checkOfficialNumbers(a);
  if (!check) return null;
  const official = check.agency.phones.map(formatPhone)[0];
  if (check.status === "match") {
    return (
      <section className="rise rounded-[24px] bg-[#EEF6F0] p-5" style={{ animationDelay: `${i * 50}ms` }}>
        <p className="font-semibold text-green-800">{t.numberMatchTitle(check.agency.name)}</p>
      </section>
    );
  }
  return (
    <section className="rise rounded-[24px] bg-[#C4291F] p-6 text-white" style={{ animationDelay: `${i * 50}ms` }}>
      <p className="text-[20px] font-bold leading-tight">{t.numberMismatchTitle(check.agency.name)}</p>
      <p className="mt-2 text-[16px] leading-snug opacity-95">
        {t.numberMismatchBody(check.bad.join(", "), `${check.agency.name} ${t.officialNumber} ${official}`)}
      </p>
      <a
        href={`tel:+1${check.agency.phones[0]}`}
        className="mt-3 flex min-h-[48px] items-center justify-center rounded-xl bg-white text-[17px] font-bold text-red-700"
      >
        <PhoneIcon /> {t.call} {check.agency.name}: {official}
      </a>
    </section>
  );
}

/* ---------- Free help in Glendale ---------- */

export function HelpCard({ a, t, lang, i }: { a: Analysis; t: Strings; lang: Lang; i: number }) {
  const list = helpFor(a);
  if (!list.length) return null;
  return (
    <section className={cardCls} style={{ animationDelay: `${i * 50}ms` }}>
      <h2 className="text-[19px] font-semibold leading-snug tracking-tight text-ink">{t.helpTitle}</h2>
      <p className="mb-3 text-[15px] text-muted">{t.helpSub}</p>
      <ul className="space-y-2">
        {list.map((r) => (
          <HelpItem key={r.name} r={r} t={t} lang={lang} />
        ))}
      </ul>
    </section>
  );
}

function HelpItem({ r, t, lang }: { r: HelpResource; t: Strings; lang: Lang }) {
  return (
          <li className="rounded-xl bg-paper p-3">
            <p className="font-semibold leading-snug">{r.name}</p>
            <p className="mt-0.5 text-[15px] leading-snug text-stone-700">{r.desc[lang]}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {r.phone && (
                <a
                  href={r.phone === "211" ? "tel:211" : `tel:+1${r.phone.replace(/\D/g, "")}`}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-teal px-4 text-[15px] font-semibold text-white"
                >
                  <PhoneIcon size={16} /> {r.phone === "211" ? "2-1-1" : r.phone}
                </a>
              )}
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold text-ink ring-1 ring-line"
                >
                  <GlobeIcon size={16} /> {t.website}
                </a>
              )}
            </div>
          </li>
  );
}

/** Full Glendale help directory (home screen). */
export function Directory({ t, lang }: { t: Strings; lang: Lang }) {
  return (
    <div className="space-y-4">
      {DIRECTORY.map((sec, n) => (
        <section key={sec.icon} className={cardCls} style={{ animationDelay: `${(n + 2) * 50}ms` }}>
          <h2 className="mb-3 text-[19px] font-semibold tracking-tight text-ink">
            {sec.title[lang]}
          </h2>
          <ul className="space-y-2">
            {sec.items.map((r) => (
              <HelpItem key={r.name} r={r} t={t} lang={lang} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ---------- Ask a follow-up ---------- */

const SPEECH_LOCALE: Record<Lang, string> = { en: "en-US", hy: "hy-AM", es: "es-US", ko: "ko-KR", tl: "fil-PH" };

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function speechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function AskCard({
  a,
  t,
  lang,
  image,
  i,
  bare = false,
}: {
  a: Analysis | null;
  t: Strings;
  lang: Lang;
  image: { base64: string; mediaType: string } | null;
  i: number;
  bare?: boolean;
}) {
  const [qa, setQa] = useState<{ q: string; a: string | null; err?: boolean }[]>([]);
  const [input, setInput] = useState("");
  const busy = qa.some((x) => x.a === null && !x.err);

  // Voice input: speak the question instead of typing it (only where the browser supports it).
  // This card only renders after a user action (never on the server), so reading window here is safe.
  const [canListen] = useState(() => !!speechRecognitionCtor());
  const [listening, setListening] = useState(false);
  const recog = useRef<SpeechRecognitionLike | null>(null);
  useEffect(() => () => recog.current?.abort(), []);
  function listen() {
    if (listening) {
      recog.current?.stop();
      return;
    }
    const Ctor = speechRecognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = SPEECH_LOCALE[lang];
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      const text = Array.from(e.results)
        .map((res) => res[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setInput(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recog.current = r;
    setListening(true);
    r.start();
  }

  async function ask(q: string) {
    q = q.trim();
    if (!q || busy) return;
    setInput("");
    const history = qa.filter((x) => x.a).map((x) => ({ q: x.q, a: x.a }));
    setQa((list) => [...list, { q, a: null }]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ result: a, question: q, language: lang, image: image?.base64, mediaType: image?.mediaType, history }),
      });
      if (!res.ok) throw new Error();
      const { answer } = (await res.json()) as { answer: string };
      setQa((list) => list.map((x, n) => (n === list.length - 1 ? { ...x, a: answer } : x)));
    } catch {
      setQa((list) => list.map((x, n) => (n === list.length - 1 ? { ...x, err: true } : x)));
    }
  }

  return (
    <section className={bare ? "rise" : cardCls} style={{ animationDelay: `${i * 50}ms` }}>
      {!bare && <h2 className="mb-3 text-[19px] font-semibold leading-snug tracking-tight text-ink">{t.askTitle}</h2>}
      {qa.length > 0 && (
        <div className="mb-3 space-y-3">
          {qa.map((x, n) => (
            <div key={n} className="space-y-2">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-teal px-4 py-2.5 text-[16px] text-white">{x.q}</p>
              {x.err ? (
                <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-red-50 px-4 py-2.5 text-[16px] text-red-800">{t.askError}</p>
              ) : x.a === null ? (
                <p className="w-fit rounded-2xl rounded-bl-md bg-paper px-4 py-2.5 text-[16px] text-muted">
                  <span className="inline-block h-2 w-2 animate-ping rounded-full bg-teal" /> {t.askThinking}
                </p>
              ) : (
                <p className="w-fit max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-paper px-4 py-2.5 text-[16px] leading-relaxed">
                  <Linkify text={x.a} />
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {qa.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {(a ? t.askSuggestions : t.agentSuggestions).map((s) => (
            <button
              key={s}
              onClick={() => void ask(s)}
              className="min-h-[44px] rounded-full bg-teal-soft px-4 text-left text-[15px] font-medium text-ink active:bg-line"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? t.listening : t.askPlaceholder}
          enterKeyHint="send"
          className="min-h-[48px] min-w-0 flex-1 rounded-xl bg-paper px-4 text-[16px] ring-1 ring-line outline-none focus:ring-2 focus:ring-teal"
        />
        {canListen && (
          <button
            type="button"
            onClick={listen}
            aria-label={t.speak}
            aria-pressed={listening}
            className={`flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl text-[20px] ring-1 ${
              listening ? "animate-pulse bg-red-50 ring-red-300" : "bg-white ring-line active:bg-teal-soft"
            }`}
          >
            <MicIcon size={20} />
          </button>
        )}
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="min-h-[48px] rounded-full bg-ink px-5 text-[16px] font-semibold text-white disabled:opacity-40"
        >
          {t.askSend}
        </button>
      </form>
    </section>
  );
}

/* ---------- Read aloud ---------- */

const VOICE_PREFIX: Record<Lang, string[]> = { en: ["en"], hy: ["hy"], es: ["es"], ko: ["ko"], tl: ["fil", "tl"] };

/** Start (and immediately stop) a muted play inside the tap, so iPhone allows playback after the fetch. */
function unlockAudio(el: HTMLAudioElement) {
  el.muted = true;
  void el.play().catch(() => {});
  el.pause();
  el.muted = false;
}

function playUrl(el: HTMLAudioElement, url: string, onEnd: () => void) {
  el.src = url;
  el.onended = onEnd;
  return el.play();
}

// Ask the server once whether natural cloud voices are set up.
let cloudVoices: Promise<boolean> | null = null;
function cloudEnabled() {
  cloudVoices ??= fetch("/api/tts")
    .then((r) => r.json())
    .then((j: { enabled?: boolean }) => !!j.enabled)
    .catch(() => false);
  return cloudVoices;
}

export function ReadAloud({ a, t, lang, dateLabel }: { a: Analysis; t: Strings; lang: Lang; dateLabel: string | null }) {
  const [deviceVoice, setDeviceVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [cloud, setCloud] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let live = true;
    void cloudEnabled().then((ok) => live && setCloud(ok));
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const pick = () => {
        const v = window.speechSynthesis.getVoices().find((x) => VOICE_PREFIX[lang].some((p) => x.lang.toLowerCase().startsWith(p)));
        if (live) setDeviceVoice(v ?? null);
      };
      pick();
      window.speechSynthesis.addEventListener("voiceschanged", pick);
      return () => {
        live = false;
        window.speechSynthesis.removeEventListener("voiceschanged", pick);
        window.speechSynthesis.cancel();
        audio.current?.pause();
      };
    }
    return () => {
      live = false;
      audio.current?.pause();
    };
  }, [lang]);

  if (!cloud && !deviceVoice) return null;

  const script = [
    a.headline,
    a.deadline?.what_is_due ? `${t.dueWord}${dateLabel ? `, ${dateLabel}` : ""}. ${a.deadline.what_is_due}` : "",
    a.summary,
    a.action_steps.length ? `${t.stepsWord}.` : "",
    ...a.action_steps.map((st, n) => `${n + 1}. ${st.title}. ${st.detail}`),
  ]
    .filter(Boolean)
    .join("\n");

  function stop() {
    audio.current?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setState("idle");
  }

  function speakOnDevice() {
    if (!deviceVoice) return setState("idle");
    // Short chunks, queued: some browsers silently stop a single long utterance after ~15 seconds.
    const chunks = script
      .split(/\n+|(?<=[.!?։。])\s+/)
      .map((c) => c.trim())
      .filter(Boolean);
    window.speechSynthesis.cancel();
    chunks.forEach((c, n) => {
      const u = new SpeechSynthesisUtterance(c);
      u.voice = deviceVoice;
      u.lang = deviceVoice.lang;
      u.rate = 0.92;
      if (n === chunks.length - 1) u.onend = () => setState("idle");
      u.onerror = () => setState("idle");
      window.speechSynthesis.speak(u);
    });
    setState("playing");
  }

  async function play() {
    if (state !== "idle") return stop();
    if (!cloud) return speakOnDevice();
    // Create and "unlock" the audio element inside the tap, so iPhone allows playback later.
    const el = audio.current ?? new Audio();
    audio.current = el;
    unlockAudio(el);
    setState("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: script, lang }),
      });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      await playUrl(el, url, () => {
        setState("idle");
        URL.revokeObjectURL(url);
      });
      setState("playing");
    } catch {
      speakOnDevice(); // fall back to the phone's voice
    }
  }

  return (
    <button
      onClick={() => void play()}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-teal ring-1 ring-teal/30 active:bg-teal-soft"
    >
      {state === "loading" ? (
        <>
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-teal" /> {t.readAloud}
        </>
      ) : state === "playing" ? (
        <><StopIcon size={16} /> {t.stopReading}</>
      ) : (
        <><SpeakerIcon size={16} /> {t.readAloud}</>
      )}
    </button>
  );
}

/* ---------- The whole letter, translated ---------- */

export function FullTextCard({
  t,
  lang,
  pages,
  i,
}: {
  t: Strings;
  lang: Lang;
  pages: { base64: string; mediaType: string }[];
  i: number;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [sections, setSections] = useState<{ original: string; translated: string }[]>([]);
  if (!pages.length) return null;

  async function load() {
    setState("loading");
    try {
      const res = await fetch("/api/fulltext", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: lang, pages: pages.map((p) => ({ image: p.base64, mediaType: p.mediaType })) }),
      });
      if (!res.ok) throw new Error();
      const j = (await res.json()) as { sections: { original: string; translated: string }[] };
      setSections(j.sections);
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "idle" || state === "error") {
    return (
      <section className="rise space-y-2" style={{ animationDelay: `${i * 50}ms` }}>
        <button
          onClick={() => void load()}
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-white px-4 text-[16px] font-semibold text-ink ring-1 ring-line active:bg-teal-soft"
        >
          {t.fullTextButton.replace(/^\S+\s/, "")}
        </button>
        {state === "error" && <p className="text-center text-[15px] text-red-700">{t.fullTextError}</p>}
      </section>
    );
  }

  return (
    <section className={cardCls} style={{ animationDelay: `${i * 50}ms` }}>
      <h2 className="text-[19px] font-semibold leading-snug tracking-tight text-ink">{t.fullTextTitle}</h2>
      <p className="mb-3 text-[15px] text-muted">{t.fullTextSub}</p>
      {state === "loading" ? (
        <p className="flex min-h-[48px] items-center gap-2 text-[16px] font-medium text-teal" aria-live="polite">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-teal" /> {t.fullTextLoading}
        </p>
      ) : (
        <ol className="scroll-contain max-h-[70vh] space-y-3 overflow-y-auto">
          {sections.map((s, n) => (
            <li key={n} className="rounded-xl bg-paper p-3">
              <p className="text-[17px] leading-snug">
                <Linkify text={s.translated} />
              </p>
              {lang !== "en" && s.original && s.original !== s.translated && (
                <p lang="en" className="mt-1.5 border-t border-line pt-1.5 text-[14px] leading-snug text-muted">
                  <span className="font-semibold">{t.originalLabel}:</span> {s.original}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
