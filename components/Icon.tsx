import type { ReactNode } from "react";

/* Line icons drawn in currentColor, one stroke weight, so they sit with Figtree. */
const PATHS: Record<string, ReactNode> = {
  check: <path d="m4 12.5 5 5L20 6.5" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 17h.01" />
    </>
  ),
  warn: <path d="M12 3 2 20h20zM12 10v4M12 17h.01" />,
  car: (
    <>
      <path d="M5 17h14M6 17V9l2-4h8l2 4v8M6 9h12" />
      <circle cx="8.5" cy="17.5" r="1.5" />
      <circle cx="15.5" cy="17.5" r="1.5" />
    </>
  ),
  court: <path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0zM8 21h8" />,
  doc: <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  house: <path d="M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  speaker: <path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-4-5.6" />
    </>
  ),
  dollar: <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  ),
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  pages: (
    <>
      <path d="M8 3h9a2 2 0 0 1 2 2v12" />
      <rect x="4" y="7" width="12" height="14" rx="2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  upload: <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20, stroke = 2, className }: { name: IconName; size?: number; stroke?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/** The Explain It mark: a green tile with an envelope and a highlighter dot. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <rect width="40" height="40" rx="12" fill="#0f7a4c" />
      <path d="M9 14.5h22v12.5a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" fill="#fff" />
      <path d="M9.8 15.3 20 22.6l10.2-7.3" fill="none" stroke="#0f7a4c" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="30" cy="12" r="5.6" fill="#ffe27a" stroke="#0f7a4c" strokeWidth="2.2" />
    </svg>
  );
}
