"use client";

import { useEffect, useRef, useState } from "react";
import type { Analysis } from "@/lib/types";
import type { Strings } from "@/lib/i18n";
import { Card, CardTitle, Shimmer, formatDate } from "./ui";
import { Linkify, telHref } from "./linkify";

/* ---------- Ask about this document ---------- */

export interface QA {
  q: string;
  a: string;
}

/** Plain-text answer with "- " bullets and tappable phone numbers / links. */
function Answer({ text }: { text: string }) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•*]\s+/.test(l));
  const prose = lines.filter((l) => !/^[-•*]\s+/.test(l));
  return (
    <div className="space-y-2 text-[17px] leading-relaxed">
      {prose.map((p, i) => (
        <p key={i}>
          <Linkify text={p.replace(/\*\*/g, "")} />
        </p>
      ))}
      {bullets.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {bullets.map((b, i) => (
            <li key={i}>
              <Linkify text={b.replace(/^[-•*]\s+/, "").replace(/\*\*/g, "")} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AskCard({
  docType,
  t,
  i,
  qa,
  asking,
  failed,
  onAsk,
}: {
  docType: Analysis["document_type"];
  t: Strings;
  i: number;
  qa: QA[];
  asking: string | null;
  failed: boolean;
  onAsk: (q: string) => void;
}) {
  const [text, setText] = useState("");
  const suggestions =
    docType === "unreadable" ? [] : t.askSuggestions[docType].filter((s) => !qa.some((x) => x.q === s));

  function submit(q: string) {
    const clean = q.trim();
    if (!clean || asking) return;
    setText("");
    onAsk(clean);
  }

  return (
    <Card i={i}>
      <CardTitle>💬 {t.askTitle}</CardTitle>

      {qa.length > 0 && (
        <div className="mb-4 space-y-4">
          {qa.map((x, n) => (
            <div key={n}>
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-teal px-4 py-2 text-[16px] text-white">
                {x.q}
              </p>
              <div className="mt-2 rounded-2xl rounded-bl-md bg-paper p-4 ring-1 ring-line">
                <Answer text={x.a} />
              </div>
            </div>
          ))}
        </div>
      )}

      {asking && (
        <div className="mb-4">
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-teal px-4 py-2 text-[16px] text-white">
            {asking}
          </p>
          <div className="mt-2 rounded-2xl rounded-bl-md bg-paper p-4 ring-1 ring-line" aria-live="polite">
            <p className="mb-2 text-[15px] font-semibold text-teal">{t.askThinking}</p>
            <Shimmer lines={2} />
          </div>
        </div>
      )}

      {failed && !asking && (
        <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[15px] text-amber-900">{t.askFailed}</p>
      )}

      {!asking && suggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="min-h-[44px] rounded-full bg-teal-soft px-4 text-left text-[15px] font-medium text-teal-900 active:bg-teal/20"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={400}
          placeholder={t.askPlaceholder}
          aria-label={t.askTitle}
          enterKeyHint="send"
          className="min-h-[48px] min-w-0 flex-1 rounded-xl bg-paper px-4 text-[17px] ring-1 ring-line outline-none focus:ring-2 focus:ring-teal"
        />
        <button
          type="submit"
          disabled={!text.trim() || !!asking}
          className="min-h-[48px] rounded-xl bg-teal px-5 text-[17px] font-semibold text-white disabled:opacity-40"
        >
          {t.askSend}
        </button>
      </form>
    </Card>
  );
}

/* ---------- Free help near you (verified links only) ---------- */

interface HelpItem {
  title: string;
  note?: string;
  url: string;
  urlLabel: string;
  phone?: string;
}

// Checked by hand on 2026-11-14. Only add links that have been opened and confirmed.
const LINKS = {
  glendaleParking: "https://www.glendaleca.gov/government/departments/police-department/traffic-parking",
  glendaleParkingPhone: "(866) 470-3088",
  glendaleDevServices: "https://www.glendaleca.gov/government/departments/community-development/development-services",
  glendaleDevServicesPhone: "(818) 548-3200",
  cslb: "https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx",
  nlsla: "https://nlsla.org/",
  nlslaPhone: "(800) 433-6251",
  ftc: "https://reportfraud.ftc.gov/",
};

export function HelpCard({ a, t, i }: { a: Analysis; t: Strings; i: number }) {
  const h = t.help;
  const legalAid: HelpItem = {
    title: h.legalAid,
    note: h.legalAidNote,
    url: LINKS.nlsla,
    urlLabel: "nlsla.org",
    phone: LINKS.nlslaPhone,
  };
  const items: HelpItem[] = [];
  if (a.document_type === "parking_ticket") {
    items.push({
      title: h.glendaleParking,
      note: h.glendaleParkingNote,
      url: LINKS.glendaleParking,
      urlLabel: "glendaleca.gov",
      phone: LINKS.glendaleParkingPhone,
    });
    items.push(legalAid);
  } else if (a.document_type === "contractor_quote") {
    items.push({ title: h.cslb, url: LINKS.cslb, urlLabel: "cslb.ca.gov" });
    items.push({
      title: h.glendalePermits,
      note: h.glendalePermitsNote,
      url: LINKS.glendaleDevServices,
      urlLabel: "glendaleca.gov",
      phone: LINKS.glendaleDevServicesPhone,
    });
  } else {
    items.push(legalAid);
  }
  if (a.legitimacy_check && a.legitimacy_check.verdict !== "looks_legitimate") {
    items.push({ title: h.reportScam, url: LINKS.ftc, urlLabel: "reportfraud.ftc.gov" });
  }

  return (
    <Card i={i}>
      <CardTitle>🤝 {t.helpTitle}</CardTitle>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.title} className="rounded-xl bg-paper p-4 ring-1 ring-line">
            <p className="font-semibold leading-snug">{it.title}</p>
            {it.note && <p className="mt-1 text-[15px] leading-snug text-stone-700">{it.note}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={it.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold text-teal ring-1 ring-teal/30 active:bg-teal-soft"
              >
                🌐 {it.urlLabel}
              </a>
              {it.phone && (
                <a
                  href={telHref(it.phone)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold text-teal ring-1 ring-teal/30 active:bg-teal-soft"
                >
                  📞 {it.phone}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- Read aloud ---------- */

function langOf(tag: string) {
  const base = tag.toLowerCase().split(/[-_]/)[0];
  return base === "tl" ? "fil" : base; // Tagalog voices are usually tagged fil-PH
}

function findVoice(locale: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const want = langOf(locale);
  return window.speechSynthesis.getVoices().find((v) => langOf(v.lang) === want) ?? null;
}

/** Shows only when the phone actually has a voice for this language (Armenian often has none). */
export function ReadAloudButton({ a, t, locale }: { a: Analysis; t: Strings; locale: string }) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const runRef = useRef(0);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () => setVoice(findVoice(locale));
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", update);
      window.speechSynthesis.cancel();
    };
  }, [locale]);

  if (!voice) return null;

  function stop() {
    runRef.current++;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function start() {
    stop();
    const run = runRef.current;
    const d = a.deadline;
    const deadline =
      d && (d.date || d.what_is_due)
        ? `${t.deadlineUnknownDate}: ${[formatDate(d.date, locale), d.what_is_due].filter(Boolean).join(". ")}`
        : "";
    // Short chunks: some browsers stop long utterances after ~15 seconds.
    const chunks = [
      a.headline,
      deadline,
      a.summary,
      a.action_steps.length ? `${t.whatToDo}:` : "",
      ...a.action_steps.map((s, n) => `${n + 1}. ${s.title}. ${s.detail}`),
    ]
      .flatMap((c) => c.split(/(?<=[.!?։。])\s+/))
      .map((c) => c.trim())
      .filter(Boolean);
    chunks.forEach((c, n) => {
      const u = new SpeechSynthesisUtterance(c);
      u.voice = voice;
      u.lang = voice!.lang;
      u.rate = 0.95;
      if (n === chunks.length - 1) u.onend = () => run === runRef.current && setSpeaking(false);
      window.speechSynthesis.speak(u);
    });
    setSpeaking(true);
  }

  return (
    <button
      onClick={speaking ? stop : start}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold text-teal ring-1 ring-teal/30 active:bg-teal-soft"
    >
      {speaking ? `⏹ ${t.stopReading}` : `🔊 ${t.readAloud}`}
    </button>
  );
}
