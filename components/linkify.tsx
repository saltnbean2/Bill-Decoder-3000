import type { ReactNode } from "react";

const PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/;
const URL_RE = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:gov|com|org|net|us|edu|info)(?:\/[^\s,)]*)?/i;
const TOKEN = new RegExp(`(${PHONE.source})|(${URL_RE.source})`, "gi");

export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits.length === 10 ? `+1${digits}` : digits}`;
}

export function urlHref(u: string) {
  const clean = u.replace(/[.,;:]+$/, "");
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

/** Classify a contact string into a tappable link. */
export function contactLink(contact: string): { href: string; label: string; kind: "tel" | "url" | "map" } {
  const phone = contact.match(PHONE);
  if (phone && phone[0].replace(/\D/g, "").length >= 10) {
    return { href: telHref(phone[0]), label: contact, kind: "tel" };
  }
  const url = contact.match(URL_RE);
  if (url && !/@/.test(contact)) return { href: urlHref(url[0]), label: contact, kind: "url" };
  return {
    href: `https://maps.google.com/?q=${encodeURIComponent(contact)}`,
    label: contact,
    kind: "map",
  };
}

/** Turn phone numbers and web addresses inside plain text into links. */
export function Linkify({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    const raw = m[0];
    const isPhone = !!m[1];
    const trimmed = isPhone ? raw : raw.replace(/[.,;:]+$/, "");
    out.push(
      <a
        key={i}
        href={isPhone ? telHref(raw) : urlHref(trimmed)}
        target={isPhone ? undefined : "_blank"}
        rel="noreferrer"
        className="font-medium text-teal underline decoration-teal/30 underline-offset-2"
        onClick={(e) => e.stopPropagation()}
      >
        {trimmed}
      </a>,
    );
    last = i + trimmed.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
