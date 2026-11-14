import { normalizeAnalysis, refreshDeadline } from "./normalize";
import { LANGS, type Analysis, type Lang } from "./types";

/*
 * Share links for family: the whole result is compressed into the URL's #fragment.
 * Browsers never send the fragment to any server, so nothing about the document is
 * stored or logged anywhere — the link itself is the data.
 */

const PREFIX = "#r=";

function toB64Url(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export const canShareLinks = () => typeof window !== "undefined" && "CompressionStream" in window;

export async function buildShareLink(a: Analysis, lang: Lang): Promise<string | null> {
  if (!canShareLinks()) return null;
  try {
    const json = new TextEncoder().encode(JSON.stringify({ v: 1, l: lang, a }));
    const packed = await pipe(json, new CompressionStream("deflate-raw"));
    return `${window.location.origin}/${PREFIX}${toB64Url(packed)}`;
  } catch {
    return null;
  }
}

/** Reads a shared result from the current URL, if there is one. */
export async function readShareLink(): Promise<{ analysis: Analysis; lang: Lang } | null> {
  if (typeof window === "undefined" || !window.location.hash.startsWith(PREFIX) || !("DecompressionStream" in window)) return null;
  try {
    const bytes = await pipe(fromB64Url(window.location.hash.slice(PREFIX.length)), new DecompressionStream("deflate-raw"));
    const data = JSON.parse(new TextDecoder().decode(bytes)) as { v?: number; l?: string; a?: unknown };
    if (data.v !== 1 || !data.a) return null;
    const lang = LANGS.includes(data.l as Lang) ? (data.l as Lang) : "en";
    return { analysis: refreshDeadline(normalizeAnalysis(data.a)), lang };
  } catch {
    return null;
  }
}

export function clearShareLink() {
  if (typeof window !== "undefined" && window.location.hash.startsWith(PREFIX)) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}
