import { NextResponse, type NextRequest } from "next/server";

/*
 * Guard for the API routes. Every POST here spends money (Claude, Azure Speech) and carries
 * someone's private paperwork, so before a request reaches a route it must:
 *  1. come from this site's own pages (other websites can't use our API through a visitor's browser),
 *  2. be a sensible size (no multi-hundred-MB bodies held in memory),
 *  3. stay under a per-visitor rate limit (stops one script from running up the bill).
 *
 * The rate limit is in memory, so on serverless it is per instance: a speed bump, not a wall.
 * For a public launch, also set a monthly spend limit in the Anthropic console, and swap the Map
 * for a shared store (e.g. Upstash Redis / Vercel KV) if abuse shows up.
 */

const MB = 1024 * 1024;
const LIMITS: Record<string, { maxBytes: number; perWindow: number }> = {
  scan: { maxBytes: 13 * MB, perWindow: 20 },
  ask: { maxBytes: 13 * MB, perWindow: 40 },
  translate: { maxBytes: 256 * 1024, perWindow: 60 }, // a scan prefetches other languages
  letter: { maxBytes: 64 * 1024, perWindow: 30 },
  tts: { maxBytes: 32 * 1024, perWindow: 80 },
  ics: { maxBytes: 16 * 1024, perWindow: 30 },
};
const WINDOW_MS = 10 * 60 * 1000;

const hits = new Map<string, { count: number; reset: number }>();

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function rateLimited(key: string, max: number) {
  const now = Date.now();
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }
  const entry = hits.get(key);
  if (!entry || entry.reset <= now) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return null;
  }
  entry.count++;
  return entry.count > max ? Math.ceil((entry.reset - now) / 1000) : null;
}

function sameOrigin(req: NextRequest) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients; the rate limit still applies
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const deny = (error: string, status: number, headers?: Record<string, string>) =>
  NextResponse.json({ error }, { status, headers: { "cache-control": "no-store", ...headers } });

export function proxy(req: NextRequest) {
  if (req.method !== "POST") return NextResponse.next();
  const route = req.nextUrl.pathname.split("/")[2] ?? "";
  const limit = LIMITS[route];
  if (!limit) return NextResponse.next();

  if (!sameOrigin(req)) return deny("forbidden", 403);

  const length = Number(req.headers.get("content-length") ?? "0");
  if (length > limit.maxBytes) return deny("too_large", 413);

  const retry = rateLimited(`${route}:${clientIp(req)}`, limit.perWindow);
  if (retry) return deny("rate_limited", 429, { "retry-after": String(retry) });

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
