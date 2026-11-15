"use client";

import { useEffect, useRef, useState } from "react";
import type { Mark } from "@/lib/marks";

const FRAME_H = 300;

/**
 * The person's own document, shown as a slightly tilted sheet of paper, with the problems
 * circled in red when we know where they are. The crop centers on the circled area.
 */
export default function DocumentHero({ photo, marks = [], alt }: { photo: string; marks?: Mark[]; alt: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(0); // image height / width
  const [frameW, setFrameW] = useState(0);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFrameW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const imgH = frameW * aspect;
  let top = 0;
  if (imgH > FRAME_H) {
    // Center the circled area vertically (or show the top of the page when nothing is circled).
    const ys = marks.map((m) => m.y + m.h / 2);
    const cy = ys.length ? ((Math.min(...ys) + Math.max(...ys)) / 2) * imgH : FRAME_H / 2;
    top = Math.max(FRAME_H - imgH, Math.min(0, FRAME_H / 2 - cy));
  }

  return (
    <div className="relative -mx-4 overflow-hidden px-6 pt-4 pb-14" style={{ background: "radial-gradient(120% 90% at 50% 0%, #F8F6F2 0%, #E8E4DC 100%)" }}>
      <div
        ref={frame}
        className="hero-paper relative mx-auto max-w-[380px] overflow-hidden rounded-md bg-white"
        style={{ height: FRAME_H, transform: "rotate(-2deg)", boxShadow: "0 2px 4px rgba(40,30,20,.08), 0 18px 40px rgba(40,30,20,.18)" }}
      >
        <div className="absolute inset-x-0" style={{ top, transition: "top .3s ease" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={alt}
            className="block w-full"
            onLoad={(e) => setAspect(e.currentTarget.naturalHeight / Math.max(1, e.currentTarget.naturalWidth))}
          />
          {aspect > 0 &&
            marks.map((m, n) => (
              <span
                key={n}
                aria-hidden
                className="mark-in absolute"
                style={{
                  left: `${(m.x - (m.shape === "box" ? 0.01 : 0.03)) * 100}%`,
                  top: `${(m.y - (m.shape === "box" ? 0.004 : 0.012)) * 100}%`,
                  width: `${(m.w + (m.shape === "box" ? 0.02 : 0.06)) * 100}%`,
                  height: `${(m.h + (m.shape === "box" ? 0.008 : 0.024)) * 100}%`,
                  border: "2.5px solid #E5372B",
                  borderRadius: m.shape === "box" ? 12 : "50%",
                  background: m.shape === "box" ? "rgba(229,55,43,.07)" : undefined,
                  transform: `rotate(${n % 2 ? 2 : -3}deg)`,
                  animationDelay: `${300 + n * 180}ms`,
                }}
              />
            ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), #FFFFFF)" }} />
      </div>
    </div>
  );
}
