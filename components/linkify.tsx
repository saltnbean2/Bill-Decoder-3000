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

export type ContactLink = { href: string; label: string; kind: "tel" | "url" | "map" };

/**
 * Turn a contact string into tappable links. The model often packs several things into one
 * string ("www.city.org/contest, phone (818) 555-0172, or mail to ..."), so the phone number and
 * the website each get their own button, labelled with just that number or address.
 * A string with neither is treated as a street address.
 */
export function contactLinks(contact: string): ContactLink[] {
  const links: ContactLink[] = [];
  const phone = contact.match(PHONE);
  if (phone && phone[0].replace(/\D/g, "").length >= 10) {
    links.push({ href: telHref(phone[0]), label: phone[0].trim(), kind: "tel" });
  }
  const url = contact.match(URL_RE);
  if (url && !/@/.test(contact)) {
    const clean = url[0].replace(/[.,;:]+$/, "");
    links.push({ href: urlHref(clean), label: clean.replace(/^https?:\/\//i, ""), kind: "url" });
  }
  if (links.length) return links;
  return [{ href: `https://maps.google.com/?q=${encodeURIComponent(contact)}`, label: contact, kind: "map" }];
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
