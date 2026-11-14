"use client";

import { useEffect, useRef, useState } from "react";
import type { Analysis, Lang } from "@/lib/types";
import type { Strings } from "@/lib/i18n";
import { googleUrl, outlookUrl, type CalEvent } from "@/lib/calendar";
import { checkOfficialNumbers, formatPhone, helpFor } from "@/lib/resources";
import { Linkify } from "./linkify";

const cardCls =
  "rise rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-line";
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
}: {
  a: Analysis;
  t: Strings;
  dateLabel: string | null;
  i: number;
  noCalendar?: boolean;
}) {
  const [open, setOpen] = useState<"cal" | "share" | null>(null);
  const event = noCalendar ? null : eventFor(a, t);
  const text = shareTextFor(a, t, dateLabel);

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
            📅 {t.remindTitle}
          </button>
        )}
        <button
          onClick={onShare}
          aria-expanded={open === "share"}
          className={`${pill} bg-white text-ink ring-line active:bg-teal-soft ${open === "share" ? "ring-2 ring-teal" : ""}`}
        >
          👪 {t.share}
        </button>
      </div>

      {open === "cal" && event && (
        <div className="fade-msg rounded-2xl bg-white p-4 ring-1 ring-line">
          <p className="mb-3 text-[15px] text-muted">{t.remindSub}</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => void addToAppleCalendar(event)} className={`${pill} bg-ink text-white ring-ink text-[15px]`}>
              📅 {t.apple}
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
        <div className="fade-msg rounded-2xl bg-white p-4 ring-1 ring-line">
          <p className="mb-3 text-[15px] text-muted">{t.shareSub}</p>
          <div className="grid grid-cols-2 gap-2">
            <a href={`sms:?&body=${encodeURIComponent(text)}`} className={`${pill} bg-white text-ink ring-line`}>
              💬 {t.shareText}
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
      <section className="rise rounded-2xl bg-green-50 p-4 ring-1 ring-green-200" style={{ animationDelay: `${i * 50}ms` }}>
        <p className="font-semibold text-green-800">✅ {t.numberMatchTitle(check.agency.name)}</p>
      </section>
    );
  }
  return (
    <section className="rise rounded-2xl bg-red-600 p-5 text-white" style={{ animationDelay: `${i * 50}ms` }}>
      <p className="text-[20px] font-bold leading-tight">☎️ {t.numberMismatchTitle(check.agency.name)}</p>
      <p className="mt-2 text-[16px] leading-snug opacity-95">
        {t.numberMismatchBody(check.bad.join(", "), `${check.agency.name} ${t.officialNumber} ${official}`)}
      </p>
      <a
        href={`tel:+1${check.agency.phones[0]}`}
        className="mt-3 flex min-h-[48px] items-center justify-center rounded-xl bg-white text-[17px] font-bold text-red-700"
      >
        📞 {t.call} {check.agency.name}: {official}
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
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">📍 {t.helpTitle}</h2>
      <p className="mb-3 text-[15px] text-muted">{t.helpSub}</p>
      <ul className="space-y-2">
        {list.map((r) => (
          <li key={r.name} className="rounded-xl bg-paper p-3">
            <p className="font-semibold leading-snug">{r.name}</p>
            <p className="mt-0.5 text-[15px] leading-snug text-stone-700">{r.desc[lang]}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {r.phone && (
                <a
                  href={r.phone === "211" ? "tel:211" : `tel:+1${r.phone.replace(/\D/g, "")}`}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-teal px-4 text-[15px] font-semibold text-white"
                >
                  📞 {r.phone === "211" ? "2-1-1" : r.phone}
                </a>
              )}
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full bg-white px-4 text-[15px] font-semibold text-teal ring-1 ring-teal/30"
                >
                  🌐 {t.website}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Ask a follow-up ---------- */

export function AskCard({
  a,
  t,
  lang,
  image,
  i,
}: {
  a: Analysis;
  t: Strings;
  lang: Lang;
  image: { base64: string; mediaType: string } | null;
  i: number;
}) {
  const [qa, setQa] = useState<{ q: string; a: string | null; err?: boolean }[]>([]);
  const [input, setInput] = useState("");
  const busy = qa.some((x) => x.a === null && !x.err);

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
    <section className={cardCls} style={{ animationDelay: `${i * 50}ms` }}>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted">💬 {t.askTitle}</h2>
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
          {t.askSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => void ask(s)}
              className="min-h-[44px] rounded-full bg-teal-soft px-4 text-left text-[15px] font-medium text-teal-900 active:bg-teal/20"
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
          placeholder={t.askPlaceholder}
          enterKeyHint="send"
          className="min-h-[48px] min-w-0 flex-1 rounded-xl bg-paper px-4 text-[16px] ring-1 ring-line outline-none focus:ring-2 focus:ring-teal"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="min-h-[48px] rounded-xl bg-teal px-5 text-[16px] font-semibold text-white disabled:opacity-40"
        >
          {t.askSend}
        </button>
      </form>
    </section>
  );
}

/* ---------- Read aloud ---------- */

const VOICE_PREFIX: Record<Lang, string[]> = { en: ["en"], hy: ["hy"], es: ["es"], ko: ["ko"], tl: ["fil", "tl"] };

export function ReadAloud({ a, t, lang, dateLabel }: { a: Analysis; t: Strings; lang: Lang; dateLabel: string | null }) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const utter = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((x) => VOICE_PREFIX[lang].some((p) => x.lang.toLowerCase().startsWith(p)));
      setVoice(v ?? null);
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pick);
      window.speechSynthesis.cancel();
    };
  }, [lang]);

  // Only offer it when the phone actually has a voice for this language.
  if (!voice) return null;

  function toggle() {
    const s = window.speechSynthesis;
    if (speaking) {
      s.cancel();
      setSpeaking(false);
      return;
    }
    const parts = [
      a.headline,
      a.deadline?.what_is_due ? `${t.dueWord}${dateLabel ? `, ${dateLabel}` : ""}. ${a.deadline.what_is_due}` : "",
      a.summary,
      a.action_steps.length ? `${t.stepsWord}.` : "",
      ...a.action_steps.map((st, n) => `${n + 1}. ${st.title}. ${st.detail}`),
    ].filter(Boolean);
    const u = new SpeechSynthesisUtterance(parts.join("\n"));
    u.voice = voice;
    u.lang = voice!.lang;
    u.rate = 0.92;
    u.onend = u.onerror = () => setSpeaking(false);
    utter.current = u;
    s.cancel();
    s.speak(u);
    setSpeaking(true);
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-teal ring-1 ring-teal/30 active:bg-teal-soft"
    >
      {speaking ? `⏹ ${t.stopReading}` : `🔊 ${t.readAloud}`}
    </button>
  );
}
