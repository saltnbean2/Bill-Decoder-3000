import type { Analysis, Lang } from "./types";

/* The last few results, kept ONLY in this phone's browser storage (never sent anywhere). */

export interface RecentItem {
  id: string;
  at: number;
  lang: Lang;
  analysis: Analysis;
}

const KEY = "explainit.recent";
const MAX = 5;

export function loadRecent(): RecentItem[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentItem[];
    return Array.isArray(list) ? list.filter((r) => r?.analysis?.headline) : [];
  } catch {
    return [];
  }
}

export function saveRecent(analysis: Analysis, lang: Lang): RecentItem[] {
  if (analysis.document_type === "unreadable") return loadRecent();
  const list = loadRecent().filter((r) => r.analysis.headline !== analysis.headline);
  const next = [{ id: `${Date.now()}`, at: Date.now(), lang, analysis }, ...list].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: just don't remember */
  }
  return next;
}

export function clearRecent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
