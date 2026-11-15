"use client";

import { useEffect, useRef, useState } from "react";
import type { Mark } from "@/lib/marks";

const FRAME_H = 300;
const FRAME_H_COMPACT = 210;

/**
 * The person's own document, shown as a slightly tilted sheet of paper, with the problems
 * circled in red when we know where they are. The crop centers on the circled area.
 */
export default function DocumentHero({
  photo,
  marks = [],
  alt,
  compact = false,
}: {
  photo: string;
  marks?: Mark[];
  alt: string;
  /** Home-screen preview: a rounded card instead of a full-width band under a sheet */
  compact?: boolean;
}) {
  const H = compact ? FRAME_H_COMPACT : FRAME_H;
  const frame = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(0); // image height / width
  const [frameW, setFrameW] = useState(0);

  const img = useRef<HTMLImageElement>(null);
  // The server-rendered image can finish loading before React hydrates and misses onLoad.
  useEffect(() => {
    const i = img.current;
    if (i?.complete && i.naturalWidth) setAspect(i.naturalHeight / i.naturalWidth);
  }, [photo]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFrameW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const imgH = frameW * aspect;
  let top = 0;
  if (imgH > H) {
    // Center the circled area vertically (or show the top of the page when nothing is circled).
    const ys = marks.map((m) => m.y + m.h / 2);
    const cy = ys.length ? ((Math.min(...ys) + Math.max(...ys)) / 2) * imgH : H / 2;
    top = Math.max(H - imgH, Math.min(0, H / 2 - cy));
  }

  return (
    <div className={compact ? "relative overflow-hidden rounded-[28px] px-8 py-6" : "relative -mx-4 overflow-hidden px-8 pt-6 pb-16"} style={{ background: "radial-gradient(120% 80% at 50% 0%, #1D2230 0%, #0F1115 70%)" }}>
      {/* Viewfinder corners around the scanned page */}
      <div className={`pointer-events-none absolute inset-x-5 top-3 ${compact ? "bottom-3" : "bottom-11"}`} aria-hidden>
        {["left-0 top-0 border-l-2 border-t-2 rounded-tl-xl", "right-0 top-0 border-r-2 border-t-2 rounded-tr-xl", "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-xl", "right-0 bottom-0 border-r-2 border-b-2 rounded-br-xl"].map((c) => (
          <span key={c} className={`absolute h-7 w-7 border-white/40 ${c}`} />
        ))}
      </div>
      <div
        ref={frame}
        className="relative mx-auto max-w-[360px] overflow-hidden rounded-[14px] bg-white"
        style={{ height: H, boxShadow: "0 0 0 1px rgba(255,255,255,.06), 0 24px 60px rgba(0,0,0,.45)" }}
      >
        <div className="absolute inset-x-0" style={{ top, transition: "top .3s ease" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={img}
            src={photo}
            alt={alt}
            className="block w-full"
            onLoad={(e) => setAspect(e.currentTarget.naturalHeight / Math.max(1, e.currentTarget.naturalWidth))}
          />
          {aspect > 0 &&
            marks.map((m, n) => {
              const box = m.shape === "box";
              return (
                <svg
                  key={n}
                  aria-hidden
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute overflow-visible"
                  style={{
                    left: `${(m.x - (box ? 0.01 : 0.03)) * 100}%`,
                    top: `${(m.y - (box ? 0.004 : 0.012)) * 100}%`,
                    width: `${(m.w + (box ? 0.02 : 0.06)) * 100}%`,
                    height: `${(m.h + (box ? 0.008 : 0.024)) * 100}%`,
                    transform: `rotate(${n % 2 ? 2 : -3}deg)`,
                  }}
                >
                  {box ? (
                    <rect
                      x="0" y="0" width="100" height="100" rx="12" ry="30"
                      pathLength={1}
                      className="mark-draw"
                      fill="rgba(229,55,43,.07)"
                      stroke="#E5372B"
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                      style={{ animationDelay: `${1350 + n * 320}ms` }}
                    />
                  ) : (
                    <ellipse
                      cx="50" cy="50" rx="50" ry="50"
                      pathLength={1}
                      className="mark-draw"
                      fill="none"
                      stroke="#E5372B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      transform="rotate(-100 50 50)"
                      style={{ animationDelay: `${1350 + n * 320}ms` }}
                    />
                  )}
                </svg>
              );
            })}
        </div>
        {/* Opening motion: a scan line sweeps down the page, then the problems get circled */}
        <span aria-hidden className="hero-scan-wash pointer-events-none absolute inset-x-0 top-0" />
        <span aria-hidden className="hero-scan pointer-events-none absolute inset-x-0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,.95))" }} />
      </div>
    </div>
  );
}
