"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import "./landing.css";
import Icon, { LogoMark } from "./Icon";
import { formatDate } from "./ui";
import { LANDING } from "@/lib/i18n-landing";
import { LANG_FULL, STRINGS, type Strings } from "@/lib/i18n";
import { HELP } from "@/lib/resources";
import type { RecentItem } from "@/lib/recent";
import { LANGS, type Lang, type SampleId } from "@/lib/types";

/* The home screen: the landing page, with the app's real actions wired in. */

// Class names live in landing.css, all prefixed "lp-" (this project runs every .css file as plain CSS).
const s = new Proxy<Record<string, string>>({}, { get: (_o, k) => `lp-${String(k)}` });

const v = (i: number) => ({ "--i": i }) as CSSProperties;
const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const DUE = "2026-11-30";

/** Should the page move? Honour "reduce motion", unless opened with ?motion=on (for demos on machines with animations off). */
const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeMotion(cb: () => void) {
  const m = window.matchMedia(REDUCE);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
function useMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => !window.matchMedia(REDUCE).matches || new URLSearchParams(window.location.search).get("motion") === "on",
    () => false, // server: no motion until the client knows
  );
}

/** Marks [data-reveal] elements as seen once they scroll into view. */
function useReveal(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add(s.seen);
          io.unobserve(e.target);
        }),
      { threshold: 0.18 },
    );
    el.querySelectorAll("[data-reveal]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [root]);
}

/** Photos drift a little as they pass through the screen. */
function useParallax(root: React.RefObject<HTMLElement | null>, on: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!el || !on) return;
    const items = [...el.querySelectorAll<HTMLElement>("[data-par]")];
    let raf = 0;
    const run = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const it of items) {
        const r = it.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        it.style.setProperty("--py", `${(p * -28).toFixed(1)}px`);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    run();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [root, on]);
}

const PHRASES = [
  "Failure to appear may result in a fine",
  "Pay by November 30",
  "Վերջնաժամկետ",
  "Fecha límite",
  "마감일",
  "Huling abiso",
  "Notice of violation",
  "Amount due",
  "Ծանուցում",
  "Aviso final",
  "납부 기한",
  "Late penalty: $73.00",
  "Jury summons",
  "Respond within 10 days",
  "Paunawa",
  "Citation number",
];

/** Background of the hero card: real official-mail phrases in five languages drift up, now and then highlighted. */
function useDrift(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  copyRef: React.RefObject<HTMLElement | null>,
  on: boolean,
  lang: Lang,
) {
  useEffect(() => {
    const c = canvasRef.current;
    const copy = copyRef.current;
    const card = c?.parentElement;
    const ctx = c?.getContext("2d");
    if (!c || !copy || !card || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const R = { x0: 0, x1: 0, y0: 0, y1: 0 };
    let W = 0,
      H = 0,
      raf = 0,
      visible = true;
    type Item = { t: string; x: number; y: number; s: number; v: number; hl: number };
    let items: Item[] = [];
    const rx = () => R.x0 + Math.random() * Math.max(10, R.x1 - R.x0 - 140);
    const size = () => {
      const r = card.getBoundingClientRect();
      W = r.width;
      H = r.height;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Keep the words out from behind the headline: right side on wide screens, below the copy on phones.
      const cr = copy.getBoundingClientRect();
      if (W > 900) Object.assign(R, { x0: cr.right - r.left, x1: W, y0: 0, y1: H });
      else Object.assign(R, { x0: 0, x1: W, y0: cr.bottom - r.top, y1: H });
    };
    const seed = () => {
      items = Array.from({ length: 12 }, (_, i) => ({
        t: PHRASES[i % PHRASES.length],
        x: rx(),
        y: R.y0 + Math.random() * (R.y1 - R.y0),
        s: 14 + Math.random() * 10,
        v: 0.12 + Math.random() * 0.2,
        hl: 0,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
      ctx.clip();
      ctx.textBaseline = "top";
      for (const it of items) {
        ctx.font = `600 ${it.s}px Figtree, "Noto Sans Armenian", "Noto Sans KR", sans-serif`;
        if (it.hl > 0) {
          const w = ctx.measureText(it.t).width;
          ctx.fillStyle = `rgba(255,226,122,${0.5 * Math.min(1, it.hl)})`;
          ctx.fillRect(it.x - 3, it.y - 2, (w + 6) * Math.min(1, (1.3 - it.hl) * 3 + 0.05), it.s + 6);
        }
        ctx.fillStyle = "rgba(17,17,17,0.05)";
        ctx.fillText(it.t, it.x, it.y);
      }
      ctx.restore();
    };
    const step = () => {
      for (const it of items) {
        it.y -= it.v;
        if (it.y < R.y0 - 30) {
          it.y = R.y1 + 10;
          it.x = rx();
          it.t = PHRASES[(Math.random() * PHRASES.length) | 0];
          it.hl = 0;
        }
        if (it.hl > 0) it.hl -= 0.004;
      }
      draw();
      raf = visible && !document.hidden ? requestAnimationFrame(step) : 0;
    };
    const start = () => {
      if (!raf && on) raf = requestAnimationFrame(step);
    };
    const reset = () => {
      size();
      seed();
      draw();
    };
    reset();
    void document.fonts?.ready.then(reset);
    window.addEventListener("resize", reset);
    let io: IntersectionObserver | null = null;
    let timer = 0;
    if (on) {
      io = new IntersectionObserver((es) => {
        visible = es[0].isIntersecting;
        if (visible) start();
      });
      io.observe(card);
      document.addEventListener("visibilitychange", start);
      timer = window.setInterval(() => {
        const it = items[(Math.random() * items.length) | 0];
        if (it && it.y > R.y0 + 20 && it.y < R.y1 - 40) it.hl = 1.3;
      }, 1800);
      start();
    }
    return () => {
      window.removeEventListener("resize", reset);
      document.removeEventListener("visibilitychange", start);
      io?.disconnect();
      clearInterval(timer);
      cancelAnimationFrame(raf);
    };
    // The copy is re-mounted when the language changes, so measure again then.
  }, [canvasRef, copyRef, on, lang]);
}

function Check({ on }: { on?: boolean }) {
  return (
    <span className={`${s.cb} ${on ? s.cbOn : ""}`}>
      <Icon name="check" size={13} stroke={4} />
    </span>
  );
}

function Timeline({ locale, today, go }: { locale: string; today: string; go?: boolean }) {
  const short = (iso: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
  return (
    <div className={`${s.tl} ${go ? s.tlGo : ""}`}>
      <div className={s.tlTrack} />
      <div className={s.tlFill} />
      <span className={s.tlDot} style={{ left: 7 }}>
        <i>{short("2026-11-09")}</i>
      </span>
      <span className={`${s.tlDot} ${s.tlNow}`} style={{ left: "48%" }}>
        <i>{today}</i>
      </span>
      <span className={`${s.tlDot} ${s.tlDue}`} style={{ left: "calc(100% - 7px)" }}>
        <i>{short(DUE)}</i>
      </span>
    </div>
  );
}

function StatusBar() {
  return (
    <div className={s.mStatus} aria-hidden="true">
      <span>9:41</span>
      <svg width="64" height="12" viewBox="0 0 64 12" fill="currentColor">
        <rect x="0" y="7" width="3" height="5" rx="1" />
        <rect x="5" y="5" width="3" height="7" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="1" width="3" height="11" rx="1" />
        <rect x="36" y="1" width="24" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="38.5" y="3.5" width="17" height="6" rx="1.5" />
        <rect x="61" y="4.5" width="2" height="4" rx="1" />
      </svg>
    </div>
  );
}

const PHOTO = {
  mailboxes: { src: "/landing/mailboxes.jpg", alt: "A row of roadside mailboxes" },
  alex: { src: "/landing/alex-theatre.jpg", alt: "The spire of the Alex Theatre on Brand Boulevard" },
  brand: { src: "/landing/brand-boulevard.jpg", alt: "Brand Boulevard, Glendale" },
  north: { src: "/landing/north-brand.jpg", alt: "North Brand Boulevard, Glendale" },
  skyline: { src: "/landing/skyline.jpg", alt: "Downtown Glendale and the Verdugo Mountains" },
  lawn: { src: "/landing/forest-lawn.jpg", alt: "Glendale seen from the hills of Forest Lawn" },
};

function Photo({ p, sizes, alt = true }: { p: { src: string; alt: string }; sizes: string; alt?: boolean }) {
  return (
    <div className={s.photo} data-reveal>
      <div className={s.photoIn} data-par>
        <Image src={p.src} alt={alt ? p.alt : ""} fill sizes={sizes} className={s.cover} />
      </div>
    </div>
  );
}

export default function Landing({
  t,
  lang,
  locale,
  onLang,
  onScan,
  onUpload,
  onPages,
  onChat,
  onDirectory,
  onSample,
  recent,
  onRecent,
  onClearRecent,
}: {
  t: Strings;
  lang: Lang;
  locale: string;
  onLang: (l: Lang) => void;
  onScan: () => void;
  onUpload: () => void;
  onPages: () => void;
  onChat: () => void;
  onDirectory: () => void;
  onSample: (id: SampleId) => void;
  recent: RecentItem[];
  onRecent: (r: RecentItem) => void;
  onClearRecent: () => void;
}) {
  const L = LANDING[lang];
  const motion = useMotion();
  const [credits, setCredits] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  useReveal(root);
  useParallax(root, motion);
  useDrift(canvas, copy, motion, lang);

  // Hero phone: the countdown counts up to 16, the line fills, the first step ticks.
  const [count, setDays] = useState(16);
  const [going, setGo] = useState(false);
  const [tick, setTicked] = useState(false);
  // Without motion everything simply shows its finished state.
  const days = motion ? count : 16;
  const go = going || !motion;
  const ticked = tick || !motion;
  useEffect(() => {
    if (!motion) return;
    const t0 = performance.now() + 500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 1100));
      setDays(Math.round((1 - Math.pow(1 - p, 3)) * 16));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const a = window.setTimeout(() => setGo(true), 50);
    const b = window.setTimeout(() => setTicked(true), 2600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [motion]);

  const dueLong = formatDate(DUE, locale) ?? "";
  const samples: [SampleId, string, string][] = [
    ["ticket", "car", t.sampleTicket],
    ["letter", "court", t.sampleLetter],
    ["quote", "house", t.sampleQuote],
    ["scam", "warn", t.sampleScam],
  ];
  const helpLines = [HELP.two11, HELP.nls, HELP.glendaleParking, HELP.cslb];
  const types = ["car", "court", "doc", "bolt", "house"];

  return (
    <div ref={root} className={`${s.root} ${motion ? s.motion : ""}`}>
      {/* Hero: grey card, the promise on the left, the app on the right */}
      <section className={`${s.box} ${s.hero}`} aria-labelledby="hero-title">
        <div className={s.heroCard}>
          <canvas ref={canvas} className={s.drift} aria-hidden="true" />
          <div ref={copy} className={s.heroCopy} key={`copy-${lang}`}>
            <h1 id="hero-title" className={s.heroIn} style={v(0)}>
              {L.h1}
            </h1>
            <p className={`${s.heroLede} ${s.heroIn}`} style={v(1)}>
              {L.lede}
            </p>
            <div className={`${s.heroCta} ${s.heroIn}`} style={v(2)}>
              <button type="button" className={`${s.btn} ${s.btnInk}`} onClick={onScan}>
                <Icon name="camera" size={22} />
                {t.scan}
              </button>
              <button type="button" className={s.link} onClick={onUpload}>
                {t.upload}
              </button>
            </div>
            <div className={`${s.langs} ${s.heroIn}`} style={v(3)} role="group" aria-labelledby="read-in">
              <span className={s.langsLabel} id="read-in">
                {L.readIn}
              </span>
              <div className={s.chips}>
                {LANGS.map((l) => (
                  <button key={l} type="button" lang={l} aria-pressed={l === lang} onClick={() => onLang(l)}>
                    {LANG_FULL[l]}
                  </button>
                ))}
              </div>
            </div>
            <ul className={`${s.ticks} ${s.heroIn}`} style={v(4)}>
              <li>
                <Icon name="check" size={18} stroke={3} />
                {L.free}
              </li>
              <li>
                <Icon name="check" size={18} stroke={3} />
                {t.privacy}
              </li>
            </ul>
          </div>

          <div
            className={s.heroArt}
            role="img"
            aria-label={`${L.mock.doc}: ${t.daysLeft(16)}, ${L.mock.mistakes}, ${L.mock.letter}`}
          >
            <div className={s.phoneIn}>
              <div className={`${s.device} ${s.heroDevice}`}>
                <div className={s.island} />
                <div className={s.screen}>
                  <div className={s.mTop}>
                    <StatusBar />
                    <div className={s.mBar}>
                      <span>‹</span>
                      <b>{t.appName}</b>
                      <span>AA</span>
                    </div>
                  </div>
                  <div className={s.mCard}>
                    <div className={s.mHead}>
                      <div>
                        <small>{L.mock.doc}, City of Glendale</small>
                        <strong>$73.00</strong>
                      </div>
                      <span className={s.ok}>
                        <Icon name="check" size={12} stroke={3.5} />
                        {L.mock.strong}
                      </span>
                    </div>
                    <Timeline locale={locale} today={L.mock.today} go={go} />
                  </div>
                  <div className={s.mRows}>
                    <div className={s.mRow}>
                      <span className={s.ico}>
                        <Icon name="calendar" />
                      </span>
                      <div>
                        <b>{t.daysLeft(days)}</b>
                        <small>{dueLong}</small>
                      </div>
                    </div>
                    <div className={s.mRow}>
                      <span className={`${s.ico} ${s.icoRed}`}>
                        <Icon name="alert" />
                      </span>
                      <div>
                        <b>{L.mock.mistakes}</b>
                        <small>{L.mock.mistakesSub}</small>
                      </div>
                    </div>
                  </div>
                  <p className={s.mLabel}>{t.whatToDo}</p>
                  <div className={s.mCheck}>
                    <Check on={ticked} />
                    {L.mock.step1}
                  </div>
                  <div className={s.mCheck}>
                    <Check />
                    {L.mock.step2}
                  </div>
                </div>
              </div>
            </div>
            <div className={`${s.float} ${s.heroFloat} ${s.popIn}`}>
              <div className={`${s.card} ${s.bob}`}>
                <div className={s.flHead}>
                  <span className={s.sqIco}>
                    <Icon name="doc" size={18} />
                  </span>
                  {L.mock.letter}
                </div>
                <div className={s.lines}>
                  <i />
                  <i className={s.hl} />
                  <i />
                  <i className={s.short} />
                </div>
                <small>{L.mock.letterSub}</small>
                <span className={s.ready}>{L.mock.ready}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The samples, wired to the real app */}
      <section className={`${s.box} ${s.panel} ${s.try}`} id="try" aria-labelledby="try-title">
        <div className={s.tryHead}>
          <h2 className={s.secH} id="try-title" data-reveal>
            {L.tryTitle}
          </h2>
          <p className={s.tryLede} data-reveal style={v(1)}>
            {L.trySub}
          </p>
        </div>
        <ul className={s.samples}>
          {samples.map(([id, icon, name], n) => (
            <li key={id} data-reveal style={v(n + 2)}>
              <button type="button" onClick={() => onSample(id)}>
                <span className={`${s.sqIco} ${id === "scam" ? s.sqRed : ""}`}>
                  <Icon name={icon} size={22} />
                </span>
                <span className={s.sampleText}>
                  <b>{name}</b>
                  <span>{L.sampleDesc[id]}</span>
                </span>
                <span className={s.sampleGo}>
                  <Icon name="arrow" size={20} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className={s.moreTitle}>{L.moreTitle}</p>
        <div className={s.more}>
          <button type="button" className={`${s.btn} ${s.btnWhite}`} onClick={onChat}>
            <Icon name="chat" />
            {t.agentButton}
          </button>
          <button type="button" className={`${s.btn} ${s.btnWhite}`} onClick={onDirectory}>
            <Icon name="pin" />
            {t.directoryButton}
          </button>
          <button type="button" className={`${s.btn} ${s.btnWhite}`} onClick={onPages}>
            <Icon name="pages" />
            {t.multiPage}
          </button>
        </div>
        {recent.length > 0 && (
          <div className={s.recent}>
            <div className={s.recentHead}>
              <p>
                <Icon name="clock" size={18} />
                {t.recentTitle}
              </p>
              <button type="button" onClick={onClearRecent}>
                {t.clearRecent}
              </button>
            </div>
            <ul>
              {recent.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onRecent(r)}>
                    <span className={s.recentType}>{STRINGS[r.lang].docType[r.analysis.document_type]}</span>
                    <span className={s.recentLine}>{r.analysis.headline}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className={s.recentNote}>{t.recentNote}</p>
          </div>
        )}
      </section>

      {/* The kinds of mail it reads */}
      <section className={s.mailbag} aria-labelledby="mail-title">
        <div className={s.fan} data-reveal aria-hidden="true">
          {[PHOTO.mailboxes, PHOTO.alex, PHOTO.brand].map((p, n) => (
            <figure key={p.src} className={[s.f1, s.f2, s.f3][n]}>
              <Image src={p.src} alt="" fill sizes="120px" className={s.cover} />
            </figure>
          ))}
        </div>
        <h2 id="mail-title" data-reveal style={v(1)}>
          {L.mailTitle}
        </h2>
        <ul className={s.types} data-reveal style={v(2)}>
          {L.types.map((label, n) => (
            <li key={label}>
              <Icon name={types[n]} size={24} />
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* How it works: four promises, each with the screen that keeps it */}
      <section className={`${s.box} ${s.features}`} id="how" aria-label={L.nav.how}>
        <article className={s.feat}>
          <div className={s.featArt} data-reveal>
            <Photo p={PHOTO.mailboxes} sizes="(max-width: 900px) 100vw, 600px" />
            <div className={`${s.float} ${s.slide}`} aria-hidden="true">
              <div className={`${s.card} ${s.bob}`}>
                <div className={s.lRow}>
                  <span className={s.ico}>
                    <Icon name="car" size={18} />
                  </span>
                  <div>
                    <b>{t.sampleTicket}</b>
                    <small>City of Glendale</small>
                  </div>
                  <span className={s.amt}>$73.00</span>
                </div>
                <div className={s.lRow}>
                  <span className={s.ico}>
                    <Icon name="court" size={18} />
                  </span>
                  <div>
                    <b>{t.sampleLetter}</b>
                    <small>LA Superior Court</small>
                  </div>
                  <span className={s.amt}>Nov 24</span>
                </div>
                <div className={s.lRow}>
                  <span className={s.ico}>
                    <Icon name="house" size={18} />
                  </span>
                  <div>
                    <b>{t.sampleQuote}</b>
                    <small>$20,250</small>
                  </div>
                  <span className={`${s.tag} ${s.tagWarn}`}>{L.card.high}</span>
                </div>
                <div className={s.lRow}>
                  <span className={`${s.ico} ${s.icoRed}`}>
                    <Icon name="alert" size={18} />
                  </span>
                  <div>
                    <b>{L.card.backTaxes}</b>
                    <small>{L.card.fromIrs}</small>
                  </div>
                  <span className={`${s.tag} ${s.tagBad}`}>{L.card.scamQ}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={s.featCopy}>
            <h2 data-reveal>{L.feats[0].title}</h2>
            <p data-reveal style={v(1)}>
              {L.feats[0].body}
            </p>
            <button type="button" className={`${s.btn} ${s.btnLine}`} data-reveal style={v(2)} onClick={() => onSample("letter")}>
              {L.feats[0].cta}
            </button>
          </div>
        </article>

        <article className={`${s.feat} ${s.flip}`}>
          <div className={s.featArt} data-reveal>
            <Photo p={PHOTO.north} sizes="(max-width: 900px) 100vw, 600px" />
            <div className={`${s.float} ${s.slide}`} aria-hidden="true">
              <div className={`${s.card} ${s.bob}`}>
                <div className={s.flHead}>
                  <span className={s.sqIco}>
                    <Icon name="calendar" size={18} />
                  </span>
                  {t.sampleTicket}
                </div>
                <p className={s.bigNum}>{t.daysLeft(16)}</p>
                <small className={s.dueSmall}>{dueLong}</small>
                <Timeline locale={locale} today={L.mock.today} />
                <div className={s.calBtn}>
                  <Icon name="plus" size={16} stroke={2.4} />
                  {L.card.addCal}
                </div>
              </div>
            </div>
            <div className={`${s.float} ${s.fee} ${s.pop}`} aria-hidden="true">
              <div className={`${s.card} ${s.bob}`} style={{ animationDelay: "-2s" }}>
                <div className={s.flHead} style={{ fontSize: 14 }}>
                  <span className={`${s.sqIco} ${s.sqRed}`}>
                    <Icon name="alert" size={16} />
                  </span>
                  {L.card.lateFee}
                </div>
              </div>
            </div>
          </div>
          <div className={s.featCopy}>
            <h2 data-reveal>{L.feats[1].title}</h2>
            <p data-reveal style={v(1)}>
              {L.feats[1].body}
            </p>
            <button type="button" className={`${s.btn} ${s.btnLine}`} data-reveal style={v(2)} onClick={() => onSample("ticket")}>
              {L.feats[1].cta}
            </button>
          </div>
        </article>

        <article className={s.feat}>
          <div className={s.featArt} data-reveal>
            <Photo p={PHOTO.alex} sizes="(max-width: 900px) 100vw, 600px" />
            <div className={`${s.float} ${s.slide}`} aria-hidden="true">
              <div className={`${s.card} ${s.bob}`}>
                <div className={s.flHead}>{t.whatToDo}</div>
                <div className={s.autoTick}>
                  <div className={s.mCheck}>
                    <Check />
                    {L.card.stepCar}
                  </div>
                  <div className={s.mCheck}>
                    <Check />
                    {L.mock.step1}
                  </div>
                  <div className={s.mCheck}>
                    <Check />
                    {L.mock.step2}
                  </div>
                </div>
                <div className={s.listen}>
                  <span className={s.wave}>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  {L.card.reading}
                </div>
              </div>
            </div>
          </div>
          <div className={s.featCopy}>
            <h2 data-reveal>{L.feats[2].title}</h2>
            <p data-reveal style={v(1)}>
              {L.feats[2].body}
            </p>
            <button type="button" className={`${s.btn} ${s.btnLine}`} data-reveal style={v(2)} onClick={() => onSample("ticket")}>
              {L.feats[2].cta}
            </button>
          </div>
        </article>

        <article className={`${s.feat} ${s.flip}`}>
          <div className={s.featArt} data-reveal>
            <Photo p={PHOTO.skyline} sizes="(max-width: 900px) 100vw, 600px" />
            <div className={`${s.float} ${s.slide}`} aria-hidden="true">
              <div className={`${s.card} ${s.bob}`}>
                <div className={s.scamHead}>
                  <Icon name="warn" size={18} stroke={2.4} />
                  {t.scamTitle.likely_scam}
                </div>
                <div className={s.scRow}>
                  {L.card.letterSays} <span className={s.strike}>(818) 555-0199</span>
                </div>
                <div className={s.scRow}>
                  {L.card.realIrs} <b className={s.hi}>(800) 829-1040</b>
                </div>
                <div className={s.scRow}>{L.card.giftCards}</div>
              </div>
            </div>
          </div>
          <div className={s.featCopy}>
            <h2 data-reveal>{L.feats[3].title}</h2>
            <p data-reveal style={v(1)}>
              {L.feats[3].body}
            </p>
            <button type="button" className={`${s.btn} ${s.btnLine}`} data-reveal style={v(2)} onClick={() => onSample("scam")}>
              {L.feats[3].cta}
            </button>
          </div>
        </article>
      </section>

      {/* Everything it does */}
      <section className={`${s.box} ${s.panel} ${s.all}`} aria-labelledby="all-title">
        <div className={s.center}>
          <h2 className={s.secH} id="all-title" data-reveal>
            {L.allTitle}
          </h2>
          <p className={s.centerLede} data-reveal style={v(1)}>
            {L.allSub}
          </p>
        </div>
        <div className={s.allGrid}>
          {[0, 1].map((col) => (
            <div key={col} className={s.wCard} data-reveal style={v(col + 2)}>
              {L.all.slice(col * 4, col * 4 + 4).map((it, n) => {
                const icon = ["globe", "calendar", "search", "doc", "speaker", "people", "dollar", "warn"][col * 4 + n];
                return (
                  <div key={it.title} className={s.item}>
                    <span className={`${s.ico} ${icon === "warn" ? s.icoRed : ""}`}>
                      <Icon name={icon} size={22} />
                    </span>
                    <div>
                      <h3>{it.title}</h3>
                      <p>{it.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Free help */}
      <section className={s.help} id="help" aria-labelledby="help-title">
        <div className={s.center}>
          <h2 className={s.secH} id="help-title" data-reveal>
            {L.helpTitle}
          </h2>
          <p className={s.centerLede} data-reveal style={v(1)}>
            {L.helpSub}
          </p>
        </div>
        <div className={s.helpGrid}>
          {helpLines.map((h, n) => (
            <div key={h.name} className={s.helpItem} data-reveal style={v(n)}>
              <span className={s.ico}>
                <Icon name={["phone", "court", "car", "house"][n]} size={26} />
              </span>
              <h3>{h.name}</h3>
              <p>{h.desc[lang]}</p>
              {h.phone && (
                <a className={s.call} href={tel(h.phone)}>
                  <Icon name="phone" size={18} />
                  {h.phone}
                </a>
              )}
            </div>
          ))}
        </div>
        <div className={s.center} style={{ marginTop: 48 }}>
          <button type="button" className={`${s.btn} ${s.btnLine}`} onClick={onDirectory}>
            {L.helpAll}
          </button>
        </div>
      </section>

      {/* Questions */}
      <section className={`${s.box} ${s.panel} ${s.faq}`} id="faq" aria-labelledby="faq-title">
        <div className={s.faqPanel}>
          <div className={s.faqSide}>
            <h2 className={s.secH} id="faq-title" data-reveal>
              {L.faqTitle}
            </h2>
            <p data-reveal style={v(1)}>
              {L.faqSub}
            </p>
            <a className={`${s.btn} ${s.btnInk}`} href="tel:211" data-reveal style={v(2)}>
              <Icon name="phone" />
              {L.faqCall}
            </a>
          </div>
          <div className={s.faqCards}>
            {L.faq.map((f) => (
              <div key={f.q} className={s.q} data-reveal>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Last call */}
      <section className={`${s.box} ${s.cta}`} aria-labelledby="cta-title">
        <div className={s.ctaCopy}>
          <h2 id="cta-title" data-reveal>
            {L.ctaTitle}
          </h2>
          <p data-reveal style={v(1)}>
            {L.ctaBody}
          </p>
          <div className={s.ctaActions} data-reveal style={v(2)}>
            <button type="button" className={`${s.btn} ${s.btnWhite}`} onClick={onScan}>
              <Icon name="camera" size={22} />
              {t.scan}
            </button>
            <a className={`${s.link} ${s.linkLight}`} href="#try">
              {t.trySample}
            </a>
          </div>
        </div>
        <div className={s.ctaPhoto}>
          <Image src={PHOTO.lawn.src} alt={PHOTO.lawn.alt} fill sizes="(max-width: 900px) 100vw, 560px" className={s.cover} />
        </div>
      </section>

      <footer className={s.foot}>
        <div className={s.footIn}>
          <div className={s.footBrand}>
            <span className={s.footLogo}>
              <LogoMark size={40} />
              {t.appName}
            </span>
            <p>{L.footAbout}</p>
            <p className={s.disclaimer}>{t.disclaimer}</p>
          </div>
          <nav className={s.footCol} aria-label={t.appName}>
            <h3>{t.appName}</h3>
            <a href="#how">{L.nav.how}</a>
            <a href="#try">{L.nav.try}</a>
            <a href="#faq">{L.nav.faq}</a>
          </nav>
          <nav className={s.footCol} aria-label={L.nav.help}>
            <h3>{L.nav.help}</h3>
            {helpLines.slice(0, 3).map((h) => (
              <a key={h.name} href={h.phone ? tel(h.phone) : "#help"}>
                {h.name}
              </a>
            ))}
          </nav>
          <div className={s.footCol}>
            <h3>Explain It</h3>
            <p>{L.footMade}</p>
            <p>{t.privacy}</p>
          </div>
        </div>
        {/* The credit links only exist while the fold-out is open, so the closed footer has no tiny tap targets. */}
        <details className={s.credits} onToggle={(e) => setCredits(e.currentTarget.open)}>
          <summary>Photo credits</summary>
          {credits && (
          <p>
          Pictures:{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Glendale,_California_skyline.jpg">“Glendale, California skyline”</a> by Quintin
          Soloviev, <a href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>;{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Brand_Boulevard,_Glendale_(California).JPG">“Brand Boulevard, Glendale”</a> and{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Alex_Theatre_(Glendale).jpg">“Alex Theatre (Glendale)”</a> by Alexis Doine, CC0;{" "}
          <a href="https://commons.wikimedia.org/wiki/File:North_Brand_Boulevard,_Glendale_(July_2023).JPG">“North Brand Boulevard, Glendale”</a> by
          Benoît Prieur, CC0; <a href="https://commons.wikimedia.org/wiki/File:Glendale_California_From_Forest_Lawn.jpg">“Glendale California From Forest Lawn”</a>,
          public domain; <a href="https://commons.wikimedia.org/wiki/File:Letters_(2568688831).jpg">“Letters”</a> by Andreas Duess,{" "}
          <a href="https://creativecommons.org/licenses/by/2.0">CC BY 2.0</a>; all via Wikimedia Commons. Pictures show Glendale and mail in general, not
          Explain It users.
          </p>
          )}
        </details>
      </footer>
    </div>
  );
}
